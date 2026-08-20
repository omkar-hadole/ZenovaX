const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const MIGRATION_NAME = '0003_learning_requests';
const SQL_PATH = path.join(__dirname, '../prisma/migrations', MIGRATION_NAME, 'migration.sql');

const prisma = new PrismaClient();

// Split a Prisma-generated migration into individual top-level statements.
// Each generated statement ends with ";\n" (no inline semicolons inside
// string literals or parens in the generated DDL), so this split is safe.
function splitStatements(sql) {
    return sql
        .split(/;\s*\r?\n/)
        .map(s => s.trim())
        .filter(Boolean);
}

async function main() {
    const existing = await prisma.learningRequest.count().catch(() => -1);
    if (existing !== -1) {
        console.log('Migration already applied — learning_requests table exists. Skipping.');
        return;
    }

    const sql = fs.readFileSync(SQL_PATH, 'utf8');
    const statements = splitStatements(sql);
    console.log(`Applying ${statements.length} statements from ${MIGRATION_NAME}...`);

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.slice(0, 60).replace(/\s+/g, ' ');
        try {
            await prisma.$executeRawUnsafe(stmt);
            console.log(`  [${i + 1}/${statements.length}] OK: ${preview}...`);
        } catch (err) {
            console.error(`  [${i + 1}/${statements.length}] FAILED: ${preview}...`);
            console.error(err.message);
            throw err;
        }
    }

    // Record the migration so future `prisma migrate deploy` runs skip it.
    const checksum = crypto.createHash('sha256').update(sql).digest('hex');
    const startedAt = new Date();
    await prisma.$executeRawUnsafe(
        `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES ($1, $2, $3, $4, $5, $6)`,
        crypto.randomUUID(),
        checksum,
        new Date(),
        MIGRATION_NAME,
        startedAt,
        statements.length
    );
    console.log('Migration recorded in _prisma_migrations.');
}

main()
    .catch(err => {
        console.error('Migration failed:', err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());