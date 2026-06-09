const { sanitizeString, isValidArray, isHttpsUrl } = require("../utils/validation");
const logger = require("../utils/logger");

exports.createSessionRequest = async (req, res, next) => {
    try {
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
        } = req.body;

        if (!title || !description || !subject || !department || !mode || !proposedDate || !duration) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (mode === "OFFLINE" && !venue) {
            return res.status(400).json({ error: "Venue is required for offline sessions" });
        }

        if (mode === "ONLINE" && !meetingLink) {
            return res.status(400).json({ error: "Meeting link is required for online sessions" });
        }

        if (meetingLink && !isHttpsUrl(meetingLink)) {
            return res.status(400).json({ error: "meetingLink must be a valid https:// URL" });
        }

        const sessionDate = new Date(proposedDate);
        if (sessionDate < new Date()) {
            return res.status(400).json({ error: "Cannot create a session in the past. Please choose a future date and time." });
        }

        const sessionRequest = await req.prisma.sessionRequest.create({
            data: {
                mentorId: req.user.id,
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

        return res.status(201).json({
            success: true,
            message: "Session request submitted successfully",
            request: sessionRequest
        });

    } catch (error) {
        return next(error);
    }
};

exports.getSessionRequestById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const request = await req.prisma.sessionRequest.findUnique({
            where: { id }
        });

        if (!request) {
            return res.status(404).json({ error: "Session request not found" });
        }

        const user = await req.prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        logger.debug("getSessionRequestById Debug:", { userId: user.id, role: user.role, requestMentorId: request.mentorId });

        if (request.mentorId !== user.id && user.role !== 'ADMIN') {
            logger.warn("Access Denied: User is not mentor and not ADMIN", { userId: user.id, requestMentorId: request.mentorId });
            return res.status(403).json({ error: "Unauthorized to view this request" });
        }

        return res.json({ request });
    } catch (error) {
        return next(error);
    }
};

exports.updateSessionRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
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
        } = req.body;

        const request = await req.prisma.sessionRequest.findUnique({
            where: { id }
        });

        if (!request) {
            return res.status(404).json({ error: "Session request not found" });
        }

        const user = await req.prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        if (request.mentorId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ error: "Unauthorized to update this request" });
        }

        if (request.status !== 'PENDING' && user.role !== 'ADMIN') {
            return res.status(400).json({ error: "Only pending requests can be updated" });
        }

        if (meetingLink !== undefined && !isHttpsUrl(meetingLink)) {
            return res.status(400).json({ error: "meetingLink must be a valid https:// URL" });
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

        const updatedRequest = await req.prisma.sessionRequest.update({
            where: { id },
            data: requestUpdateData
        });

        // If Admin is updating an APPROVED request, also update the linked Session
        if (user.role === 'ADMIN' && request.status === 'APPROVED') {
            try {
                logger.debug("Attempting to update linked session for Request ID:", { id });
                await req.prisma.session.update({
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
                if (sessionError.code !== 'P2025') {
                }
            }
        }

        return res.json({
            success: true,
            message: "Session request updated successfully",
            request: updatedRequest
        });
    } catch (error) {
        return next(error);
    }
};

exports.getMyRequests = async (req, res, next) => {
    try {
        const requests = await req.prisma.sessionRequest.findMany({
            where: { mentorId: req.user.id },
            orderBy: { requestedAt: 'desc' }
        });
        return res.json({ requests });
    } catch (error) {
        return next(error);
    }
};

exports.getMySessions = async (req, res, next) => {
    try {
        const sessions = await req.prisma.session.findMany({
            where: { mentorId: req.user.id },
            orderBy: { scheduledAt: 'asc' },
            include: {
                _count: {
                    select: { bookings: true }
                }
            }
        });

        return res.json({ sessions });
    } catch (error) {
        return next(error);
    }
};

exports.bookSession = async (req, res, next) => {
    try {
        const sessionId = req.params.id;

        const result = await req.prisma.$transaction(async (tx) => {
            const currentSession = await tx.session.findUnique({
                where: { id: sessionId }
            });

            if (!currentSession) {
                throw new Error("SESSION_NOT_FOUND");
            }

            // Check if session has ended
            const sessionEndTime = new Date(currentSession.scheduledAt).getTime() + (currentSession.duration * 60 * 1000);
            if (Date.now() > sessionEndTime) {
                throw new Error("SESSION_ENDED");
            }

            const existingBooking = await tx.booking.findUnique({
                where: {
                    userId_sessionId: {
                        userId: req.user.id,
                        sessionId: sessionId
                    }
                }
            });

            if (existingBooking) {
                throw new Error("ALREADY_BOOKED");
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
                    throw new Error("SESSION_FULL");
                }
                throw err;
            }

            const booking = await tx.booking.create({
                data: {
                    userId: req.user.id,
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
        });

        // Invalidate profile stats cache for learner and mentor
        if (req.cache) {
            req.cache.del(`profile_stats_${req.user.id}`);
            req.cache.del(`profile_stats_${result.mentorId}`);
        }

        return res.status(201).json({
            success: true,
            message: "Booking confirmed",
            booking: result.booking,
            sessionId: result.sessionId
        });

    } catch (error) {
        if (error.message === "SESSION_NOT_FOUND") {
            return res.status(404).json({ error: "Session not found" });
        }
        if (error.message === "ALREADY_BOOKED") {
            return res.status(400).json({ error: "You have already booked this session" });
        }
        if (error.message === "SESSION_FULL") {
            return res.status(400).json({ error: "Session is full" });
        }
        if (error.message === "SESSION_ENDED") {
            return res.status(400).json({ error: "Registration closed: Session has ended" });
        }
        return next(error);
    }
};

exports.getMyBookings = async (req, res, next) => {
    try {
        const bookings = await req.prisma.booking.findMany({
            where: { userId: req.user.id },
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

        const sessions = bookings.map(b => ({
            ...b.session,
            bookingId: b.id,
            isBooked: true,
            bookingStatus: b.status,
            sessionStatus: b.session.status,
            hasReviewed: b.hasReviewed
        }));

        return res.json({ sessions });
    } catch (error) {
        return next(error);
    }
};

exports.getAllSessions = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        const type = req.query.type || 'upcoming';
        const mode = req.query.mode;
        const priceType = req.query.priceType;
        const now = new Date();
        
        // Shared cache key without user specific parameters
        const cacheKey = `all_sessions_${page}_${limit}_${type}_${mode || 'all'}_${priceType || 'all'}`;

        let cachedData;

        if (req.cache && req.cache.has(cacheKey)) {
            cachedData = req.cache.get(cacheKey);
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
                req.prisma.session.findMany({
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
                req.prisma.session.count({
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

            if (req.cache) {
                req.cache.set(cacheKey, cachedData);
            }
        }

        // Fetch user specific bookings to merge isBooked status dynamically
        const sessionIds = cachedData.sessions.map(s => s.id);
        const userBookings = await req.prisma.booking.findMany({
            where: {
                userId: req.user.id,
                sessionId: { in: sessionIds }
            },
            select: { sessionId: true }
        });
        const userBookedSessionIds = new Set(userBookings.map(b => b.sessionId));

        const mappedSessions = cachedData.sessions.map(s => ({
            ...s,
            isBooked: userBookedSessionIds.has(s.id)
        }));

        return res.json({
            sessions: mappedSessions,
            pagination: cachedData.pagination
        });
    } catch (error) {
        return next(error);
    }
};

exports.getSessionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const session = await req.prisma.session.findUnique({
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
                    where: { userId: req.user.id },
                    select: { id: true }
                },
                resources: true,
                quizzes: true,
                codingQuestions: {
                    where: { status: 'LIVE' },
                    include: {
                        submissions: {
                            where: { userId: req.user.id, status: 'PASSED' },
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
            return res.status(404).json({ error: "Session not found" });
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

        const userReview = await req.prisma.review.findFirst({
            where: {
                sessionId: id,
                authorId: req.user.id
            }
        });

        mappedSession.hasReviewed = !!userReview;

        return res.json({ session: mappedSession });
    } catch (error) {
        return next(error);
    }
};

exports.getMentorStats = async (req, res, next) => {
    try {
        const mentorId = req.user.id;
        const cacheKey = `mentor_stats_${mentorId}`;

        if (req.cache && req.cache.has(cacheKey)) {
            return res.json(req.cache.get(cacheKey));
        }

        const [totalSessions, totalLearners, sessionStats, mentor] = await Promise.all([
            req.prisma.session.count({ where: { mentorId } }),
            req.prisma.booking.count({ where: { session: { mentorId } } }),
            req.prisma.session.aggregate({
                where: { mentorId },
                _sum: { duration: true }
            }),
            req.prisma.user.findUnique({
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

        if (req.cache) {
            req.cache.set(cacheKey, { stats });
        }

        return res.json({ stats });
    } catch (error) {
        return next(error);
    }
};

exports.verifyAttendance = async (req, res, next) => {
    try {
        const { bookingId, sessionId } = req.body;

        if (!bookingId || !sessionId) {
            return res.status(400).json({ error: "Booking ID and Session ID are required" });
        }

        const session = await req.prisma.session.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        // Verify Mentor owns the session
        if (session.mentorId !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized: You are not the mentor for this session" });
        }

        const booking = await req.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { user: { select: { name: true, email: true } } }
        });

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        if (booking.sessionId !== sessionId) {
            return res.status(400).json({ error: "Invalid Ticket: This booking belongs to a different session" });
        }

        if (booking.status !== 'CONFIRMED') {
            return res.status(400).json({ error: "Payment Pending: This ticket is not paid/confirmed" });
        }

        if (booking.attended) {
            return res.status(409).json({ error: "Already Scanned: This ticket has already been used" });
        }

        // Mark as attended
        await req.prisma.booking.update({
            where: { id: bookingId },
            data: { attended: true, joinedAt: new Date() }
        });

        // Invalidate profile stats cache for learner and mentor
        if (req.cache) {
            req.cache.del(`profile_stats_${session.mentorId}`);
            req.cache.del(`profile_stats_${booking.userId}`);
        }


        return res.json({
            success: true,
            message: "Attendance Verified",
            user: booking.user,
            session: {
                title: session.title,
                mode: session.mode
            }
        });

    } catch (error) {
        return next(error);
    }
};

exports.getRecentActivity = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const notifications = await req.prisma.notification.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' },
            take: 4
        });

        const sessions = await req.prisma.session.findMany({
            where: { mentorId: userId },
            select: { id: true }
        });
        const sessionIds = sessions.map(s => s.id);

        let reports = [];
        if (sessionIds.length > 0) {
            reports = await req.prisma.report.findMany({
                where: { sessionId: { in: sessionIds } },
                orderBy: { createdAt: 'desc' },
                take: 4,
                include: { session: { select: { title: true } } }
            });
        }

        // 3. Normalize and Merge
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

        // 4. Map to Activity Format
        const activities = combined.map(item => {
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

        return res.json({ activities });
    } catch (error) {
        return next(error);
    }
};
