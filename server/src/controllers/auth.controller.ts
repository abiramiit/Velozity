import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util';
import { AuthRequest } from '../middleware/auth.middleware';

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    console.log('[DIAGNOSTIC] Login attempt for:', email);
    console.log('[DIAGNOSTIC] Parsed Environment DATABASE_URL:', process.env.DATABASE_URL);
    console.log('[DIAGNOSTIC] User found in DB:', !!user);
    if (!user) {
        res.status(401);
        throw Object.assign(new Error('Invalid email or password'), { code: 'UNAUTHORIZED' });
    }
    const match = await bcrypt.compare(password, user.password);
    console.log('[DIAGNOSTIC] Password matched:', match);
    if (!match) {
        res.status(401);
        throw Object.assign(new Error('Invalid email or password'), { code: 'UNAUTHORIZED' });
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    const decodedRefresh = verifyRefreshToken(refreshToken) as any;

    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(decodedRefresh.exp! * 1000)
        }
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
        success: true,
        data: {
            user: { id: user.id, email: user.email, role: user.role },
            accessToken
        }
    });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        res.status(401);
        throw Object.assign(new Error('No refresh token provided'), { code: 'UNAUTHORIZED' });
    }

    let decoded: any;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
        res.status(401);
        throw Object.assign(new Error('Invalid or expired refresh token'), { code: 'UNAUTHORIZED' });
    }

    const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
    });

    if (!tokenRecord) {
        res.status(401);
        throw Object.assign(new Error('Invalid refresh token'), { code: 'UNAUTHORIZED' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
        res.status(404);
        throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
    }

    // Use deleteMany to avoid throwing P2025 if concurrently deleted
    await prisma.refreshToken.deleteMany({ where: { id: tokenRecord.id } });

    const newAccessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);
    const newDecodedRefresh = verifyRefreshToken(newRefreshToken) as any;

    await prisma.refreshToken.create({
        data: {
            token: newRefreshToken,
            userId: user.id,
            expiresAt: new Date(newDecodedRefresh.exp! * 1000)
        }
    });

    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, data: { accessToken: newAccessToken } });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
        await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { id: true, email: true, role: true, createdAt: true }
    });
    if (!user) {
        res.status(404);
        throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
    }
    res.json({ success: true, data: user });
});
