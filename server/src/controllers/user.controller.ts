import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role } = req.query;
    const where: any = {};

    if (role && Object.values(Role).includes(role as Role)) {
        where.role = role;
    }

    const users = await prisma.user.findMany({
        where,
        select: { id: true, email: true, role: true }
    });

    res.json({ success: true, data: users });
});

export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        res.status(400);
        throw Object.assign(new Error('Email already wrapped to another user'), { code: 'BAD_REQUEST' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { email, password: hashed, role },
        select: { id: true, email: true, role: true, createdAt: true }
    });

    res.status(201).json({ success: true, data: user });
});

export const getTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role, id } = req.user!;
    if (role !== Role.PROJECT_MANAGER && role !== Role.ADMIN) {
        res.status(403);
        throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }

    const projects = await prisma.project.findMany({
        where: role === Role.PROJECT_MANAGER ? { createdById: id } : {},
        select: { id: true }
    });
    const projIds = projects.map(p => p.id);

    const devs = await prisma.user.findMany({
        where: {
            role: Role.DEVELOPER,
            tasksAssigned: { some: { projectId: { in: projIds } } }
        },
        include: {
            tasksAssigned: {
                where: { projectId: { in: projIds } },
                select: { id: true, status: true, priority: true, dueDate: true, title: true }
            }
        }
    });

    res.json({ success: true, data: devs });
});
