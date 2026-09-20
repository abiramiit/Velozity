const { execSync } = require('child_process');

function run() {
    if (!process.env.DATABASE_URL) {
        console.log('No DATABASE_URL found. Skipping migrations.');
        return;
    }

    let dbUrl = process.env.DATABASE_URL;

    // Neon DB Push requires direct connection without pooler or channel binding formats.
    if (dbUrl.includes('-pooler') || dbUrl.includes('channel_binding')) {
        console.log('Detected Neon Pooled URL. Rewriting to direct connection for Prisma CLI...');
        dbUrl = dbUrl.replace('-pooler', '');
        dbUrl = dbUrl.replace('&channel_binding=require', '');
        // Ensure we don't break simple URLs
        process.env.DATABASE_URL = dbUrl;
    }

    try {
        console.log('Pushing database schema...');
        execSync('npx prisma db push', { stdio: 'inherit', env: process.env });

        console.log('Running database seed...');
        // Only run seed if we can find it
        const fs = require('fs');
        if (fs.existsSync('./dist/prisma/seed.js')) {
            execSync('node dist/prisma/seed.js', { stdio: 'inherit', env: process.env });
        } else {
            console.log('Seed file not found, skipping seed.');
        }
    } catch (err) {
        console.error('Startup migration execution failed', err);
        process.exit(1);
    }
}

run();
