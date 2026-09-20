"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("../prisma");
const client_1 = require("@prisma/client");
const startCronJobs = () => {
    // Run every 10 minutes to properly catch overdue tasks
    node_cron_1.default.schedule('*/10 * * * *', async () => {
        console.log('[CRON] Checking for overdue tasks...');
        const now = new Date();
        // Find all incomplete tasks whose dueDate is past
        const overdueTasks = await prisma_1.prisma.task.findMany({
            where: {
                dueDate: { lt: now },
                status: { notIn: [client_1.TaskStatus.DONE, client_1.TaskStatus.OVERDUE] }
            }
        });
        if (overdueTasks.length > 0) {
            const ids = overdueTasks.map(t => t.id);
            await prisma_1.prisma.task.updateMany({
                where: { id: { in: ids } },
                data: { status: client_1.TaskStatus.OVERDUE }
            });
            console.log(`[CRON] Marked ${ids.length} tasks as OVERDUE.`);
        }
    });
};
exports.startCronJobs = startCronJobs;
