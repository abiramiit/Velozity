import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    res.json({ success: true, data: notifications });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const notifId = req.params.id as string;

    const notif = await prisma.notification.findUnique({ where: { id: notifId } });
    if (!notif || notif.userId !== req.user!.id) {
        res.status(404);
        throw Object.assign(new Error('Notification not found'), { code: 'NOT_FOUND' });
    }

    const updated = await prisma.notification.update({
        where: { id: notifId },
        data: { read: true }
    });

    res.json({ success: true, data: updated });
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    await prisma.notification.updateMany({
        where: { userId: req.user!.id, read: false },
        data: { read: true }
    });

    res.json({ success: true });
});

export const createNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recipientId, message } = req.body;

    // Simple verification (in reality, restrict Developers from arbitrary messaging PMs here via roles)
    if (req.user!.role === 'DEVELOPER') {
        res.status(403);
        throw Object.assign(new Error('Developers cannot send direct outbound messages'), { code: 'FORBIDDEN' });
    }

    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) {
        res.status(404);
        throw Object.assign(new Error('Recipient not found'), { code: 'NOT_FOUND' });
    }

    const sender = await prisma.user.findUnique({ where: { id: req.user!.id } });

    const notification = await prisma.notification.create({
        data: {
            userId: recipientId,
            message: `${(sender?.email || 'Someone').split('@')[0]} sent a message: "${message}"`
        }
    });

    // We can emit this via global App instance or through a socket helper if we expose io.
    // Assuming io is accessible from index.ts:
    try {
        const { io } = require('../index');
        io.to(`user_${recipientId}`).emit('new-notification', notification);
    } catch (e) {
        console.error("Socket emission failed", e);
    }

    res.status(201).json({ success: true, data: notification });
});
