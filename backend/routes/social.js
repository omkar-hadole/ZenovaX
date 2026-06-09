const express = require("express");
const { protect } = require("../middleware/auth");

const router = express.Router();
const { addJob } = require("../utils/queue");

router.post("/follow/:id", protect, async (req, res, next) => {
    try {
        const { id: followingId } = req.params;
        const followerId = req.user.id;

        if (followerId === followingId) {
            return res.status(400).json({ error: "Cannot follow yourself" });
        }

        const follow = await req.prisma.follow.create({
            data: {
                followerId,
                followingId,
            },
        });

        if (req.cache) {
            req.cache.del(`profile_stats_${followingId}`);
        }

        await addJob(req.prisma, 'CALCULATE_BADGES', { userId: followingId });

        return res.json({ success: true, follow });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Already following" });
        }
        return next(error);
    }
});

router.delete("/follow/:id", protect, async (req, res, next) => {
    try {
        const { id: followingId } = req.params;
        const followerId = req.user.id;

        await req.prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        if (req.cache) {
            req.cache.del(`profile_stats_${followingId}`);
        }

        return res.json({ success: true });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(400).json({ error: "Not following" });
        }
        return next(error);
    }
});

router.post("/like/:id", protect, async (req, res, next) => {
    try {
        const { id: mentorId } = req.params;
        const userId = req.user.id;

        if (userId === mentorId) {
            return res.status(400).json({ error: "Cannot like yourself" });
        }

        const like = await req.prisma.like.create({
            data: {
                userId,
                mentorId,
            },
        });

        if (req.cache) {
            req.cache.del(`profile_stats_${mentorId}`);
        }

        await addJob(req.prisma, 'CALCULATE_BADGES', { userId: mentorId });

        return res.json({ success: true, like });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Already liked" });
        }
        return next(error);
    }
});

router.delete("/like/:id", protect, async (req, res, next) => {
    try {
        const { id: mentorId } = req.params;
        const userId = req.user.id;

        await req.prisma.like.delete({
            where: {
                userId_mentorId: {
                    userId,
                    mentorId,
                },
            },
        });

        if (req.cache) {
            req.cache.del(`profile_stats_${mentorId}`);
        }

        return res.json({ success: true });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(400).json({ error: "Not liked" });
        }
        return next(error);
    }
});

module.exports = router;
