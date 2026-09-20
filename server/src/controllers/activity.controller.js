"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentActivity = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../prisma");
const client_1 = require("@prisma/client");
exports.getRecentActivity = (0, express_async_handler_1.default)(async (req, res) => {
    const { role, id } = req.user;
    const where = {};
    if (role === client_1.Role.DEVELOPER) {
        where.task = { assignedDeveloperId: id };
    }
    else if (role === client_1.Role.PROJECT_MANAGER) {
        where.project = { createdById: id };
    }
    if (req.query.projectId) {
        where.projectId = req.query.projectId;
    }
    const activities = await prisma_1.prisma.activityLog.findMany({
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
