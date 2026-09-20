import cron from 'node-cron';
import { prisma } from '../prisma';
import { TaskStatus } from '@prisma/client';

export const startCronJobs = () => {
    // Run every 10 minutes to properly catch overdue tasks
    cron.schedule('*/10 * * * *', async () => {
        console.log('[CRON] Checking for overdue tasks...');
        const now = new Date();

        // Find all incomplete tasks whose dueDate is past
        const overdueTasks = await prisma.task.findMany({
            where: {
                dueDate: { lt: now },
                status: { notIn: [TaskStatus.DONE, TaskStatus.OVERDUE] }
            }
        });

        if (overdueTasks.length > 0) {
            const ids = overdueTasks.map(t => t.id);
            await prisma.task.updateMany({
                where: { id: { in: ids } },
                data: { status: TaskStatus.OVERDUE }
            });

            console.log(`[CRON] Marked ${ids.length} tasks as OVERDUE.`);
        }
    });
};
