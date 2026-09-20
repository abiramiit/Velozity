import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

export const getProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role, id } = req.user!;
    let projects;

    if (role === Role.ADMIN) {
        projects = await prisma.project.findMany({
            include: {
                client: true,
                createdBy: { select: { id: true, email: true } },
                tasks: { select: { id: true, status: true, dueDate: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    } else if (role === Role.PROJECT_MANAGER) {
        projects = await prisma.project.findMany({
            where: { createdById: id },
            include: {
                client: true,
                createdBy: { select: { id: true, email: true } },
                tasks: { select: { id: true, status: true, dueDate: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    } else {
        // Developers shouldn't access full project list, only tasks.
        res.status(403);
        throw Object.assign(new Error('Forbidden: Developers cannot view all projects'), { code: 'FORBIDDEN' });
        return;
    }

    res.json({ success: true, data: projects });
});

export const getProjectById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = req.params.id as string;
    const { role, id: userId } = req.user!;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            client: true,
            tasks: {
                include: {
                    assignedDeveloper: { select: { id: true, email: true } }
                }
            }
        }
    });

    if (!project) {
        res.status(404);
        throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' });
    }

    // Authorization check inside controller
    if (role === Role.PROJECT_MANAGER && project.createdById !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: You can only view your own projects'), { code: 'FORBIDDEN' });
    }

    if (role === Role.DEVELOPER) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: Developers cannot view project details directly'), { code: 'FORBIDDEN' });
    }

    res.json({ success: true, data: project });
});

export const createProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, description, clientId, createdById } = req.body;
    let pmId = req.user!.id; // defaults to self

    // If ADMIN creates a project, they can optionally bind a specific project manager
    if (req.user!.role === Role.ADMIN && createdById) {
        pmId = createdById;
    }

    const project = await prisma.project.create({
        data: {
            name,
            description,
            clientId,
            createdById: pmId
        },
        include: { client: true, createdBy: { select: { id: true, email: true } }, tasks: { select: { id: true, status: true, dueDate: true, priority: true } } }
    });
    res.status(201).json({ success: true, data: project });
});

export const updateProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = req.params.id as string;
    const { name, description, clientId } = req.body;
    const { role, id: userId } = req.user!;

    const existingProject = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existingProject) {
        res.status(404);
        throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' });
    }

    if (role === Role.PROJECT_MANAGER && existingProject.createdById !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: You can only edit your own projects'), { code: 'FORBIDDEN' });
    }

    const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: { name, description, clientId }
    });

    res.json({ success: true, data: updatedProject });
});
