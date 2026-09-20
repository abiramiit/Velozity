import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import asyncHandler from 'express-async-handler';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

export const requireAuth = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        res.status(401);
        throw Object.assign(new Error('Not authorized, no token'), { code: 'UNAUTHORIZED' });
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401);
        throw Object.assign(new Error('Not authorized, token failed'), { code: 'UNAUTHORIZED' });
    }
});

export const requireRole = (roles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role as Role)) {
            res.status(403);
            next(Object.assign(new Error('Forbidden: Insufficient permissions'), { code: 'FORBIDDEN' }));
            return;
        }
        next();
    };
};
