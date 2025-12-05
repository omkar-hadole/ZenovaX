const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Successfully connected to database!');

        const count = await prisma.user.count();
        console.log(`Found ${count} users.`);

        await prisma.$disconnect();
    } catch (e) {
        console.error('Error connecting to database:', e);
        process.exit(1);
    }
}

main();
