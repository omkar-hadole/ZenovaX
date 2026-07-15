const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

router.post('/create', protect, authorize('MENTOR', 'BOTH'), async (req, res, next) => {
    try {
        const { title, description, fileUrl, fileType, sessionId } = req.body;
        const uploaderId = req.user.id;

        if (!title || !fileUrl || !fileType || !sessionId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const session = await req.prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.mentorId !== uploaderId) {
            return res.status(403).json({ message: 'You can only upload resources for your own sessions' });
        }

        const resource = await req.prisma.resource.create({
            data: {
                title,
                description,
                fileUrl,
                fileType,
                sessionId,
                uploaderId,
            },
        });

        // Best-effort: notify registered learners a resource was added. A failure
        // here shouldn't fail the upload itself, since the resource already saved.
        try {
            const bookings = await req.prisma.booking.findMany({
                where: { sessionId, status: 'CONFIRMED' },
                select: { userId: true }
            });
            if (bookings.length > 0) {
                await req.prisma.notification.createMany({
                    data: bookings.map(({ userId: learnerId }) => ({
                        userId: learnerId,
                        type: 'RESOURCE_UPLOADED',
                        title: 'New resource available',
                        message: `"${title}" was added to "${session.title}".`,
                        link: `/sessions/${sessionId}`
                    }))
                });
            }
        } catch (notifyError) {
            logger.error('Failed to notify learners of resource upload:', notifyError);
        }

        res.status(201).json({ message: 'Resource uploaded successfully', resource });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
