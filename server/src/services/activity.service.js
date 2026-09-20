"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyAssignment = exports.logTaskActivity = void 0;
const prisma_1 = require("../prisma");
const client_1 = require("@prisma/client");
const socket_service_1 = require("./socket.service");
const logTaskActivity = async (userId, projectId, taskId, oldStatus, newStatus, pmId, assignedDeveloperId) => {
    const activity = await prisma_1.prisma.activityLog.create({
        data: {
            userId,
            projectId,
            taskId,
            oldStatus,
            newStatus
        },
        include: {
            user: { select: { email: true, id: true } },
            task: { select: { title: true } },
            project: { select: { id: true, name: true } }
        }
    });
    // Broadcast event
    (0, socket_service_1.broadcastActivity)(projectId, assignedDeveloperId, pmId, activity);
    // If moved to In Review, notify PM
    if (newStatus === client_1.TaskStatus.IN_REVIEW) {
        const notif = await prisma_1.prisma.notification.create({
            data: {
                userId: pmId,
                message: `Task "${activity.task.title}" is ready for review.`
            }
        });
        (0, socket_service_1.sendNotification)(pmId, notif);
    }
    return activity;
};
exports.logTaskActivity = logTaskActivity;
const notifyAssignment = async (developerId, taskTitle) => {
    const notif = await prisma_1.prisma.notification.create({
        data: {
            userId: developerId,
            message: `You have been assigned to task "${taskTitle}".`
        }
    });
    (0, socket_service_1.sendNotification)(developerId, notif);
};
exports.notifyAssignment = notifyAssignment;
