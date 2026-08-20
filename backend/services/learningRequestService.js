const { sanitizeString } = require("../utils/validation");
const { BadRequestError, NotFoundError, ForbiddenError, ConflictError } = require("../utils/errors");

const VALID_MODES = ['ONLINE', 'OFFLINE', 'EITHER'];
const VALID_STATUSES = ['OPEN', 'SESSION_CREATED', 'COMPLETED', 'CLOSED'];

// Requests that are still actionable — open for demand or already served by a
// session. COMPLETED/CLOSED are only shown when explicitly requested.
const ACTIVE_STATUSES = ['OPEN', 'SESSION_CREATED'];

const requestWhereFromQuery = (queryParams) => {
    const status = queryParams.status;
    const mode = queryParams.mode;
    const search = queryParams.search ? sanitizeString(queryParams.search).slice(0, 100) : '';

    let statuses = [];
    if (status) {
        if (status === 'ALL') {
            statuses = VALID_STATUSES;
        } else if (VALID_STATUSES.includes(status)) {
            statuses = [status];
        } else {
            throw new BadRequestError("Invalid status filter");
        }
    } else {
        statuses = ACTIVE_STATUSES;
    }

    const where = { status: { in: statuses } };

    if (mode) {
        if (!VALID_MODES.includes(mode)) {
            throw new BadRequestError("Invalid mode filter");
        }
        where.preferredMode = mode;
    }

    if (search) {
        where.topic = { contains: search };
    }

    return where;
};

// Full include for learner-facing list: keeps interest learnerId array so
// per-user isInterested can be derived from the cached payload.
const REQUEST_INCLUDE = {
    creator: {
        select: {
            id: true,
            name: true,
            profilePicture: true,
            department: true,
            year: true
        }
    },
    interests: {
        select: {
            learnerId: true
        }
    },
    session: {
        select: {
            id: true,
            title: true,
            description: true,
            status: true,
            scheduledAt: true,
            mode: true,
            priceType: true,
            price: true,
            mentor: {
                select: {
                    id: true,
                    name: true,
                    profilePicture: true
                }
            }
        }
    }
};

// Lean include for mentor-facing demand list: we only need the aggregate
// count of interests, not every learnerId. Avoids loading potentially
// hundreds of interest rows per request just to display a number.
const DEMAND_INCLUDE = {
    _count: { select: { interests: true } },
    creator: {
        select: {
            id: true,
            name: true,
            profilePicture: true,
            department: true,
            year: true
        }
    },
    session: {
        select: {
            id: true,
            title: true,
            description: true,
            status: true,
            scheduledAt: true,
            mode: true,
            priceType: true,
            price: true,
            mentor: {
                select: {
                    id: true,
                    name: true,
                    profilePicture: true
                }
            }
        }
    }
};

const mapRequest = (request, userId) => {
    const isAnonymous = !!request.isAnonymous;
    // Support both full interests array (learner list) and _count (mentor demand)
    const interestCount = request._count?.interests ?? (request.interests?.length || 0);
    const isInterested = request.interests
        ? !!request.interests.find(i => i.learnerId === userId)
        : false;
    const creator = request.creator
        ? {
            ...request.creator,
            id: isAnonymous ? null : request.creator.id,
            name: isAnonymous ? 'Anonymous' : request.creator.name,
            profilePicture: isAnonymous ? null : request.creator.profilePicture,
            department: isAnonymous ? null : request.creator.department,
            year: isAnonymous ? null : request.creator.year,
        }
        : null;
    return {
        ...request,
        creator,
        isAnonymous,
        interestCount,
        isInterested,
        isCreator: request.creatorId === userId,
        interests: undefined,
        _count: undefined
    };
};

exports.listLearningRequests = async (prisma, cache, userId, userRole, queryParams) => {
    const pageVal = parseInt(queryParams.page, 10);
    const limitVal = parseInt(queryParams.limit, 10);

    if (!isNaN(limitVal) && limitVal > 50) {
        throw new BadRequestError('Maximum page size is 50');
    }

    const page = Math.max(1, isNaN(pageVal) ? 1 : pageVal);
    const limit = Math.max(1, isNaN(limitVal) ? 12 : limitVal);
    const skip = (page - 1) * limit;

    const sortBy = queryParams.sortBy === 'demand' ? 'demand' : 'newest';
    const search = queryParams.search ? sanitizeString(queryParams.search).slice(0, 100) : '';
    const mode = queryParams.mode || '';
    const status = queryParams.status || '';

    const where = requestWhereFromQuery(queryParams);

    const cacheKey = `learning_requests_${page}_${limit}_${sortBy}_${status || 'active'}_${mode || 'all'}_${search || 'none'}`;

    let cachedData;
    if (cache) {
        cachedData = await cache.get(cacheKey);
    }

    if (!cachedData) {
        // Run count and data fetch in parallel to halve the round-trips.
        const [requests, total] = await Promise.all([
            prisma.learningRequest.findMany({
                where,
                skip,
                take: limit,
                include: REQUEST_INCLUDE,
                orderBy: sortBy === 'demand'
                    ? [{ interests: { _count: 'desc' } }, { createdAt: 'desc' }]
                    : { createdAt: 'desc' }
            }),
            prisma.learningRequest.count({ where })
        ]);

        cachedData = {
            requests,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

        if (cache) {
            // Cache for 10 minutes — learner demand data is not real-time sensitive.
            await cache.set(cacheKey, cachedData, 600);
        }
    }

    const mappedRequests = cachedData.requests.map(r => mapRequest(r, userId));

    return {
        requests: mappedRequests,
        pagination: cachedData.pagination
    };
};

exports.getLearningRequestById = async (prisma, cache, userId, id) => {
    const request = await prisma.learningRequest.findUnique({
        where: { id },
        include: REQUEST_INCLUDE
    });

    if (!request) {
        throw new NotFoundError("Learning request not found");
    }

    return mapRequest(request, userId);
};

exports.createLearningRequest = async (prisma, cache, userId, data) => {
    const topic = sanitizeString(data.topic);
    const description = sanitizeString(data.description);
    const preferredMode = data.preferredMode || 'EITHER';
    const isAnonymous = data.isAnonymous === true;

    if (!topic) {
        throw new BadRequestError("Topic is required");
    }
    if (topic.length > 200) {
        throw new BadRequestError("Topic must not exceed 200 characters");
    }

    if (!description) {
        throw new BadRequestError("Description is required");
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

    if (!VALID_MODES.includes(preferredMode)) {
        throw new BadRequestError("Preferred mode must be ONLINE, OFFLINE or EITHER");
    }

    // Discourage duplicate requests: if an active request with the same topic
    // already exists, point the learner at it instead of creating a duplicate.
    const existing = await prisma.learningRequest.findFirst({
        where: {
            topic: { equals: topic, mode: 'insensitive' },
            status: { in: ACTIVE_STATUSES }
        },
        select: { id: true, topic: true }
    });

    if (existing) {
        throw new ConflictError(`A request for "${existing.topic}" already exists. Join it instead of creating a duplicate.`);
    }

    const request = await prisma.learningRequest.create({
        data: {
            creatorId: userId,
            topic,
            description,
            preferredMode,
            isAnonymous,
            status: 'OPEN'
        },
        include: {
            creator: {
                select: { id: true, name: true, profilePicture: true, department: true, year: true }
            }
        }
    });

    // The creator is implicitly interested — they asked for this topic.
    await prisma.learningRequestInterest.create({
        data: {
            learningRequestId: request.id,
            learnerId: userId
        }
    });

    if (cache) {
        await cache.delPattern('learning_requests_*');
    }

    return mapRequest({
        ...request,
        interests: [{ learnerId: userId }],
        session: null
    }, userId);
};

exports.addInterest = async (prisma, cache, userId, id) => {
    const request = await prisma.learningRequest.findUnique({
        where: { id },
        select: { id: true, topic: true, status: true, creatorId: true }
    });

    if (!request) {
        throw new NotFoundError("Learning request not found");
    }
    if (request.status !== 'OPEN') {
        throw new BadRequestError("Interest can only be added while the request is open");
    }

    try {
        await prisma.learningRequestInterest.create({
            data: {
                learningRequestId: id,
                learnerId: userId
            }
        });
    } catch (err) {
        // Unique (learningRequestId, learnerId) constraint — already interested.
        if (err.code === 'P2002') {
            return { success: true, message: "Already interested" };
        }
        throw err;
    }

    if (cache) {
        await cache.delPattern('learning_requests_*');
    }

    return { success: true };
};

exports.removeInterest = async (prisma, cache, userId, id) => {
    const request = await prisma.learningRequest.findUnique({
        where: { id },
        select: { id: true, status: true }
    });

    if (!request) {
        throw new NotFoundError("Learning request not found");
    }

    await prisma.learningRequestInterest.deleteMany({
        where: {
            learningRequestId: id,
            learnerId: userId
        }
    });

    if (cache) {
        await cache.delPattern('learning_requests_*');
    }

    return { success: true };
};

exports.closeRequest = async (prisma, cache, userId, userRole, id) => {
    const request = await prisma.learningRequest.findUnique({
        where: { id },
        select: { id: true, creatorId: true, status: true }
    });

    if (!request) {
        throw new NotFoundError("Learning request not found");
    }

    if (request.creatorId !== userId && userRole !== 'ADMIN') {
        throw new ForbiddenError("Only the creator can close this request");
    }

    if (request.status !== 'OPEN') {
        throw new BadRequestError("Only open requests can be closed");
    }

    await prisma.learningRequest.update({
        where: { id },
        data: { status: 'CLOSED' }
    });

    if (cache) {
        await cache.delPattern('learning_requests_*');
    }

    return { success: true };
};

exports.getLearnerDemand = async (prisma, cache, userId, queryParams) => {
    const pageVal = parseInt(queryParams.page, 10);
    const limitVal = parseInt(queryParams.limit, 10);
    const page = Math.max(1, isNaN(pageVal) ? 1 : pageVal);
    const limit = Math.max(1, Math.min(isNaN(limitVal) ? 20 : limitVal, 50));
    const skip = (page - 1) * limit;

    const where = {
        status: { in: ACTIVE_STATUSES }
    };

    const cacheKey = `learning_requests_demand_${page}_${limit}`;
    let cachedData;
    if (cache) {
        cachedData = await cache.get(cacheKey);
    }

    if (!cachedData) {
        // Use the lean DEMAND_INCLUDE (only _count, no full interests array)
        // and run count + data fetch in parallel to halve the DB round-trips.
        const [requests, total] = await Promise.all([
            prisma.learningRequest.findMany({
                where,
                skip,
                take: limit,
                include: DEMAND_INCLUDE,
                orderBy: [{ interests: { _count: 'desc' } }, { createdAt: 'desc' }]
            }),
            prisma.learningRequest.count({ where })
        ]);

        cachedData = {
            requests,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

        if (cache) {
            // Cache for 10 minutes — mentor demand view is not real-time sensitive.
            await cache.set(cacheKey, cachedData, 600);
        }
    }

    return {
        requests: cachedData.requests.map(r => mapRequest(r, userId)),
        pagination: cachedData.pagination
    };
};

// Internal helper used by the session-approval flow. Updates a learning request
// once a session has been approved for it and notifies every interested learner.
exports.markSessionCreated = async (tx, learningRequestId, sessionId, sessionTitle, sessionLink) => {
    if (!learningRequestId) return { notified: 0 };

    const request = await tx.learningRequest.findUnique({
        where: { id: learningRequestId },
        select: { id: true, status: true, interests: { select: { learnerId: true } } }
    });

    if (!request || request.status === 'CLOSED') {
        return { notified: 0 };
    }

    await tx.learningRequest.update({
        where: { id: learningRequestId },
        data: { status: 'SESSION_CREATED', sessionId }
    });

    const interestedLearners = (request.interests || []).map(i => i.learnerId);

    if (interestedLearners.length > 0) {
        await tx.notification.createMany({
            data: interestedLearners.map(learnerId => ({
                userId: learnerId,
                type: 'LEARNING_REQUEST_SESSION_CREATED',
                title: 'A session you requested is now available',
                message: `A mentor has created a session on ${sessionTitle}.`,
                link: sessionLink
            }))
        });
    }

    return { notified: interestedLearners.length };
};