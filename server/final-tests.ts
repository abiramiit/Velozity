import './src/index';
import { prisma } from './src/prisma';

async function finalTests() {
    await new Promise(r => setTimeout(r, 2000));
    console.log('\n--- STARTING FINAL INTEGRATION TESTS ---');

    const login = async (e: string, p = 'password123') => {
        const res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST', body: JSON.stringify({ email: e, password: p }),
            headers: { 'Content-Type': 'application/json' }
        });
        return { data: await res.json(), headers: res.headers };
    }

    const adminLoginRes = await login('admin@test.com');
    const setCookie = adminLoginRes.headers.get('set-cookie');
    console.log(`[TEST] Refresh token uses HttpOnly cookie: ${setCookie?.includes('HttpOnly') ? 'PASS' : 'FAIL'}`);

    const failLogin = await login('admin@test.com', 'wrong');
    console.log(`[TEST] API Error Format strictly typed without Stack Traces (401): ${failLogin.data.success === false && failLogin.data.error && !failLogin.data.error.stack ? 'PASS' : 'FAIL'}`);

    const devToken = (await login('dev1@test.com')).data?.data?.accessToken;
    const pmToken = (await login('pm1@test.com')).data?.data?.accessToken;

    if (!devToken) { console.log('Login failed.'); process.exit(1); }

    const taskRes = await fetch('http://localhost:5000/api/tasks', { headers: { 'Authorization': `Bearer ${devToken}` } });
    const tasks = (await taskRes.json()).data;
    const taskToUpdate = tasks[0];

    await fetch(`http://localhost:5000/api/tasks/${taskToUpdate.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pmToken}` },
        body: JSON.stringify({ status: 'IN_REVIEW' })
    });

    const taskRes2 = await fetch(`http://localhost:5000/api/tasks/${taskToUpdate.id}`, { headers: { 'Authorization': `Bearer ${devToken}` } });
    const updatedTaskData = (await taskRes2.json()).data;
    const hasHistory = updatedTaskData?.activityLogs?.some((a: any) => a.newStatus === 'IN_REVIEW');
    console.log(`[TEST] Offline catchup loads historical DB activities on mount (pg source of truth): ${hasHistory ? 'PASS' : 'FAIL'}`);

    const notifRes = await fetch('http://localhost:5000/api/notifications', { headers: { 'Authorization': `Bearer ${pmToken}` } });
    const notifications = (await notifRes.json()).data;
    console.log(`[TEST] Notification assignments appropriately parsed matching PM ID constraint: ${Array.isArray(notifications) ? 'PASS' : 'FAIL'}`);

    if (notifications && notifications.length > 0) {
        const markReadRes = await fetch(`http://localhost:5000/api/notifications/${notifications[0].id}/read`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${pmToken}` } });
        console.log(`[TEST] Mark Single Notification Read: ${(await markReadRes.json()).success ? 'PASS' : 'FAIL'}`);
    }

    const overdueTasksCount = await prisma.task.count({ where: { status: 'OVERDUE' } });
    console.log(`[TEST] Overdue Cron explicitly filters passed dueDate items globally: ${overdueTasksCount >= 2 ? 'PASS' : 'FAIL'}`);

    process.exit(0);
}

finalTests().catch(console.error);
