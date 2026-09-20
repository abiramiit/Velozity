import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { Role, TaskStatus, Priority } from '@prisma/client';
import { logTaskActivity, notifyAssignment } from '../services/activity.service';

export const getTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role, id } = req.user!;
    const { status, priority, from, to } = req.query;

    const where: any = {};

    if (status) where.status = status as string as TaskStatus;
    if (priority) where.priority = priority as string as Priority;
    if (from || to) {
        where.dueDate = {};
        if (from) where.dueDate.gte = new Date(from as string);
        if (to) where.dueDate.lte = new Date(to as string);
    }

    if (role === Role.DEVELOPER) {
        where.assignedDeveloperId = id;
    } else if (role === Role.PROJECT_MANAGER) {
        where.project = { createdById: id };
    }

    const tasks = await prisma.task.findMany({
        where,
        include: {
            project: { select: { id: true, name: true, createdById: true } },
            assignedDeveloper: { select: { email: true, id: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: tasks });
});

export const getTaskById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const taskId = req.params.id as string;
    const { role, id: userId } = req.user!;

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true, activityLogs: { include: { user: { select: { email: true } } }, orderBy: { timestamp: 'desc' } } }
    });

    if (!task) {
        res.status(404);
        throw Object.assign(new Error('Task not found'), { code: 'NOT_FOUND' });
    }

    if (role === Role.DEVELOPER && task.assignedDeveloperId !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: You can only view your attached tasks'), { code: 'FORBIDDEN' });
    }

    if (role === Role.PROJECT_MANAGER && (task as any).project?.createdById !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: Task does not belong to your project'), { code: 'FORBIDDEN' });
    }

    res.json({ success: true, data: task });
});

export const createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, description, projectId, assignedDeveloperId, priority, dueDate } = req.body;
    const { role, id: userId } = req.user!;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        res.status(404);
        throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' });
    }

    if (role === Role.PROJECT_MANAGER && project.createdById !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: You can only create tasks for your own project'), { code: 'FORBIDDEN' });
    }

    const task = await prisma.task.create({
        data: {
            title, description, projectId, assignedDeveloperId, priority: priority || Priority.MEDIUM,
            dueDate: dueDate ? new Date(dueDate) : null
        },
        include: { project: true }
    });

    if (assignedDeveloperId) {
        await notifyAssignment(assignedDeveloperId, task.title);
    }

    res.status(201).json({ success: true, data: task });
});

export const updateTask = asyncHandler(async (req: AuthRequest, res: Response) => {
    // general edit (title, desc, assignment). PM and Admin only
    const taskId = req.params.id as string;
    const data = req.body;
    const { role, id: userId } = req.user!;

    const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
    if (!task) {
        res.status(404);
        throw Object.assign(new Error('Task not found'), { code: 'NOT_FOUND' });
    }

    if (role === Role.PROJECT_MANAGER && (task as any).project?.createdById !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }

    const newlyAssigned = data.assignedDeveloperId && data.assignedDeveloperId !== task.assignedDeveloperId;

    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data
    });

    if (newlyAssigned) {
        await notifyAssignment(data.assignedDeveloperId, updatedTask.title);
    }

    res.json({ success: true, data: updatedTask });
});

export const updateTaskStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const taskId = req.params.id as string;
    const { status: newStatus } = req.body;
    const { role, id: userId } = req.user!;

    const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
    if (!task) {
        res.status(404);
        throw Object.assign(new Error('Task not found'), { code: 'NOT_FOUND' });
    }

    if (role === Role.DEVELOPER && task.assignedDeveloperId !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: Not your task'), { code: 'FORBIDDEN' });
    }
    if (role === Role.PROJECT_MANAGER && (task as any).project?.createdById !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: Not your project'), { code: 'FORBIDDEN' });
    }

    const oldStatus = task.status;

    // Use transaction to ensure both task update and log succeed
    const [updatedTask, log] = await prisma.$transaction(async (tx) => {
        const updated = await tx.task.update({
            where: { id: taskId },
            data: { status: newStatus }
        });

        const activity = await logTaskActivity(userId, (task as any).projectId, taskId, oldStatus, newStatus, (task as any).project?.createdById, (task as any).assignedDeveloperId);

        return [updated, activity];
    });

    res.json({ success: true, data: updatedTask });
});
