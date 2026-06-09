const { sanitizeString, isValidArray, isHttpsUrl } = require("../utils/validation");
const logger = require("../utils/logger");
const { BadRequestError, NotFoundError, ForbiddenError, ConflictError } = require("../utils/errors");

const getUniqueLearnersCount = async (tx, mentorId) => {
    const sessions = await tx.session.findMany({
        where: { mentorId },
        select: { id: true }
    });
    const sessionIds = sessions.map(s => s.id);
    const bookings = await tx.booking.findMany({
        where: { sessionId: { in: sessionIds } },
        select: { userId: true }
    });
    const uniqueUserIds = new Set(bookings.map(b => b.userId));
    return uniqueUserIds.size;
};

exports.createSessionRequest = async (prisma, mentorId, data) => {
    const {
        title,
        description,
        subject,
        department,
        topics,
        mode,
        priceType,
        price,
        maxSeats,
        venue,
        meetingLink,
        proposedDate,
        duration
    } = data;

    if (!title || !description || !subject || !department || !mode || !proposedDate || !duration) {
        throw new BadRequestError("Missing required fields");
    }

    if (mode === "OFFLINE" && !venue) {
        throw new BadRequestError("Venue is required for offline sessions");
    }

    if (mode === "ONLINE" && !meetingLink) {
        throw new BadRequestError("Meeting link is required for online sessions");
    }

    if (meetingLink && !isHttpsUrl(meetingLink)) {
        throw new BadRequestError("meetingLink must be a valid https:// URL");
    }

    const sessionDate = new Date(proposedDate);
    if (sessionDate < new Date()) {
        throw new BadRequestError("Cannot create a session in the past. Please choose a future date and time.");
    }

    return await prisma.sessionRequest.create({
        data: {
            mentorId,
            title: sanitizeString(title),
            description: sanitizeString(description),
            subject: sanitizeString(subject),
            department: sanitizeString(department),
            topics: JSON.stringify(isValidArray(topics) ? topics : []),
            mode,
            priceType: priceType || "FREE",
            price: parseFloat(price) || 0,
            maxSeats: parseInt(maxSeats) || 0,
            venue: venue ? sanitizeString(venue) : null,
            meetingLink,
            proposedDate: new Date(proposedDate),
            duration: parseInt(duration),
            status: "PENDING"
        }
    });
};

exports.getSessionRequestById = async (prisma, userId, userRole, id) => {
    const request = await prisma.sessionRequest.findUnique({
        where: { id }
    });

    if (!request) {
        throw new NotFoundError("Session request not found");
    }

    if (request.mentorId !== userId && userRole !== 'ADMIN') {
        logger.warn("Access Denied: User is not mentor and not ADMIN", { userId, requestMentorId: request.mentorId });
        throw new ForbiddenError("Unauthorized to view this request");
    }

    return request;
};

exports.updateSessionRequest = async (prisma, userId, userRole, id, data) => {
    const {
        title,
        description,
        subject,
        department,
        topics,
        mode,
        priceType,
        price,
        maxSeats,
        venue,
        meetingLink,
        proposedDate,
        duration
    } = data;

    const request = await prisma.sessionRequest.findUnique({
        where: { id }
    });

    if (!request) {
        throw new NotFoundError("Session request not found");
    }

    if (request.mentorId !== userId && userRole !== 'ADMIN') {
        throw new ForbiddenError("Unauthorized to update this request");
    }

    if (request.status !== 'PENDING' && userRole !== 'ADMIN') {
        throw new BadRequestError("Only pending requests can be updated");
    }

    if (meetingLink !== undefined && !isHttpsUrl(meetingLink)) {
        throw new BadRequestError("meetingLink must be a valid https:// URL");
    }

    const requestUpdateData = {
        title: title ? sanitizeString(title) : undefined,
        description: description ? sanitizeString(description) : undefined,
        subject: subject ? sanitizeString(subject) : undefined,
        department: department ? sanitizeString(department) : undefined,
        topics: topics ? JSON.stringify(isValidArray(topics) ? topics : []) : undefined,
        mode,
        priceType,
        price: (price !== undefined && !isNaN(parseFloat(price))) ? parseFloat(price) : undefined,
        maxSeats: (maxSeats !== undefined && !isNaN(parseInt(maxSeats))) ? parseInt(maxSeats) : undefined,
        venue: venue ? sanitizeString(venue) : undefined,
        meetingLink: meetingLink !== undefined ? meetingLink : undefined,
        proposedDate: proposedDate ? new Date(proposedDate) : undefined,
        duration: (duration !== undefined && !isNaN(parseInt(duration))) ? parseInt(duration) : undefined,
    };

    const updatedRequest = await prisma.sessionRequest.update({
        where: { id },
        data: requestUpdateData
    });

    // If Admin is updating an APPROVED request, also update the linked Session
    if (userRole === 'ADMIN' && request.status === 'APPROVED') {
        try {
            logger.debug("Attempting to update linked session for Request ID:", { id });
            await prisma.session.update({
                where: { requestId: id },
                data: {
                    title: requestUpdateData.title,
                    description: requestUpdateData.description,
                    subject: requestUpdateData.subject,
                    department: requestUpdateData.department,
                    topics: requestUpdateData.topics,
                    mode: requestUpdateData.mode,
                    priceType: requestUpdateData.priceType,
                    price: requestUpdateData.price,
                    maxSeats: requestUpdateData.maxSeats,
                    venue: requestUpdateData.venue,
                    meetingLink: requestUpdateData.meetingLink,
                    scheduledAt: requestUpdateData.proposedDate,
                    duration: requestUpdateData.duration,
                }
            });
            logger.debug("Linked session updated successfully");
        } catch (sessionError) {
            logger.error("Failed to update linked session:", sessionError);
        }
    }

    return updatedRequest;
};

exports.getMyRequests = async (prisma, userId) => {
    return await prisma.sessionRequest.findMany({
        where: { mentorId: userId },
        orderBy: { requestedAt: 'desc' }
    });
};

exports.getMySessions = async (prisma, userId) => {
    return await prisma.session.findMany({
        where: { mentorId: userId },
        orderBy: { scheduledAt: 'asc' },
        include: {
            _count: {
                select: { bookings: true }
            }
        }
    });
};

exports.executeBookingTransaction = async (prisma, cache, userId, sessionId) => {
    const result = await prisma.$transaction(async (tx) => {
        const currentSession = await tx.session.findUnique({
            where: { id: sessionId }
        });

        if (!currentSession) {
            throw new NotFoundError("Session not found");
        }

        // Check if session has ended
        const sessionEndTime = new Date(currentSession.scheduledAt).getTime() + (currentSession.duration * 60 * 1000);
        if (Date.now() > sessionEndTime) {
            throw new BadRequestError("Registration closed: Session has ended");
        }

        const existingBooking = await tx.booking.findUnique({
            where: {
                userId_sessionId: {
                    userId,
                    sessionId: sessionId
                }
            }
        });

        if (existingBooking) {
            throw new BadRequestError("You have already booked this session");
        }

        // Atomically decrement seats if > 0
        try {
            await tx.session.update({
                where: {
                    id: sessionId,
                    availableSeats: { gt: 0 }
                },
                data: {
                    availableSeats: { decrement: 1 }
                }
            });
        } catch (err) {
            if (err.code === 'P2025') {
                throw new BadRequestError("Session is full");
            }
            throw err;
        }

        const booking = await tx.booking.create({
            data: {
                userId,
                sessionId: sessionId,
                status: 'CONFIRMED',
                amountPaid: 0
            }
        });

        // Recalculate unique learners for the mentor and update the denormalized database field
        const uniqueLearners = await getUniqueLearnersCount(tx, currentSession.mentorId);

        await tx.user.update({
            where: { id: currentSession.mentorId },
            data: { uniqueLearners }
        });

        return { booking, sessionId, mentorId: currentSession.mentorId };
    }, {
        timeout: 15000
    });

    // Invalidate profile stats cache for learner and mentor
    if (cache) {
        await cache.del(`profile_stats_${userId}`);
        await cache.del(`profile_stats_${result.mentorId}`);
    }

    return result;
};

exports.bookSession = async (prisma, cache, userId, sessionId) => {
    // 1. Fast fail if there is a cached failed status
    if (cache) {
        const cachedResult = await cache.get(`booking_result:${userId}:${sessionId}`);
        if (cachedResult && cachedResult.status === 'FAILED') {
            throw new BadRequestError(cachedResult.error);
        }
        if (cachedResult && cachedResult.status === 'CONFIRMED') {
            throw new BadRequestError("You have already booked this session");
        }
    }

    // 2. Check if a booking already exists in the database
    const existingBooking = await prisma.booking.findUnique({
        where: {
            userId_sessionId: {
                userId,
                sessionId
            }
        }
    });

    if (existingBooking) {
        throw new BadRequestError("You have already booked this session");
    }

    // 3. Delegate to booking queue
    const bookingQueue = require("../utils/bookingQueue");
    await bookingQueue.addBookingJob(prisma, cache, userId, sessionId);

    return { status: "PROCESSING", message: "Booking is in progress" };
};

exports.getBookingStatus = async (prisma, cache, userId, sessionId) => {
    // 1. Check if confirmed booking exists
    const booking = await prisma.booking.findUnique({
        where: {
            userId_sessionId: {
                userId,
                sessionId
            }
        }
    });

    if (booking) {
        return { status: 'CONFIRMED', booking };
    }

    // 2. Check if a failed or pending status is in cache
    if (cache) {
        const cachedResult = await cache.get(`booking_result:${userId}:${sessionId}`);
        if (cachedResult) {
            return cachedResult;
        }
    }

    // 3. Otherwise, still in progress
    return { status: 'PROCESSING', message: 'Booking is in progress' };
};

exports.getMyBookings = async (prisma, userId) => {
    const bookings = await prisma.booking.findMany({
        where: { userId },
        include: {
            session: {
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
                    resources: true,
                    quizzes: true
                }
            }
        },
        orderBy: { session: { scheduledAt: 'asc' } }
    });

    return bookings.map(b => ({
        ...b.session,
        bookingId: b.id,
        isBooked: true,
        bookingStatus: b.status,
        sessionStatus: b.session.status,
        hasReviewed: b.hasReviewed
    }));
};

exports.getAllSessions = async (prisma, cache, userId, queryParams) => {
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const type = queryParams.type || 'upcoming';
    const mode = queryParams.mode;
    const priceType = queryParams.priceType;
    const now = new Date();
    
    // Shared cache key without user specific parameters
    const cacheKey = `all_sessions_${page}_${limit}_${type}_${mode || 'all'}_${priceType || 'all'}`;

    let cachedData;

    if (cache && await cache.has(cacheKey)) {
        cachedData = await cache.get(cacheKey);
    } else {
        let whereClause = {};

        if (type === 'past') {
            whereClause = {
                OR: [
                    { status: 'COMPLETED' },
                    { status: 'CANCELLED' },
                    {
                        AND: [
                            { status: 'UPCOMING' },
                            { scheduledAt: { lt: now } }
                        ]
                    }
                ]
            };
        } else {
            // Default: UPCOMING (and LIVE)
            whereClause = {
                OR: [
                    { status: 'LIVE' },
                    {
                        AND: [
                            { status: 'UPCOMING' },
                            { scheduledAt: { gt: now } }
                        ]
                    }
                ]
            };
        }

        if (mode) {
            whereClause.mode = mode;
        }

        if (priceType) {
            whereClause.priceType = priceType;
        }

        const [sessions, total] = await Promise.all([
            prisma.session.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: {
                    mentor: {
                        select: {
                            id: true,
                            name: true,
                            profilePicture: true,
                            department: true,
                            year: true,
                            averageRating: true
                        }
                    },
                    resources: {
                        select: { id: true, title: true, fileType: true, fileUrl: true }
                    },
                    quizzes: {
                        select: { id: true, title: true, status: true }
                    },
                    reviews: {
                        take: 3,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            author: { select: { name: true, profilePicture: true } }
                        }
                    }
                },
                orderBy: { scheduledAt: type === 'past' ? 'desc' : 'asc' }
            }),
            prisma.session.count({
                where: whereClause
            })
        ]);

        cachedData = {
            sessions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

        if (cache) {
            await cache.set(cacheKey, cachedData, 300);
        }
    }

    // Fetch user specific bookings to merge isBooked status dynamically
    const sessionIds = cachedData.sessions.map(s => s.id);
    const userBookings = await prisma.booking.findMany({
        where: {
            userId,
            sessionId: { in: sessionIds }
        },
        select: { sessionId: true }
    });
    const userBookedSessionIds = new Set(userBookings.map(b => b.sessionId));

    const mappedSessions = cachedData.sessions.map(s => ({
        ...s,
        isBooked: userBookedSessionIds.has(s.id)
    }));

    return {
        sessions: mappedSessions,
        pagination: cachedData.pagination
    };
};

exports.getSessionById = async (prisma, userId, id) => {
    const session = await prisma.session.findUnique({
        where: { id },
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
            },
            resources: true,
            quizzes: true,
            codingQuestions: {
                where: { status: 'LIVE' },
                include: {
                    submissions: {
                        where: { userId, status: 'PASSED' },
                        select: { id: true }
                    }
                }
            },
            reviews: {
                take: 3,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: { select: { name: true, profilePicture: true } }
                }
            }
        }
    });

    if (!session) {
        throw new NotFoundError("Session not found");
    }

    const codingQuestionsWithStatus = session.codingQuestions.map(q => ({
        ...q,
        isSolved: q.submissions.length > 0
    }));

    const mappedSession = {
        ...session,
        codingQuestions: codingQuestionsWithStatus,
        isBooked: session.bookings.length > 0,
        hasReviewed: false
    };

    const userReview = await prisma.review.findFirst({
        where: {
            sessionId: id,
            authorId: userId
        }
    });

    mappedSession.hasReviewed = !!userReview;

    return mappedSession;
};

exports.getMentorStats = async (prisma, cache, mentorId) => {
    const cacheKey = `mentor_stats_${mentorId}`;

    if (cache && await cache.has(cacheKey)) {
        const cached = await cache.get(cacheKey);
        return cached.stats;
    }

    const [totalSessions, totalLearners, sessionStats, mentor] = await Promise.all([
        prisma.session.count({ where: { mentorId } }),
        prisma.booking.count({ where: { session: { mentorId } } }),
        prisma.session.aggregate({
            where: { mentorId },
            _sum: { duration: true }
        }),
        prisma.user.findUnique({
            where: { id: mentorId },
            select: { averageRating: true }
        })
    ]);

    const totalHours = Math.round((sessionStats._sum.duration || 0) / 60);

    const stats = {
        totalSessions,
        totalLearners,
        totalHours,
        averageRating: mentor?.averageRating || 0
    };

    if (cache) {
        await cache.set(cacheKey, { stats }, 300);
    }

    return stats;
};

exports.verifyAttendance = async (prisma, cache, mentorId, { bookingId, sessionId }) => {
    if (!bookingId || !sessionId) {
        throw new BadRequestError("Booking ID and Session ID are required");
    }

    const session = await prisma.session.findUnique({
        where: { id: sessionId }
    });

    if (!session) {
        throw new NotFoundError("Session not found");
    }

    // Verify Mentor owns the session
    if (session.mentorId !== mentorId) {
        throw new ForbiddenError("Unauthorized: You are not the mentor for this session");
    }

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { user: { select: { name: true, email: true } } }
    });

    if (!booking) {
        throw new NotFoundError("Booking not found");
    }

    if (booking.sessionId !== sessionId) {
        throw new BadRequestError("Invalid Ticket: This booking belongs to a different session");
    }

    if (booking.status !== 'CONFIRMED') {
        throw new BadRequestError("Payment Pending: This ticket is not paid/confirmed");
    }

    if (booking.attended) {
        throw new ConflictError("Already Scanned: This ticket has already been used");
    }

    // Mark as attended
    await prisma.booking.update({
        where: { id: bookingId },
        data: { attended: true, joinedAt: new Date() }
    });

    // Invalidate profile stats cache for learner and mentor
    if (cache) {
        await cache.del(`profile_stats_${session.mentorId}`);
        await cache.del(`profile_stats_${booking.userId}`);
    }

    return {
        user: booking.user,
        session: {
            title: session.title,
            mode: session.mode
        }
    };
};

exports.getRecentActivity = async (prisma, userId) => {
    const notifications = await prisma.notification.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 4
    });

    const sessions = await prisma.session.findMany({
        where: { mentorId: userId },
        select: { id: true }
    });
    const sessionIds = sessions.map(s => s.id);

    let reports = [];
    if (sessionIds.length > 0) {
        reports = await prisma.report.findMany({
            where: { sessionId: { in: sessionIds } },
            orderBy: { createdAt: 'desc' },
            take: 4,
            include: { session: { select: { title: true } } }
        });
    }

    // Normalize and Merge
    const normalizedNotifications = notifications.map(n => ({
        type: 'NOTIFICATION',
        data: n,
        createdAt: n.createdAt
    }));

    const normalizedReports = reports.map(r => ({
        type: 'REPORT',
        data: r,
        createdAt: r.createdAt
    }));

    const combined = [...normalizedNotifications, ...normalizedReports]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4);

    // Map to Activity Format
    return combined.map(item => {
        if (item.type === 'REPORT') {
            return {
                id: item.data.id,
                action: "Report Received",
                detail: `${item.data.reason} (Session: ${item.data.session.title})`,
                createdAt: item.data.createdAt,
                isNegative: true
            };
        } else {
            // Notification
            const n = item.data;
            let action = "Notification";
            switch (n.type) {
                case 'BOOKING_CONFIRMED': action = "New booking"; break;
                case 'NEW_REVIEW': action = "Review received"; break;
                case 'SESSION_REQUEST_APPROVED': action = "Session Approved"; break;
                case 'SESSION_REQUEST_REJECTED': action = "Session Rejected"; break;
                case 'ACHIEVEMENT_UNLOCKED': action = "Achievement Unlocked"; break;
                default: action = n.title;
            }
            return {
                id: n.id,
                action: action,
                detail: n.message,
                createdAt: n.createdAt
            };
        }
    });
};
