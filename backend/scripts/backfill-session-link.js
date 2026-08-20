require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LR_ID = '38fab4c7-a9da-4d1e-af62-01cbd275b134';
const SESSION_ID = '829a4574-e3ec-4d44-bd77-006caf244a3a';

async function main() {
    const lr = await prisma.learningRequest.findUnique({ where: { id: LR_ID }, include: { interests: true } });
    if (!lr) throw new Error('Learning request not found');
    if (lr.sessionId || lr.status !== 'OPEN') {
        console.log('LR already linked/transitioned — nothing to do. status=', lr.status, 'sessionId=', lr.sessionId);
        return;
    }

    const session = await prisma.session.findUnique({ where: { id: SESSION_ID } });
    if (!session) throw new Error('Session not found');

    const result = await prisma.$transaction(async (tx) => {
        const [updatedLr] = await Promise.all([
            tx.learningRequest.update({
                where: { id: LR_ID },
                data: { status: 'SESSION_CREATED', sessionId: SESSION_ID }
            }),
            tx.session.update({
                where: { id: SESSION_ID },
                data: { learningRequestId: LR_ID }
            })
        ]);

        const existing = await tx.notification.count({
            where: { type: 'LEARNING_REQUEST_SESSION_CREATED', link: `/sessions/${SESSION_ID}` }
        });
        if (existing > 0) {
            console.log('Notifications already exist for this session — skipping.');
            return { updatedLr, notified: 0 };
        }

        const notified = await tx.notification.createMany({
            data: lr.interests.map(i => ({
                userId: i.learnerId,
                type: 'LEARNING_REQUEST_SESSION_CREATED',
                title: 'Session created for your learning request',
                message: `A mentor created a session for "${lr.topic}"`,
                link: `/sessions/${SESSION_ID}`
            }))
        });
        return { updatedLr, notified: notified.count };
    }, { timeout: 10000 });

    console.log('LR status ->', result.updatedLr.status, '| sessionId ->', result.updatedLr.sessionId);
    console.log('session.learningRequestId ->', (await prisma.session.findUnique({ where: { id: SESSION_ID } })).learningRequestId);
    console.log('notifications created ->', result.notified);
    console.log('recipients ->', lr.interests.map(i => i.learnerId).sort().join(','));
}

main()
    .catch(e => { console.error('FAIL', e); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());