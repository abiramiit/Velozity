import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead, createNotification } from '../controllers/notification.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);
notificationRouter.get('/', getNotifications);
notificationRouter.post('/', requireRole([Role.ADMIN, Role.PROJECT_MANAGER]), createNotification);
notificationRouter.patch('/read-all', markAllAsRead);
notificationRouter.patch('/:id/read', markAsRead);
