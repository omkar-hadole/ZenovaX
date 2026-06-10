const { calculateBadges } = require("../utils/badges");

exports.getDashboardData = async (prisma, cache, userId) => {
    const now = new Date();

    // 1. Fetch upcoming sessions (cached or fresh)
    const upcomingSessionsCacheKey = "dashboard_upcoming_sessions";
    let cachedUpcomingSessions;

    if (cache && await cache.has(upcomingSessionsCacheKey)) {
        cachedUpcomingSessions = await cache.get(upcomingSessionsCacheKey);
    } else {
        cachedUpcomingSessions = await prisma.session.findMany({
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
                }
            }
        });

        if (cache) {
            await cache.set(upcomingSessionsCacheKey, cachedUpcomingSessions, 300); // 5 minutes TTL
        }
    }

    // 2. Fetch top mentors (cached or fresh)
    const topMentorsCacheKey = "dashboard_top_mentors";
    let cachedTopMentors;

    if (cache && await cache.has(topMentorsCacheKey)) {
        cachedTopMentors = await cache.get(topMentorsCacheKey);
    } else {
        const topMentors = await prisma.user.findMany({
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
                uniqueLearners: true,
                _count: {
                    select: {
                        followers: true,
                        likesReceived: true
                    }
                }
            }
        });

        cachedTopMentors = topMentors.map(mentor => {
            let skills = [];
            try {
                skills = mentor.mentorSkills ? JSON.parse(mentor.mentorSkills) : [];
            } catch (e) {}

            const uniqueLearners = mentor.uniqueLearners || 0;
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

        if (cache) {
            await cache.set(topMentorsCacheKey, cachedTopMentors, 300); // 5 minutes TTL
        }
    }

    // 3. Fetch user active bookings & check which upcoming sessions are booked by the user
    const upcomingSessionIds = cachedUpcomingSessions.map(s => s.id);

    const [activeBookings, userUpcomingBookings] = await Promise.all([
        // Active bookings for the current user (must be fetched fresh)
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
        }),

        // Check if user is booked for the cached upcoming sessions
        prisma.booking.findMany({
            where: {
                userId,
                sessionId: { in: upcomingSessionIds },
                status: { in: ['CONFIRMED', 'COMPLETED'] }
            },
            select: { sessionId: true }
        })
    ]);

    const userBookedSessionIds = new Set(userUpcomingBookings.map(b => b.sessionId));

    // Map the upcoming sessions to attach user-specific isBooked flag
    const upcomingSessions = cachedUpcomingSessions.map(s => ({
        ...s,
        isBooked: userBookedSessionIds.has(s.id)
    }));

    // Flatten myBookings active sessions details
    const myBookings = activeBookings.map(b => ({
        bookingId: b.id,
        bookingStatus: b.status,
        attended: b.attended,
        ...b.session
    }));

    return {
        upcomingSessions,
        topMentors: cachedTopMentors,
        myBookings
    };
};
