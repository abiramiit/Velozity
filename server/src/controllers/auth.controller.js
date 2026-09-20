"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.refresh = exports.login = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../prisma");
const jwt_util_1 = require("../utils/jwt.util");
exports.login = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    console.log('[DIAGNOSTIC] Login attempt for:', email);
    console.log('[DIAGNOSTIC] Parsed Environment DATABASE_URL:', process.env.DATABASE_URL);
    console.log('[DIAGNOSTIC] User found in DB:', !!user);
    if (!user) {
        res.status(401);
        throw Object.assign(new Error('Invalid email or password'), { code: 'UNAUTHORIZED' });
    }
    const match = await bcrypt_1.default.compare(password, user.password);
    console.log('[DIAGNOSTIC] Password matched:', match);
    if (!match) {
        res.status(401);
        throw Object.assign(new Error('Invalid email or password'), { code: 'UNAUTHORIZED' });
    }
    const accessToken = (0, jwt_util_1.generateAccessToken)(user.id, user.role);
    const refreshToken = (0, jwt_util_1.generateRefreshToken)(user.id);
    const decodedRefresh = (0, jwt_util_1.verifyRefreshToken)(refreshToken);
    await prisma_1.prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(decodedRefresh.exp * 1000)
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
exports.refresh = (0, express_async_handler_1.default)(async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        res.status(401);
        throw Object.assign(new Error('No refresh token provided'), { code: 'UNAUTHORIZED' });
    }
    let decoded;
    try {
        decoded = (0, jwt_util_1.verifyRefreshToken)(refreshToken);
    }
    catch (err) {
        res.status(401);
        throw Object.assign(new Error('Invalid or expired refresh token'), { code: 'UNAUTHORIZED' });
    }
    const tokenRecord = await prisma_1.prisma.refreshToken.findUnique({
        where: { token: refreshToken }
    });
    if (!tokenRecord) {
        res.status(401);
        throw Object.assign(new Error('Invalid refresh token'), { code: 'UNAUTHORIZED' });
    }
    const user = await prisma_1.prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
        res.status(404);
        throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
    }
    // Use deleteMany to avoid throwing P2025 if concurrently deleted
    await prisma_1.prisma.refreshToken.deleteMany({ where: { id: tokenRecord.id } });
    const newAccessToken = (0, jwt_util_1.generateAccessToken)(user.id, user.role);
    const newRefreshToken = (0, jwt_util_1.generateRefreshToken)(user.id);
    const newDecodedRefresh = (0, jwt_util_1.verifyRefreshToken)(newRefreshToken);
    await prisma_1.prisma.refreshToken.create({
        data: {
            token: newRefreshToken,
            userId: user.id,
            expiresAt: new Date(newDecodedRefresh.exp * 1000)
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
exports.logout = (0, express_async_handler_1.default)(async (req, res) => {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
        await prisma_1.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
});
exports.getMe = (0, express_async_handler_1.default)(async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, role: true, createdAt: true }
    });
    if (!user) {
        res.status(404);
        throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
    }
    res.json({ success: true, data: user });
});
