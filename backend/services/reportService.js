const { BadRequestError } = require("../utils/errors");

exports.createReport = async (prisma, userId, { sessionId, reason }) => {
    if (!sessionId || !reason) {
        throw new BadRequestError("Session ID and reason are required");
    }

    return await prisma.report.create({
        data: {
            reporterId: userId,
            sessionId,
            reason,
            status: 'PENDING'
        }
    });
};

exports.getReportsForMentor = async (prisma, mentorId) => {
    // Find sessions owned by this mentor
    const sessions = await prisma.session.findMany({
        where: { mentorId },
        select: { id: true }
    });

    const sessionIds = sessions.map(s => s.id);

    if (sessionIds.length === 0) {
        return [];
    }

    // Find reports for these sessions
    return await prisma.report.findMany({
        where: {
            sessionId: { in: sessionIds }
        },
        include: {
            session: {
                select: { title: true }
            },
            reporter: {
                select: { name: true, email: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};
