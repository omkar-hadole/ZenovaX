const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sanitizeString } = require('../utils/validation');

// Create a review
router.post('/create', auth, async (req, res) => {
    const { sessionId, rating, comment, isAnonymous } = req.body;
    const userId = req.user.id;

    if (!sessionId || !rating) {
        return res.status(400).json({ error: 'Session ID and rating are required' });
    }

    try {
        // Check if session exists
        const session = await req.prisma.session.findUnique({
            where: { id: sessionId },
            include: { mentor: true }
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Check if user has a booking
        const booking = await req.prisma.booking.findUnique({
            where: {
                userId_sessionId: {
                    userId: userId,
                    sessionId: sessionId
                }
            }
        });

        if (!booking) {
            return res.status(403).json({ error: 'You are not registered for this session' });
        }

        if (booking.hasReviewed) {
            return res.status(400).json({ error: 'You have already reviewed this session' });
        }

        // Create review and update booking/mentor stats in a transaction
        await req.prisma.$transaction(async (prisma) => {
            // 1. Create Review
            await prisma.review.create({
                data: {
                    authorId: userId,
                    mentorId: session.mentorId,
                    sessionId: sessionId,
                    rating: parseInt(rating),
                    comment: sanitizeString(comment),
                    isAnonymous: isAnonymous || false
                }
            });

            // 2. Update Booking
            await prisma.booking.update({
                where: { id: booking.id },
                data: { hasReviewed: true }
            });

            // 3. Recalculate Mentor Stats
            const stats = await prisma.review.aggregate({
                where: { mentorId: session.mentorId },
                _avg: { rating: true },
                _count: true
            });

            // 4. Update Mentor
            await prisma.user.update({
                where: { id: session.mentorId },
                data: {
                    averageRating: stats._avg.rating || 0,
                    totalReviews: stats._count
                }
            });
        }, {
            timeout: 20000 // Increase timeout to 20s
        });

        res.status(201).json({ message: 'Review submitted successfully' });
    } catch (error) {
        next(error);
    }
});

// Get reviews for a session
router.get('/session/:sessionId', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            req.prisma.review.findMany({
                where: { sessionId: req.params.sessionId },
                skip,
                take: limit,
                include: {
                    author: {
                        select: {
                            name: true,
                            profilePicture: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            req.prisma.review.count({
                where: { sessionId: req.params.sessionId }
            })
        ]);

        // Process anonymous reviews
        const processedReviews = reviews.map(review => {
            if (review.isAnonymous) {
                return {
                    ...review,
                    author: {
                        name: 'Anonymous',
                        profilePicture: null
                    }
                };
            }
            return review;
        });

        res.json({
            reviews: processedReviews,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get reviews for a mentor (Profile)
router.get('/mentor/:mentorId', async (req, res) => {
    try {
        const reviews = await req.prisma.review.findMany({
            where: { mentorId: req.params.mentorId },
            take: 5, // Limit to latest 5
            include: {
                author: {
                    select: {
                        name: true,
                        profilePicture: true
                    }
                },
                session: {
                    select: {
                        title: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Process anonymous reviews
        const processedReviews = reviews.map(review => {
            if (review.isAnonymous) {
                return {
                    ...review,
                    author: {
                        name: 'Anonymous',
                        profilePicture: null
                    }
                };
            }
            return review;
        });

        res.json({ reviews: processedReviews });
    } catch (error) {
        next(error);
    }
});

// Get authenticated mentor's reviews
router.get('/my-reviews', auth, async (req, res, next) => {
    try {
        const reviews = await req.prisma.review.findMany({
            where: { mentorId: req.user.id },
            include: {
                author: {
                    select: {
                        name: true,
                        profilePicture: true
                    }
                },
                session: {
                    select: {
                        title: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Process anonymous reviews
        const processedReviews = reviews.map(review => {
            if (review.isAnonymous) {
                return {
                    ...review,
                    author: {
                        name: 'Anonymous',
                        profilePicture: null
                    }
                };
            }
            return review;
        });

        res.json({ reviews: processedReviews });
    } catch (error) {
        next(error);
    }
});

// Get review stats for authenticated mentor
router.get('/stats', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all reviews for this mentor
        const reviews = await req.prisma.review.findMany({
            where: { mentorId: userId },
            select: { rating: true }
        });

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
            : 0;

        // Calculate distribution
        const distribution = [5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => r.rating === star).length;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return { stars: star, count, percentage };
        });

        res.json({
            averageRating,
            totalReviews,
            distribution
        });
    } catch (error) {
        console.error('Fetch review stats error:', error);
        res.status(500).json({ error: 'Failed to fetch review stats' });
    }
});

// Get review stats for a specific mentor (Public)
router.get('/stats/:mentorId', async (req, res) => {
    try {
        const userId = req.params.mentorId;

        // Get all reviews for this mentor
        const reviews = await req.prisma.review.findMany({
            where: { mentorId: userId },
            select: { rating: true }
        });

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
            : 0;

        // Calculate distribution
        const distribution = [5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => r.rating === star).length;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return { stars: star, count, percentage };
        });

        res.json({
            averageRating,
            totalReviews,
            distribution
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
