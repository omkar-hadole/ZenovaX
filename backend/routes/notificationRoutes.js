const express = require('express');
const router = express.Router();
const { protect, requireProfileComplete } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

router.use(protect, requireProfileComplete);

router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const unreadOnly = req.query.unreadOnly === 'true';

        const result = await notificationService.listNotifications(req.prisma, req.user.id, { page, limit, unreadOnly });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.get('/unread-count', async (req, res, next) => {
    try {
        const result = await notificationService.getUnreadCount(req.prisma, req.user.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.put('/read-all', async (req, res, next) => {
    try {
        const result = await notificationService.markAllAsRead(req.prisma, req.user.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.put('/:id/read', async (req, res, next) => {
    try {
        const notification = await notificationService.markAsRead(req.prisma, req.user.id, req.params.id);
        res.json({ notification });
    } catch (error) {
        next(error);
    }
});

router.post('/register-device', async (req, res, next) => {
    try {
        const result = await notificationService.registerDeviceToken(req.prisma, req.user.id, req.body.token);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
