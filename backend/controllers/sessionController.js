const { sanitizeString, isValidArray } = require("../utils/validation");

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

        if (request.mentorId !== req.user.id) {
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

        if (request.mentorId !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized to update this request" });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: "Only pending requests can be updated" });
        }

        const updatedRequest = await req.prisma.sessionRequest.update({
            where: { id },
            data: {
                title: title ? sanitizeString(title) : undefined,
                description: description ? sanitizeString(description) : undefined,
                subject: subject ? sanitizeString(subject) : undefined,
                department: department ? sanitizeString(department) : undefined,
                topics: topics ? JSON.stringify(isValidArray(topics) ? topics : []) : undefined,
                mode,
                priceType,
                price: price !== undefined ? parseFloat(price) : undefined,
                maxSeats: maxSeats !== undefined ? parseInt(maxSeats) : undefined,
                venue: venue ? sanitizeString(venue) : undefined,
                meetingLink,
                proposedDate: proposedDate ? new Date(proposedDate) : undefined,
                duration: duration !== undefined ? parseInt(duration) : undefined,
            }
        });

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

        const approvedRequests = await req.prisma.sessionRequest.findMany({
            where: {
                mentorId: req.user.id,
                status: 'APPROVED'
            },
            include: { session: true },
            orderBy: { proposedDate: 'asc' }
        });

        const mappedRequests = approvedRequests
            .filter(req => !req.session)
            .map(req => ({
                id: `req-${req.id}`,
                title: req.title,
                scheduledAt: req.proposedDate,
                duration: req.duration,
                mode: req.mode,
                maxSeats: req.maxSeats,
                _count: { bookings: 0 },
                isRequest: true
            }));

        const allSessions = [...sessions, ...mappedRequests].sort((a, b) =>
            new Date(a.scheduledAt) - new Date(b.scheduledAt)
        );

        return res.json({ sessions: allSessions });
    } catch (error) {
        return next(error);
    }
};

exports.bookSession = async (req, res, next) => {
    try {
        let sessionId = req.params.id;
        let session;

        if (sessionId.startsWith('req-')) {
            const requestId = sessionId.replace('req-', '');

            session = await req.prisma.session.findUnique({
                where: { requestId }
            });

            if (!session) {
                const request = await req.prisma.sessionRequest.findUnique({
                    where: { id: requestId }
                });

                if (!request) {
                    return res.status(404).json({ error: "Session request not found" });
                }

                session = await req.prisma.session.create({
                    data: {
                        title: request.title,
                        description: request.description,
                        subject: request.subject,
                        department: request.department,
                        topics: request.topics,
                        mentorId: request.mentorId,
                        mode: request.mode,
                        priceType: request.priceType,
                        price: request.price,
                        maxSeats: request.maxSeats,
                        availableSeats: request.maxSeats,
                        venue: request.venue,
                        meetingLink: request.meetingLink,
                        scheduledAt: request.proposedDate,
                        duration: request.duration,
                        requestId: request.id,
                        status: 'UPCOMING'
                    }
                });
            }
            sessionId = session.id;
        } else {
            session = await req.prisma.session.findUnique({
                where: { id: sessionId }
            });
        }

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        const existingBooking = await req.prisma.booking.findUnique({
            where: {
                userId_sessionId: {
                    userId: req.user.id,
                    sessionId: sessionId
                }
            }
        });

        if (existingBooking) {
            return res.status(400).json({ error: "You have already booked this session" });
        }

        if (session.availableSeats <= 0) {
            return res.status(400).json({ error: "Session is full" });
        }

        const booking = await req.prisma.booking.create({
            data: {
                userId: req.user.id,
                sessionId: sessionId,
                status: 'CONFIRMED',
                amountPaid: 0
            }
        });

        await req.prisma.session.update({
            where: { id: sessionId },
            data: { availableSeats: { decrement: 1 } }
        });

        return res.status(201).json({
            success: true,
            message: "Booking confirmed",
            booking,
            sessionId
        });

    } catch (error) {
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const type = req.query.type || 'upcoming';
        const mode = req.query.mode;
        const priceType = req.query.priceType;
        const now = new Date();
        const cacheKey = `all_sessions_${req.user.id}_${page}_${limit}_${type}_${mode || 'all'}_${priceType || 'all'}`;

        if (req.cache && req.cache.has(cacheKey)) {
            return res.json(req.cache.get(cacheKey));
        }

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
                    bookings: {
                        where: { userId: req.user.id },
                        select: { id: true }
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

        const mappedSessions = sessions.map(s => ({
            ...s,
            isBooked: s.bookings.length > 0
        }));

        const response = {
            sessions: mappedSessions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

        if (req.cache) {
            req.cache.set(cacheKey, response);
        }

        return res.json(response);
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
