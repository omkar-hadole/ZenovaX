const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');

router.post('/create', authenticateToken, async (req, res, next) => {
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

        res.status(201).json({ message: 'Resource uploaded successfully', resource });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
