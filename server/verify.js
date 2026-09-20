"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./src/index");
async function runTests() {
    await new Promise(r => setTimeout(r, 2000));
    console.log('\n--- STARTING VERIFICATION ---');
    // Login Dev 1
    const dev1loginDesc = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'dev1@test.com', password: 'password123' })
    });
    const dev1Res = await dev1loginDesc.json();
    const dev1Token = dev1Res.data?.accessToken;
    const dev1User = dev1Res.data?.user;
    console.log(`[TEST] Dev1 Login: ${dev1Res.success ? 'PASS' : 'FAIL'}`);
    if (!dev1Res.success) {
        console.log(dev1Res);
        process.exit(1);
    }
    // Scenario A: Fetch all tasks for Dev 1
    const devTasksRes = await fetch('http://localhost:5000/api/tasks', {
        headers: { 'Authorization': `Bearer ${dev1Token}` }
    });
    const devTasks = await devTasksRes.json();
    const allAssigned = devTasks.data.every((t) => t.assignedDeveloperId === dev1User.id);
    console.log(`[TEST] Developer only sees assigned tasks (Scenario A): ${allAssigned ? 'PASS' : 'FAIL'} (${devTasks.data.length} tasks)`);
    // Login PM 1
    const pm1login = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'pm1@test.com', password: 'password123' })
    });
    const pm1Res = await pm1login.json();
    const pm1Token = pm1Res.data.accessToken;
    // Login PM 2
    const pm2login = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'pm2@test.com', password: 'password123' })
    });
    const pm2Res = await pm2login.json();
    const pm2Token = pm2Res.data.accessToken;
    // Fetch projects for PM 1
    const pm1ProjectsReq = await fetch('http://localhost:5000/api/projects', {
        headers: { 'Authorization': `Bearer ${pm1Token}` }
    });
    const pm1Projects = await pm1ProjectsReq.json();
    const pm1ProjId = pm1Projects.data[0].id;
    // Scenario C: PM 2 tries to access PM 1's project
    const pm2AccessReq = await fetch(`http://localhost:5000/api/projects/${pm1ProjId}`, {
        headers: { 'Authorization': `Bearer ${pm2Token}` }
    });
    console.log(`[TEST] PM 2 cannot access PM 1 project (Scenario C): ${pm2AccessReq.status === 403 ? 'PASS' : 'FAIL'} (Status: ${pm2AccessReq.status})`);
    // Scenario B: Dev 1 tries to access PM's project endpoints directly
    const dev1AccessReq = await fetch(`http://localhost:5000/api/projects/${pm1ProjId}`, {
        headers: { 'Authorization': `Bearer ${dev1Token}` }
    });
    console.log(`[TEST] Dev cannot access PM project data (Scenario B): ${dev1AccessReq.status === 403 ? 'PASS' : 'FAIL'} (Status: ${dev1AccessReq.status})`);
    // Login Admin
    const adminlogin = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'password123' })
    });
    const adminRes = await adminlogin.json();
    const adminToken = adminRes.data.accessToken;
    const adminProjectsReq = await fetch('http://localhost:5000/api/projects', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminProjects = await adminProjectsReq.json();
    console.log(`[TEST] Admin can access all projects: ${adminProjects.data.length >= 3 ? 'PASS' : 'FAIL'} (Count: ${adminProjects.data.length})`);
    // Scenario D: Task Status Change creates ActivityLog
    const taskToUpdate = devTasks.data.find((t) => t.status === 'TODO');
    if (taskToUpdate) {
        const updateReq = await fetch(`http://localhost:5000/api/tasks/${taskToUpdate.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${dev1Token}` },
            body: JSON.stringify({ status: 'IN_PROGRESS' })
        });
        const activityReq = await fetch(`http://localhost:5000/api/tasks/${taskToUpdate.id}`, {
            headers: { 'Authorization': `Bearer ${dev1Token}` }
        });
        const updatedTask = await activityReq.json();
        const actCreated = updatedTask.data.activityLogs.some((a) => a.newStatus === 'IN_PROGRESS');
        console.log(`[TEST] Dev status update creates ActivityLog: ${actCreated ? 'PASS' : 'FAIL'}`);
    }
    process.exit(0);
}
runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
