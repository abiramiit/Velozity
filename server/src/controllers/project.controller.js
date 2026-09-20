"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProject = exports.createProject = exports.getProjectById = exports.getProjects = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../prisma");
const client_1 = require("@prisma/client");
exports.getProjects = (0, express_async_handler_1.default)(async (req, res) => {
    const { role, id } = req.user;
    let projects;
    if (role === client_1.Role.ADMIN) {
        projects = await prisma_1.prisma.project.findMany({
            include: {
                client: true,
                createdBy: { select: { id: true, email: true } },
                tasks: { select: { id: true, status: true, dueDate: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    else if (role === client_1.Role.PROJECT_MANAGER) {
        projects = await prisma_1.prisma.project.findMany({
            where: { createdById: id },
            include: {
                client: true,
                createdBy: { select: { id: true, email: true } },
                tasks: { select: { id: true, status: true, dueDate: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    else {
        // Developers shouldn't access full project list, only tasks.
        res.status(403);
        throw Object.assign(new Error('Forbidden: Developers cannot view all projects'), { code: 'FORBIDDEN' });
        return;
    }
    res.json({ success: true, data: projects });
});
exports.getProjectById = (0, express_async_handler_1.default)(async (req, res) => {
    const projectId = req.params.id;
    const { role, id: userId } = req.user;
    const project = await prisma_1.prisma.project.findUnique({
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
    if (role === client_1.Role.PROJECT_MANAGER && project.createdById !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: You can only view your own projects'), { code: 'FORBIDDEN' });
    }
    if (role === client_1.Role.DEVELOPER) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: Developers cannot view project details directly'), { code: 'FORBIDDEN' });
    }
    res.json({ success: true, data: project });
});
exports.createProject = (0, express_async_handler_1.default)(async (req, res) => {
    const { name, description, clientId, createdById } = req.body;
    let pmId = req.user.id; // defaults to self
    // If ADMIN creates a project, they can optionally bind a specific project manager
    if (req.user.role === client_1.Role.ADMIN && createdById) {
        pmId = createdById;
    }
    const project = await prisma_1.prisma.project.create({
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
exports.updateProject = (0, express_async_handler_1.default)(async (req, res) => {
    const projectId = req.params.id;
    const { name, description, clientId } = req.body;
    const { role, id: userId } = req.user;
    const existingProject = await prisma_1.prisma.project.findUnique({ where: { id: projectId } });
    if (!existingProject) {
        res.status(404);
        throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' });
    }
    if (role === client_1.Role.PROJECT_MANAGER && existingProject.createdById !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: You can only edit your own projects'), { code: 'FORBIDDEN' });
    }
    const updatedProject = await prisma_1.prisma.project.update({
        where: { id: projectId },
        data: { name, description, clientId }
    });
    res.json({ success: true, data: updatedProject });
});
