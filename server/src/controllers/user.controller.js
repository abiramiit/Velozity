"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeam = exports.createUser = exports.getUsers = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../prisma");
const client_1 = require("@prisma/client");
exports.getUsers = (0, express_async_handler_1.default)(async (req, res) => {
    const { role } = req.query;
    const where = {};
    if (role && Object.values(client_1.Role).includes(role)) {
        where.role = role;
    }
    const users = await prisma_1.prisma.user.findMany({
        where,
        select: { id: true, email: true, role: true }
    });
    res.json({ success: true, data: users });
});
exports.createUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password, role } = req.body;
    const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        res.status(400);
        throw Object.assign(new Error('Email already wrapped to another user'), { code: 'BAD_REQUEST' });
    }
    const hashed = await bcrypt_1.default.hash(password, 10);
    const user = await prisma_1.prisma.user.create({
        data: { email, password: hashed, role },
        select: { id: true, email: true, role: true, createdAt: true }
    });
    res.status(201).json({ success: true, data: user });
});
exports.getTeam = (0, express_async_handler_1.default)(async (req, res) => {
    const { role, id } = req.user;
    if (role !== client_1.Role.PROJECT_MANAGER && role !== client_1.Role.ADMIN) {
        res.status(403);
        throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }
    const projects = await prisma_1.prisma.project.findMany({
        where: role === client_1.Role.PROJECT_MANAGER ? { createdById: id } : {},
        select: { id: true }
    });
    const projIds = projects.map(p => p.id);
    const devs = await prisma_1.prisma.user.findMany({
        where: {
            role: client_1.Role.DEVELOPER,
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
