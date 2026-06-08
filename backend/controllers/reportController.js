const logger = require("../utils/logger");

const createReport = async (req, res) => {
    try {
        const prisma = req.prisma;
        const { sessionId, reason } = req.body;
        const userId = req.user.id;

        if (!sessionId || !reason) {
            return res.status(400).json({ error: "Session ID and reason are required" });
        }

        const report = await prisma.report.create({
            data: {
                reporterId: userId,
                sessionId,
                reason,
                status: 'PENDING'
            }
        });

        res.status(201).json({ message: "Report submitted successfully", report });
    } catch (error) {
        logger.error("Error creating report:", error);
        res.status(500).json({ error: "Failed to submit report" });
    }
};

const getReportsForMentor = async (req, res) => {
    try {
        const prisma = req.prisma;
        const mentorId = req.user.id; // From auth middleware

        // Find sessions owned by this mentor
        const sessions = await prisma.session.findMany({
            where: { mentorId },
            select: { id: true }
        });

        const sessionIds = sessions.map(s => s.id);

        if (sessionIds.length === 0) {
            return res.json({ reports: [] });
        }

        // Find reports for these sessions
        const reports = await prisma.report.findMany({
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

        res.json({ reports });
    } catch (error) {
        logger.error("Error fetching mentor reports:", error);
        res.status(500).json({ error: "Failed to fetch reports" });
    }
};

module.exports = {
    createReport,
    getReportsForMentor
};
