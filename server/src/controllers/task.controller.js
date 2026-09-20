"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskStatus = exports.updateTask = exports.createTask = exports.getTaskById = exports.getTasks = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../prisma");
const client_1 = require("@prisma/client");
const activity_service_1 = require("../services/activity.service");
exports.getTasks = (0, express_async_handler_1.default)(async (req, res) => {
    const { role, id } = req.user;
    const { status, priority, from, to } = req.query;
    const where = {};
    if (status)
        where.status = status;
    if (priority)
        where.priority = priority;
    if (from || to) {
        where.dueDate = {};
        if (from)
            where.dueDate.gte = new Date(from);
        if (to)
            where.dueDate.lte = new Date(to);
    }
    if (role === client_1.Role.DEVELOPER) {
        where.assignedDeveloperId = id;
    }
    else if (role === client_1.Role.PROJECT_MANAGER) {
        where.project = { createdById: id };
    }
    const tasks = await prisma_1.prisma.task.findMany({
        where,
        include: {
            project: { select: { id: true, name: true, createdById: true } },
            assignedDeveloper: { select: { email: true, id: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: tasks });
});
exports.getTaskById = (0, express_async_handler_1.default)(async (req, res) => {
    const taskId = req.params.id;
    const { role, id: userId } = req.user;
    const task = await prisma_1.prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true, activityLogs: { include: { user: { select: { email: true } } }, orderBy: { timestamp: 'desc' } } }
    });
    if (!task) {
        res.status(404);
        throw Object.assign(new Error('Task not found'), { code: 'NOT_FOUND' });
    }
    if (role === client_1.Role.DEVELOPER && task.assignedDeveloperId !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: You can only view your attached tasks'), { code: 'FORBIDDEN' });
    }
    if (role === client_1.Role.PROJECT_MANAGER && task.project?.createdById !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: Task does not belong to your project'), { code: 'FORBIDDEN' });
    }
    res.json({ success: true, data: task });
});
exports.createTask = (0, express_async_handler_1.default)(async (req, res) => {
    const { title, description, projectId, assignedDeveloperId, priority, dueDate } = req.body;
    const { role, id: userId } = req.user;
    const project = await prisma_1.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        res.status(404);
        throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' });
    }
    if (role === client_1.Role.PROJECT_MANAGER && project.createdById !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: You can only create tasks for your own project'), { code: 'FORBIDDEN' });
    }
    const task = await prisma_1.prisma.task.create({
        data: {
            title, description, projectId, assignedDeveloperId, priority: priority || client_1.Priority.MEDIUM,
            dueDate: dueDate ? new Date(dueDate) : null
        },
        include: { project: true }
    });
    if (assignedDeveloperId) {
        await (0, activity_service_1.notifyAssignment)(assignedDeveloperId, task.title);
    }
    res.status(201).json({ success: true, data: task });
});
exports.updateTask = (0, express_async_handler_1.default)(async (req, res) => {
    // general edit (title, desc, assignment). PM and Admin only
    const taskId = req.params.id;
    const data = req.body;
    const { role, id: userId } = req.user;
    const task = await prisma_1.prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
    if (!task) {
        res.status(404);
        throw Object.assign(new Error('Task not found'), { code: 'NOT_FOUND' });
    }
    if (role === client_1.Role.PROJECT_MANAGER && task.project?.createdById !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }
    const newlyAssigned = data.assignedDeveloperId && data.assignedDeveloperId !== task.assignedDeveloperId;
    const updatedTask = await prisma_1.prisma.task.update({
        where: { id: taskId },
        data
    });
    if (newlyAssigned) {
        await (0, activity_service_1.notifyAssignment)(data.assignedDeveloperId, updatedTask.title);
    }
    res.json({ success: true, data: updatedTask });
});
exports.updateTaskStatus = (0, express_async_handler_1.default)(async (req, res) => {
    const taskId = req.params.id;
    const { status: newStatus } = req.body;
    const { role, id: userId } = req.user;
    const task = await prisma_1.prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
    if (!task) {
        res.status(404);
        throw Object.assign(new Error('Task not found'), { code: 'NOT_FOUND' });
    }
    if (role === client_1.Role.DEVELOPER && task.assignedDeveloperId !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: Not your task'), { code: 'FORBIDDEN' });
    }
    if (role === client_1.Role.PROJECT_MANAGER && task.project?.createdById !== userId) {
        res.status(403);
        throw Object.assign(new Error('Forbidden: Not your project'), { code: 'FORBIDDEN' });
    }
    const oldStatus = task.status;
    // Use transaction to ensure both task update and log succeed
    const [updatedTask, log] = await prisma_1.prisma.$transaction(async (tx) => {
        const updated = await tx.task.update({
            where: { id: taskId },
            data: { status: newStatus }
        });
        const activity = await (0, activity_service_1.logTaskActivity)(userId, task.projectId, taskId, oldStatus, newStatus, task.project?.createdById, task.assignedDeveloperId);
        return [updated, activity];
    });
    res.json({ success: true, data: updatedTask });
});
