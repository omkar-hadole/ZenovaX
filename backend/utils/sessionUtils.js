/**
 * Calculates the count of finished sessions (COMPLETED or past UPCOMING/LIVE sessions) for a mentor.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function getFinishedSessionsCount(prisma, userId) {
    const now = new Date();
    return await prisma.session.count({
        where: {
            mentorId: userId,
            OR: [
                { status: 'COMPLETED' },
                {
                    AND: [
                        { status: { in: ['UPCOMING', 'LIVE'] } },
                        { scheduledAt: { lt: now } }
                    ]
                }
            ]
        }
    });
}

/**
 * Calculates the count of unique learners helped by a mentor.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function getUniqueLearnersCount(prisma, userId) {
    const bookings = await prisma.booking.findMany({
        where: {
            session: { mentorId: userId },
            status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        distinct: ['userId'],
        select: { userId: true }
    });
    return bookings.length;
}

module.exports = {
    getFinishedSessionsCount,
    getUniqueLearnersCount
};
