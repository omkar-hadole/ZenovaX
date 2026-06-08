const { calculateBadges } = require("../utils/badges");

exports.getDashboardData = async (req, res, next) => {
    try {
        const prisma = req.prisma;
        const userId = req.user.id;
        const now = new Date();

        // Perform parallel queries for upcoming sessions, top mentors, and user bookings
        const [rawUpcomingSessions, topMentors, activeBookings] = await Promise.all([
            // 1. Fetch 5 upcoming sessions that have not ended yet
            prisma.session.findMany({
                where: {
                    status: 'UPCOMING',
                    scheduledAt: { gt: now }
                },
                take: 5,
                orderBy: { scheduledAt: 'asc' },
                include: {
                    mentor: {
                        select: {
                            id: true,
                            name: true,
                            profilePicture: true,
                            department: true,
                            averageRating: true
                        }
                    },
                    bookings: {
                        where: { userId },
                        select: { id: true }
                    }
                }
            }),

            // 2. Fetch top 3 mentors by average rating and session volume
            prisma.user.findMany({
                where: {
                    role: 'MENTOR',
                    isProfileComplete: true
                },
                orderBy: [
                    { averageRating: 'desc' },
                    { totalSessions: 'desc' }
                ],
                take: 3,
                select: {
                    id: true,
                    name: true,
                    department: true,
                    profilePicture: true,
                    averageRating: true,
                    totalSessions: true,
                    totalReviews: true,
                    mentorSkills: true,
                    _count: {
                        select: {
                            followers: true,
                            likesReceived: true
                        }
                    }
                }
            }),

            // 3. Fetch active bookings (CONFIRMED/upcoming) for the current user
            prisma.booking.findMany({
                where: {
                    userId,
                    status: 'CONFIRMED',
                    session: {
                        status: { in: ['UPCOMING', 'LIVE'] }
                    }
                },
                include: {
                    session: {
                        include: {
                            mentor: {
                                select: {
                                    id: true,
                                    name: true,
                                    profilePicture: true,
                                    department: true
                                }
                            }
                        }
                    }
                },
                orderBy: { session: { scheduledAt: 'asc' } }
            })
        ]);

        // Mapped response transformations

        // 1. Mapped upcoming sessions (append isBooked flag)
        const upcomingSessions = rawUpcomingSessions.map(s => {
            const { bookings, ...sessionData } = s;
            return {
                ...sessionData,
                isBooked: bookings.length > 0
            };
        });

        // 2. Hydrate top 3 mentors with unique learners and badges
        const topMentorIds = topMentors.map(m => m.id);
        
        let uniqueLearnersMap = new Map();
        if (topMentorIds.length > 0) {
            // Get unique learner counts for the top 3 mentors
            const topMentorBookings = await prisma.booking.groupBy({
                by: ['sessionId', 'userId'],
                where: {
                    status: { in: ['CONFIRMED', 'COMPLETED'] },
                    session: { mentorId: { in: topMentorIds } }
                }
            });

            const topMentorSessions = await prisma.session.findMany({
                where: { mentorId: { in: topMentorIds } },
                select: { id: true, mentorId: true }
            });
            const sessionToMentorMap = new Map(topMentorSessions.map(s => [s.id, s.mentorId]));

            const mentorLearnersSetMap = new Map();
            for (const booking of topMentorBookings) {
                const mentorId = sessionToMentorMap.get(booking.sessionId);
                if (mentorId) {
                    if (!mentorLearnersSetMap.has(mentorId)) {
                        mentorLearnersSetMap.set(mentorId, new Set());
                    }
                    mentorLearnersSetMap.get(mentorId).add(booking.userId);
                }
            }

            for (const [mentorId, learnersSet] of mentorLearnersSetMap.entries()) {
                uniqueLearnersMap.set(mentorId, learnersSet.size);
            }
        }

        const hydratedTopMentors = topMentors.map(mentor => {
            let skills = [];
            try {
                skills = mentor.mentorSkills ? JSON.parse(mentor.mentorSkills) : [];
            } catch (e) {}

            const uniqueLearners = uniqueLearnersMap.get(mentor.id) || 0;
            const badges = calculateBadges({
                ...mentor,
                totalSessions: mentor.totalSessions
            }, uniqueLearners);

            return {
                id: mentor.id,
                name: mentor.name,
                department: mentor.department,
                profilePicture: mentor.profilePicture,
                mentorSkills: skills,
                averageRating: mentor.averageRating,
                totalSessions: mentor.totalSessions,
                totalReviews: mentor.totalReviews,
                followersCount: mentor._count.followers,
                likesCount: mentor._count.likesReceived,
                uniqueLearners,
                badges
            };
        });

        // 3. Mapped active bookings (flatten session detail)
        const myBookings = activeBookings.map(b => ({
            bookingId: b.id,
            bookingStatus: b.status,
            attended: b.attended,
            ...b.session
        }));

        return res.json({
            upcomingSessions,
            topMentors: hydratedTopMentors,
            myBookings
        });

    } catch (error) {
        return next(error);
    }
};
