import 'dotenv/config';
import { PrismaClient, Role, TaskStatus, Priority } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Clearing database...');
    await prisma.activityLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.client.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const hashed = await bcrypt.hash('password123', 10);

    console.log('Creating Admin...');
    const admin = await prisma.user.create({
        data: { email: 'admin@test.com', password: hashed, role: Role.ADMIN }
    });

    console.log('Creating 2 PMs...');
    const pm1 = await prisma.user.create({ data: { email: 'pm1@test.com', password: hashed, role: Role.PROJECT_MANAGER } });
    const pm2 = await prisma.user.create({ data: { email: 'pm2@test.com', password: hashed, role: Role.PROJECT_MANAGER } });

    console.log('Creating 4 Developers...');
    const devs = await Promise.all([
        prisma.user.create({ data: { email: 'dev1@test.com', password: hashed, role: Role.DEVELOPER } }),
        prisma.user.create({ data: { email: 'dev2@test.com', password: hashed, role: Role.DEVELOPER } }),
        prisma.user.create({ data: { email: 'dev3@test.com', password: hashed, role: Role.DEVELOPER } }),
        prisma.user.create({ data: { email: 'dev4@test.com', password: hashed, role: Role.DEVELOPER } }),
    ]);

    console.log('Creating Client and Projects...');
    const client = await prisma.client.create({ data: { name: 'Acme Corp' } });

    const p1 = await prisma.project.create({ data: { name: 'Website Redesign', clientId: client.id, createdById: pm1.id } });
    const p2 = await prisma.project.create({ data: { name: 'Mobile App API', clientId: client.id, createdById: pm1.id } });
    const p3 = await prisma.project.create({ data: { name: 'Internal CRM', clientId: client.id, createdById: pm2.id } });

    console.log('Creating Tasks...');
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);

    const createTasksForProject = async (projectId: string, dev1: string, dev2: string) => {
        await prisma.task.createMany({
            data: [
                { title: 'Setup Repo', projectId, assignedDeveloperId: dev1, status: TaskStatus.DONE, priority: Priority.HIGH, dueDate: nextWeek },
                { title: 'Auth Service', projectId, assignedDeveloperId: dev2, status: TaskStatus.IN_PROGRESS, priority: Priority.CRITICAL, dueDate: nextWeek },
                { title: 'Database Schema', projectId, assignedDeveloperId: dev1, status: TaskStatus.IN_REVIEW, priority: Priority.HIGH, dueDate: nextWeek },
                { title: 'Email Templates', projectId, assignedDeveloperId: dev2, status: TaskStatus.TODO, priority: Priority.LOW, dueDate: nextWeek },
                { title: 'Payment Gateway (OVERDUE)', projectId, assignedDeveloperId: dev1, status: TaskStatus.TODO, priority: Priority.MEDIUM, dueDate: yesterday },
            ]
        });
    };

    await createTasksForProject(p1.id, devs[0].id, devs[1].id);
    await createTasksForProject(p2.id, devs[2].id, devs[3].id);
    await createTasksForProject(p3.id, devs[0].id, devs[2].id);

    console.log('Creating Activity Logs...');
    const tasks = await prisma.task.findMany();
    for (const t of tasks.filter(t => t.status === TaskStatus.IN_REVIEW)) {
        await prisma.activityLog.create({
            data: {
                userId: t.assignedDeveloperId!,
                projectId: t.projectId,
                taskId: t.id,
                oldStatus: TaskStatus.IN_PROGRESS,
                newStatus: TaskStatus.IN_REVIEW
            }
        });
    }

    console.log('Creating Notifications...');
    await prisma.notification.create({
        data: { userId: pm1.id, message: 'Welcome to the dashboard!' }
    });

    console.log('Database seeded perfectly!');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
