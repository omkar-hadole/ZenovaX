const { sanitizeString, isValidArray, isHttpsUrl } = require("../utils/validation");
const logger = require("../utils/logger");
const { BadRequestError, NotFoundError, ForbiddenError, ConflictError } = require("../utils/errors");
const { SignJWT } = require("jose");
const crypto = require("crypto");
const config = require("../config");
const mentorWalletService = require("./mentorWalletService");
const paymentService = require("./paymentService");

const getUniqueLearnersCount = async (tx, mentorId) => {
    const result = await tx.booking.groupBy({
        by: ['userId'],
        where: {
            session: { mentorId },
            status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _count: { userId: true }
    });
    return result.length;
};

exports.createSessionRequest = async (prisma, cache, mentorId, data) => {
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

    if (typeof description === 'string') {
        const descriptionLines = description.split('\n').length;
        if (descriptionLines > 15) {
            throw new BadRequestError(`Description must not exceed 15 lines (received ${descriptionLines})`);
        }
        if (description.length > 5000) {
            throw new BadRequestError("Description must not exceed 5000 characters");
        }
    }

    if (mode === "OFFLINE" && !venue) {
        throw new BadRequestError("Venue is required for offline sessions");
    }

    if (mode === "ONLINE") {
        if (!meetingLink) {
            throw new BadRequestError("Meeting link is required for online sessions");
        }
        if (!isHttpsUrl(meetingLink)) {
            throw new BadRequestError("meetingLink must be a valid https:// URL");
        }
    }

    const sessionDate = new Date(proposedDate);
    if (sessionDate < new Date()) {
        throw new BadRequestError("Cannot create a session in the past. Please choose a future date and time.");
    }

    const parsedSeats = parseInt(maxSeats);
    const parsedPrice = parseFloat(price);
    const parsedDuration = parseInt(duration);

    if (isNaN(parsedSeats) || parsedSeats < 1 || parsedSeats > 500) {
        throw new BadRequestError('maxSeats must be between 1 and 500');
    }
    if (isNaN(parsedPrice) || parsedPrice < 0 || parsedPrice > 10000) {
        throw new BadRequestError('price must be between 0 and 10,000');
    }
    if (isNaN(parsedDuration) || parsedDuration < 15 || parsedDuration > 480) {
        throw new BadRequestError('duration must be between 15 and 480 minutes');
    }

    if (topics !== undefined) {
        let topicsArray = [];
        if (isValidArray(topics)) {
            topicsArray = topics;
        } else if (typeof topics === 'string') {
            try {
                if (topics.trim().startsWith('[')) {
                    topicsArray = JSON.parse(topics);
                } else {
                    topicsArray = topics.split(',').map(t => t.trim()).filter(Boolean);
                }
            } catch (e) {
                topicsArray = topics.split(',').map(t => t.trim()).filter(Boolean);
            }
        }
        if (topicsArray.length > 20) {
            throw new BadRequestError("A session can have a maximum of 20 topics");
        }
    }

    const sessionRequest = await prisma.sessionRequest.create({
        data: {
            mentorId,
            title: sanitizeString(title),
            description: sanitizeString(description),
            subject: sanitizeString(subject),
            department: sanitizeString(department),
            topics: JSON.stringify(isValidArray(topics) ? topics : []),
            mode,
            priceType: priceType || "FREE",
            price: parsedPrice,
            maxSeats: parsedSeats,
            venue: venue ? sanitizeString(venue) : null,
            meetingLink,
            proposedDate: new Date(proposedDate),
            duration: parsedDuration,
            status: "PENDING"
        }
    });

    return sessionRequest;
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

exports.updateSessionRequest = async (prisma, cache, userId, userRole, id, data) => {
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

    if (description !== undefined && typeof description === 'string') {
        const descriptionLines = description.split('\n').length;
        if (descriptionLines > 15) {
            throw new BadRequestError(`Description must not exceed 15 lines (received ${descriptionLines})`);
        }
        if (description.length > 5000) {
            throw new BadRequestError("Description must not exceed 5000 characters");
        }
    }

    const effectiveMode = mode || request.mode;
    if (effectiveMode === 'ONLINE' && meetingLink !== undefined && meetingLink && !isHttpsUrl(meetingLink)) {
        throw new BadRequestError("meetingLink must be a valid https:// URL");
    }

    if (topics !== undefined) {
        let topicsArray = [];
        if (isValidArray(topics)) {
            topicsArray = topics;
        } else if (typeof topics === 'string') {
            try {
                if (topics.trim().startsWith('[')) {
                    topicsArray = JSON.parse(topics);
                } else {
                    topicsArray = topics.split(',').map(t => t.trim()).filter(Boolean);
                }
            } catch (e) {
                topicsArray = topics.split(',').map(t => t.trim()).filter(Boolean);
            }
        }
        if (topicsArray.length > 20) {
            throw new BadRequestError("A session can have a maximum of 20 topics");
        }
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
            if (cache) {
                await cache.del('dashboard_upcoming_sessions');
                await cache.del('dashboard_top_mentors');
            }
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
    const gatewayEnabled = paymentService.isEnabled();

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

        const isPaid = currentSession.priceType === 'PAID' && currentSession.price > 0;
        const { platformFee } = paymentService.computeFeeSplit(currentSession.price);
        // A real gateway defers confirmation until payment is verified; without one
        // configured, the charge is simulated as an immediate success so paid bookings
        // still work in development.
        const usesGateway = isPaid && gatewayEnabled;

        const booking = await tx.booking.create({
            data: {
                userId,
                sessionId: sessionId,
                status: usesGateway ? 'PENDING' : 'CONFIRMED',
                amountPaid: (isPaid && !usesGateway) ? currentSession.price : 0,
                platformFee: isPaid ? platformFee : 0,
                totalAmount: isPaid ? currentSession.price : 0,
                paymentId: (isPaid && !usesGateway) ? `sim_pay_${crypto.randomUUID()}` : null
            }
        });

        if (isPaid) {
            await tx.transaction.create({
                data: {
                    userId,
                    bookingId: booking.id,
                    amount: currentSession.price,
                    platformFee,
                    totalAmount: currentSession.price,
                    status: usesGateway ? 'PENDING' : 'SUCCESS',
                    paymentMethod: usesGateway ? 'RAZORPAY' : null,
                    // Gateway order id is attached after the order is created (outside this tx).
                    gatewayOrderId: usesGateway ? null : `sim_order_${crypto.randomUUID()}`,
                    gatewayPaymentId: usesGateway ? null : booking.paymentId,
                    completedAt: usesGateway ? null : new Date()
                }
            });

            if (!usesGateway) {
                // Simulated immediate success — credit the mentor's pending balance now.
                await mentorWalletService.recordBookingEarning(tx, currentSession.mentorId, booking);
            }
        }

        // Denormalized unique-learner count only reflects confirmed bookings. A
        // gateway booking is still PENDING here; it's updated on payment confirmation.
        if (!usesGateway) {
            const uniqueLearners = await getUniqueLearnersCount(tx, currentSession.mentorId);
            await tx.user.update({
                where: { id: currentSession.mentorId },
                data: { uniqueLearners }
            });

            await tx.notification.create({
                data: {
                    userId,
                    type: 'BOOKING_CONFIRMED',
                    title: 'Booking confirmed',
                    message: `You're booked for "${currentSession.title}".`,
                    link: `/sessions/${sessionId}`
                }
            });
        }

        return {
            booking,
            sessionId,
            mentorId: currentSession.mentorId,
            price: currentSession.price,
            usesGateway
        };
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
    // Fast-path check before the transaction (executeBookingTransaction re-checks
    // this inside the transaction too, which is what actually prevents races).
    const existingBooking = await prisma.booking.findUnique({
        where: {
            userId_sessionId: {
                userId,
                sessionId
            }
        }
    });

    if (existingBooking) {
        // Allow resuming an unpaid gateway booking instead of hard-blocking it.
        if (existingBooking.status === 'PENDING' && paymentService.isEnabled()) {
            const txn = await prisma.transaction.findUnique({ where: { bookingId: existingBooking.id } });
            if (txn && txn.gatewayOrderId) {
                return {
                    requiresPayment: true,
                    keyId: paymentService.keyId(),
                    order: {
                        id: txn.gatewayOrderId,
                        amount: Math.round(txn.totalAmount * 100),
                        currency: txn.currency
                    },
                    bookingId: existingBooking.id
                };
            }
        }
        throw new BadRequestError("You have already booked this session");
    }

    const result = await exports.executeBookingTransaction(prisma, cache, userId, sessionId);

    if (result.usesGateway) {
        // Create the Razorpay order OUTSIDE the DB transaction (external API call),
        // then attach its id. If order creation fails, release the reserved seat.
        try {
            const order = await paymentService.createOrder({
                amount: result.price,
                receipt: `bk_${result.booking.id}`.slice(0, 40),
                notes: { bookingId: result.booking.id, sessionId, userId }
            });
            await prisma.transaction.update({
                where: { bookingId: result.booking.id },
                data: { gatewayOrderId: order.id }
            });
            return {
                requiresPayment: true,
                keyId: paymentService.keyId(),
                order,
                bookingId: result.booking.id
            };
        } catch (err) {
            await exports.cancelPendingBooking(prisma, cache, result.booking.id).catch((e) =>
                logger.error(`Failed to roll back booking after order error: ${e.message}`)
            );
            logger.error(`Failed to create Razorpay order: ${err.message}`);
            throw new BadRequestError("Could not initiate payment. Please try again.");
        }
    }

    return { booking: result.booking };
};

// Confirms a gateway booking once its payment is verified (via client callback or
// webhook). Idempotent: a booking already CONFIRMED is a no-op, so the webhook and
// the client callback racing each other is safe.
exports.confirmBookingPaid = async (prisma, cache, { bookingId, gatewayPaymentId, gatewaySignature }) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { session: { select: { mentorId: true, title: true } } }
    });
    if (!booking) throw new NotFoundError("Booking not found");
    if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
        return booking; // already processed
    }

    const mentorId = booking.session.mentorId;

    await prisma.$transaction(async (tx) => {
        // Atomic claim: only one concurrent caller (webhook vs client callback)
        // can flip PENDING -> CONFIRMED. The other sees count === 0 and bails,
        // so earnings are never credited twice.
        const claimed = await tx.booking.updateMany({
            where: { id: bookingId, status: { notIn: ['CONFIRMED', 'COMPLETED'] } },
            data: {
                status: 'CONFIRMED',
                amountPaid: booking.totalAmount,
                paymentId: gatewayPaymentId || booking.paymentId
            }
        });

        if (claimed.count === 0) {
            return; // already confirmed by a concurrent request
        }

        await tx.transaction.update({
            where: { bookingId },
            data: {
                status: 'SUCCESS',
                gatewayPaymentId: gatewayPaymentId || undefined,
                gatewaySignature: gatewaySignature || undefined,
                completedAt: new Date()
            }
        });

        const confirmed = { ...booking, status: 'CONFIRMED', amountPaid: booking.totalAmount };
        await mentorWalletService.recordBookingEarning(tx, mentorId, confirmed);

        const uniqueLearners = await getUniqueLearnersCount(tx, mentorId);
        await tx.user.update({ where: { id: mentorId }, data: { uniqueLearners } });

        await tx.notification.create({
            data: {
                userId: booking.userId,
                type: 'BOOKING_CONFIRMED',
                title: 'Booking confirmed',
                message: `You're booked for "${booking.session.title}".`,
                link: `/sessions/${booking.sessionId}`
            }
        });
    }, { timeout: 15000 });

    if (cache) {
        await cache.del(`profile_stats_${booking.userId}`);
        await cache.del(`profile_stats_${mentorId}`);
    }

    return prisma.booking.findUnique({ where: { id: bookingId } });
};

// Verify a Razorpay checkout callback from the learner, then confirm the booking.
exports.verifyPayment = async (prisma, cache, userId, payload) => {
    const { bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = payload || {};
    if (!bookingId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        throw new BadRequestError("Missing payment verification fields");
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError("Booking not found");
    if (booking.userId !== userId) throw new ForbiddenError("Not your booking");

    const valid = paymentService.verifyPaymentSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature
    });

    if (!valid) {
        await prisma.transaction.update({
            where: { bookingId },
            data: { status: 'FAILED' }
        }).catch(() => {});
        throw new BadRequestError("Payment verification failed");
    }

    // Defense in depth: the signature only proves Razorpay signed the ids, so also
    // re-fetch the payment and confirm the captured amount matches our order.
    const txn = await prisma.transaction.findUnique({ where: { bookingId } });
    if (txn) {
        let payment;
        try {
            payment = await paymentService.fetchPayment(razorpayPaymentId);
        } catch (err) {
            throw new BadRequestError("Could not verify payment. Please try again.");
        }
        const amountOk = payment && Number(payment.amount) === Math.round(txn.totalAmount * 100);
        const matchesOrder = payment && payment.id === razorpayPaymentId && payment.order_id === razorpayOrderId;
        if (!amountOk || !matchesOrder || payment.status !== 'captured') {
            await prisma.transaction.update({
                where: { bookingId },
                data: { status: 'FAILED' }
            }).catch(() => {});
            throw new BadRequestError("Payment verification failed");
        }
    }

    const confirmed = await exports.confirmBookingPaid(prisma, cache, {
        bookingId,
        gatewayPaymentId: razorpayPaymentId,
        gatewaySignature: razorpaySignature
    });

    return { booking: confirmed };
};

// Cancel an unpaid PENDING booking and release its seat. Used to roll back a failed
// order creation and by the seat-expiry sweep in queue.js.
exports.cancelPendingBooking = async (prisma, cache, bookingId) => {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.status !== 'PENDING') return null;

    await prisma.$transaction(async (tx) => {
        await tx.booking.update({
            where: { id: bookingId },
            data: { status: 'CANCELLED' }
        });
        await tx.transaction.updateMany({
            where: { bookingId, status: 'PENDING' },
            data: { status: 'FAILED' }
        });
        await tx.session.update({
            where: { id: booking.sessionId },
            data: { availableSeats: { increment: 1 } }
        });
    }, { timeout: 15000 });

    if (cache) {
        await cache.del(`profile_stats_${booking.userId}`);
    }
    return booking;
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
        // A PENDING booking is awaiting gateway payment — report it as such so the
        // learner UI can resume checkout rather than showing "already registered".
        if (booking.status === 'PENDING') {
            return { status: 'PENDING_PAYMENT', booking };
        }
        return { status: 'CONFIRMED', booking };
    }

    // 2. Otherwise, still in progress
    return { status: 'PROCESSING', message: 'Booking is in progress' };
};

exports.getMyBookings = async (prisma, userId, queryParams = {}) => {
    const pageVal = parseInt(queryParams.page, 10);
    const limitVal = parseInt(queryParams.limit, 10);

    if (!isNaN(limitVal) && limitVal > 50) {
        throw new BadRequestError('Maximum page size is 50');
    }

    const page = Math.max(1, isNaN(pageVal) ? 1 : pageVal);
    const limit = Math.max(1, isNaN(limitVal) ? 9 : limitVal);
    const skip = (page - 1) * limit;

    const status = queryParams.status || 'all';
    const mode = queryParams.mode;
    const search = queryParams.search ? sanitizeString(queryParams.search).slice(0, 100) : '';
    const now = new Date();

    const sessionConditions = [];

    if (mode) {
        sessionConditions.push({ mode });
    }

    if (search) {
        sessionConditions.push({
            OR: [
                { title: { contains: search } },
                { mentor: { name: { contains: search } } }
            ]
        });
    }

    if (status === 'upcoming') {
        sessionConditions.push({
            OR: [
                { status: 'LIVE' },
                { AND: [{ status: 'UPCOMING' }, { scheduledAt: { gt: now } }] }
            ]
        });
    } else if (status === 'completed') {
        sessionConditions.push({
            OR: [
                { status: 'COMPLETED' },
                { AND: [{ status: 'UPCOMING' }, { scheduledAt: { lte: now } }] }
            ]
        });
    }

    const whereClause = { userId };
    if (sessionConditions.length > 0) {
        whereClause.session = { AND: sessionConditions };
    }

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where: whereClause,
            skip,
            take: limit,
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
                        }
                    }
                }
            },
            orderBy: { session: { scheduledAt: 'desc' } }
        }),
        prisma.booking.count({ where: whereClause })
    ]);

    const sessions = bookings.map(b => ({
        ...b.session,
        bookingId: b.id,
        isBooked: true,
        bookingStatus: b.status,
        sessionStatus: b.session.status,
        hasReviewed: b.hasReviewed
    }));

    return {
        sessions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

exports.getAllSessions = async (prisma, cache, userId, queryParams) => {
    const pageVal = parseInt(queryParams.page, 10);
    const limitVal = parseInt(queryParams.limit, 10);

    if (!isNaN(limitVal) && limitVal > 50) {
        throw new BadRequestError('Maximum page size is 50');
    }

    const page = Math.max(1, isNaN(pageVal) ? 1 : pageVal);
    const limit = Math.max(1, isNaN(limitVal) ? 12 : limitVal);
    const skip = (page - 1) * limit;
    const type = queryParams.type || 'upcoming';
    const mode = queryParams.mode;
    const priceType = queryParams.priceType;
    const search = queryParams.search ? sanitizeString(queryParams.search).slice(0, 100) : '';
    const now = new Date();

    // Shared cache key without user specific parameters
    const cacheKey = `all_sessions_${page}_${limit}_${type}_${mode || 'all'}_${priceType || 'all'}_${search || 'none'}`;

    let cachedData;

    if (cache) {
        cachedData = await cache.get(cacheKey);
    }
    if (!cachedData) {
        let whereClause = {};

        // A search query looks for a specific session by name, so it should
        // match regardless of upcoming/past status — only plain browsing
        // (no search term) is curated down to the upcoming/past tabs.
        if (!search) {
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
        }

        if (mode) {
            whereClause.mode = mode;
        }

        if (priceType) {
            whereClause.priceType = priceType;
        }

        if (search) {
            whereClause.AND = [
                ...(whereClause.AND || []),
                {
                    OR: [
                        { title: { contains: search } },
                        { mentor: { name: { contains: search } } }
                    ]
                }
            ];
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
            await cache.set(cacheKey, cachedData, 900);
        }
    }

    // Fetch user specific bookings to merge isBooked status dynamically
    const sessionIds = cachedData.sessions.map(s => s.id);
    const userBookings = await prisma.booking.findMany({
        where: {
            userId,
            sessionId: { in: sessionIds },
            status: 'CONFIRMED'
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
                where: { userId, status: 'CONFIRMED' },
                select: { id: true }
            },
            resources: true,
            quizzes: true,
            codingQuestions: {
                where: { status: 'LIVE' },
                select: {
                    id: true,
                    title: true,
                    difficulty: true,
                    questionType: true,
                    status: true,
                    points: true,
                    createdAt: true,
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

    if (cache) {
        const cached = await cache.get(cacheKey);
        if (cached) return cached.stats;
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
        await cache.set(cacheKey, { stats }, 900);
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

exports.getLiveAccess = async (prisma, userId, sessionId) => {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            mentor: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePicture: true
                }
            }
        }
    });

    if (!session) {
        throw new NotFoundError("Session not found");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true
        }
    });

    if (!user) {
        throw new NotFoundError("User not found");
    }

    let isModerator = false;

    if (userId === session.mentorId) {
        isModerator = true;
    } else {
        const booking = await prisma.booking.findUnique({
            where: {
                userId_sessionId: {
                    userId,
                    sessionId
                }
            }
        });

        if (!booking || booking.status !== 'CONFIRMED') {
            const err = new ForbiddenError("You must have a confirmed booking to join this session");
            err.reason = "NOT_REGISTERED";
            throw err;
        }

        const now = new Date();
        const scheduledTime = new Date(session.scheduledAt);
        const joinStartTime = new Date(scheduledTime.getTime() - 10 * 60 * 1000);
        const joinEndTime = new Date(scheduledTime.getTime() + (session.duration + 15) * 60 * 1000);

        if (now < joinStartTime) {
            const err = new ForbiddenError("The room has not opened yet. Please check back 10 minutes before the session starts.");
            err.reason = "TOO_EARLY";
            err.scheduledAt = session.scheduledAt;
            throw err;
        }

        if (now > joinEndTime) {
            const err = new ForbiddenError("This session has already ended.");
            err.reason = "SESSION_ENDED";
            throw err;
        }

        if (!booking.joinedAt) {
            await prisma.booking.update({
                where: { id: booking.id },
                data: { joinedAt: new Date() }
            });
        }
    }

    // Verify configuration
    if (!config.jaas.appId || !config.jaas.apiKeyId || !config.jaas.privateKey) {
        throw new BadRequestError("8x8 JaaS integration is not configured on the server");
    }

    // Derive non-guessable room name using a hash of sessionId
    const roomHash = crypto.createHmac("sha256", config.jwtSecret).update(sessionId).digest("hex");
    const roomName = `${config.jaas.appId}/${roomHash}`;

    // Set expiry to cover the remaining session window
    const sessionEndTime = new Date(session.scheduledAt).getTime() + (session.duration + 15) * 60 * 1000;
    const expSeconds = Math.ceil(sessionEndTime / 1000);

    let privateKey;
    try {
        privateKey = crypto.createPrivateKey(config.jaas.privateKey);
    } catch (errKey) {
        logger.error("Failed to parse JaaS private key: " + errKey.message);
        throw new BadRequestError("Invalid JaaS private key format");
    }

    // Prepare JWT Payload
    const payload = {
        aud: "jitsi",
        iss: "chat",
        sub: config.jaas.appId,
        room: roomHash,
        context: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.profilePicture || "",
                moderator: isModerator
            },
            features: {
                recording: "false",
                livestreaming: "false",
                "create-polls": isModerator ? "true" : "false",
                "file-upload": isModerator ? "true" : "false"
            }
        }
    };

    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "RS256", kid: config.jaas.apiKeyId, typ: "JWT" })
        .setExpirationTime(expSeconds)
        .setNotBefore(Math.floor(Date.now() / 1000) - 10)
        .sign(privateKey);

    return {
        token,
        roomName,
        domain: "8x8.vc",
        isModerator
    };
};
