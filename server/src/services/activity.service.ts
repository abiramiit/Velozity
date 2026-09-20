import { prisma } from '../prisma';
import { TaskStatus } from '@prisma/client';
import { broadcastActivity, sendNotification } from './socket.service';

export const logTaskActivity = async (
    userId: string,
    projectId: string,
    taskId: string,
    oldStatus: TaskStatus | null,
    newStatus: TaskStatus,
    pmId: string,
    assignedDeveloperId: string | null
) => {
    const activity = await prisma.activityLog.create({
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
    broadcastActivity(projectId, assignedDeveloperId, pmId, activity);

    // If moved to In Review, notify PM
    if (newStatus === TaskStatus.IN_REVIEW) {
        const notif = await prisma.notification.create({
            data: {
                userId: pmId,
                message: `Task "${activity.task.title}" is ready for review.`
            }
        });
        sendNotification(pmId, notif);
    }

    return activity;
};

export const notifyAssignment = async (developerId: string, taskTitle: string) => {
    const notif = await prisma.notification.create({
        data: {
            userId: developerId,
            message: `You have been assigned to task "${taskTitle}".`
        }
    });
    sendNotification(developerId, notif);
};
