async function test() {
    try {
        console.log('Attempting login with admin@test.com / password123...');
        const res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@test.com', password: 'password123' })
        });

        let cookieHeaderStr = '';
        if (res.status === 200) {
            console.log('LOGIN SUCCESS!');
            const rawCookies = res.headers.get('set-cookie');
            if (rawCookies) {
                // The native fetch API might merge multiple Set-Cookie headers with commas.
                // We just send them all back as Cookie header raw since Express parses them
                cookieHeaderStr = rawCookies.replace(/, /g, '; ');
            }
        } else {
            console.log('LOGIN ERROR:', res.status, await res.text());
            return;
        }

        console.log('Attempting to fetch /api/auth/me...');
        const mRes = await fetch('http://localhost:5000/api/auth/me', {
            headers: { Cookie: cookieHeaderStr }
        });
        if (mRes.status === 200) {
            console.log('ME FETCH SUCCESS.');
        } else {
            console.log('\n--- ME ERROR ---');
            console.log('Status:', mRes.status);
            console.log('Data:', await mRes.text());
        }

        console.log('Attempting to fetch /api/projects...');
        const pRes = await fetch('http://localhost:5000/api/projects', {
            headers: { Cookie: cookieHeaderStr }
        });
        if (pRes.status === 200) {
            const data = await pRes.json();
            console.log('PROJECTS FETCH SUCCESS. Count:', data.data.length);
        } else {
            console.log('\n--- PROJECTS ERROR ---');
            console.log('Status:', pRes.status);
            console.log('Data:', await pRes.text());
        }

        console.log('Attempting to fetch /api/tasks...');
        const tRes = await fetch('http://localhost:5000/api/tasks', {
            headers: { Cookie: cookieHeaderStr }
        });
        if (tRes.status === 200) {
            const data = await tRes.json();
            console.log('TASKS FETCH SUCCESS. Count:', data.data.length);
        } else {
            console.log('\n--- TASKS ERROR ---');
            console.log('Status:', tRes.status);
            console.log('Data:', await tRes.text());
        }

    } catch (e) {
        console.log('\n--- FETCH ERROR ---');
        console.log(e);
    }
}

test();
