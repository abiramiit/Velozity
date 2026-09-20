"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../prisma");
exports.getNotifications = (0, express_async_handler_1.default)(async (req, res) => {
    const notifications = await prisma_1.prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    res.json({ success: true, data: notifications });
});
exports.markAsRead = (0, express_async_handler_1.default)(async (req, res) => {
    const notifId = req.params.id;
    const notif = await prisma_1.prisma.notification.findUnique({ where: { id: notifId } });
    if (!notif || notif.userId !== req.user.id) {
        res.status(404);
        throw Object.assign(new Error('Notification not found'), { code: 'NOT_FOUND' });
    }
    const updated = await prisma_1.prisma.notification.update({
        where: { id: notifId },
        data: { read: true }
    });
    res.json({ success: true, data: updated });
});
exports.markAllAsRead = (0, express_async_handler_1.default)(async (req, res) => {
    await prisma_1.prisma.notification.updateMany({
        where: { userId: req.user.id, read: false },
        data: { read: true }
    });
    res.json({ success: true });
});
exports.createNotification = (0, express_async_handler_1.default)(async (req, res) => {
    const { recipientId, message } = req.body;
    // Simple verification (in reality, restrict Developers from arbitrary messaging PMs here via roles)
    if (req.user.role === 'DEVELOPER') {
        res.status(403);
        throw Object.assign(new Error('Developers cannot send direct outbound messages'), { code: 'FORBIDDEN' });
    }
    const recipient = await prisma_1.prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) {
        res.status(404);
        throw Object.assign(new Error('Recipient not found'), { code: 'NOT_FOUND' });
    }
    const sender = await prisma_1.prisma.user.findUnique({ where: { id: req.user.id } });
    const notification = await prisma_1.prisma.notification.create({
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
    }
    catch (e) {
        console.error("Socket emission failed", e);
    }
    res.status(201).json({ success: true, data: notification });
});
