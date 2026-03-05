require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./database');

async function migrate() {
    const migrationsDir = path.join(__dirname, '../../migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    console.log(`Running ${files.length} migration(s)...`);

    for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        console.log(`  → ${file}`);
        await pool.query(sql);
    }

    console.log('Migrations completed successfully.');
    await pool.end();
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
