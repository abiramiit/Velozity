import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

export const getRecentActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role, id } = req.user!;

    const where: any = {};

    if (role === Role.DEVELOPER) {
        where.task = { assignedDeveloperId: id };
    } else if (role === Role.PROJECT_MANAGER) {
        where.project = { createdById: id };
    }

    if (req.query.projectId) {
        where.projectId = req.query.projectId as string;
    }

    const activities = await prisma.activityLog.findMany({
        where,
        include: {
            user: { select: { id: true, email: true } },
            task: { select: { id: true, title: true } },
            project: { select: { id: true, name: true } }
        },
        orderBy: { timestamp: 'desc' },
        take: 20
    });

    res.json({ success: true, data: activities });
});
