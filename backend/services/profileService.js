const { sanitizeString, isValidUrl } = require("../utils/validation");
const { uploadToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");
const { calculateBadges } = require("../utils/badges");
const { getFinishedSessionsCount, getUniqueLearnersCount } = require("../utils/sessionUtils");
const { BadRequestError, NotFoundError } = require("../utils/errors");

exports.completeProfile = async (prisma, cache, userId, body, file) => {
    const {
        role,
        department,
        yearOfStudy,
        bio,
        skills,
        phone,
        linkedin,
    } = body;

    if (!role || !department || !yearOfStudy) {
        logger.warn("Validation Failed: Missing required fields", { role, department, yearOfStudy });
        throw new BadRequestError("role, department and yearOfStudy are required");
    }

    const roleValue = role.toLowerCase();
    if (!["mentor", "learner"].includes(roleValue)) {
        logger.warn("Validation Failed: Invalid role", { roleValue });
        throw new BadRequestError("Invalid role provided");
    }

    const normalizedRole = roleValue === "mentor" ? "MENTOR" : "LEARNER";
    const parsedYear = parseInt(yearOfStudy, 10);

    if (Number.isNaN(parsedYear) || parsedYear < 1) {
        logger.warn("Validation Failed: Invalid year", { parsedYear });
        throw new BadRequestError("Invalid yearOfStudy");
    }

    if (normalizedRole === "MENTOR" && (!phone || !phone.trim())) {
        logger.warn("Validation Failed: Mentor missing phone");
        throw new BadRequestError("Phone number is required for mentors");
    }

    let profileImageUrl;
    if (file) {
        if (!file.mimetype.startsWith("image/")) {
            throw new BadRequestError("Only image files are allowed");
        }
        try {
            const uploadResult = await uploadToCloudinary(
                file.buffer,
                file.originalname
            );
            profileImageUrl = uploadResult.secure_url;
        } catch (error) {
            logger.error("Image upload failed details:", error);
            throw new BadRequestError("Image upload failed: " + (error.message || "Unknown error"));
        }
    }

    const trimmedDepartment = department.trim();
    const trimmedBio = bio ? bio.trim() : null;
    const trimmedPhone = phone ? phone.trim() : null;
    const trimmedLinkedin = linkedin ? linkedin.trim() : null;

    if (trimmedLinkedin && !isValidUrl(trimmedLinkedin)) {
        throw new BadRequestError("linkedinUrl must be a valid URL (e.g. https://linkedin.com/in/yourname)");
    }

    let parsedSkills = [];
    if (skills) {
        try {
            parsedSkills = Array.isArray(skills)
                ? skills
                : JSON.parse(skills);
        } catch (error) {
            parsedSkills = [];
        }
    }

    const data = {
        department: sanitizeString(trimmedDepartment),
        year: parsedYear,
        bio: trimmedBio ? sanitizeString(trimmedBio) : null,
        role: normalizedRole,
        isProfileComplete: true,
    };

    if (profileImageUrl) {
        data.profilePicture = profileImageUrl;
    }

    if (trimmedPhone) {
        data.phoneNumber = trimmedPhone;
    }

    if (normalizedRole === "MENTOR") {
        data.mentorSkills = parsedSkills.length
            ? JSON.stringify(parsedSkills)
            : null;
        data.linkedinUrl = trimmedLinkedin || null;
    } else {
        data.mentorSkills = null;
        data.linkedinUrl = null;
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data,
    });

    if (cache) {
        await cache.del(`profile_stats_${userId}`);
    }

    return updatedUser;
};

exports.getMe = async (prisma, cache, userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            department: true,
            year: true,
            bio: true,
            profilePicture: true,
            mentorSkills: true,
            linkedinUrl: true,
            role: true,
            isProfileComplete: true,
            createdAt: true,
            updatedAt: true,
            totalSessions: true,
            averageRating: true,
            totalReviews: true,
            uniqueLearners: true,
            _count: {
                select: {
                    followers: true,
                    likesReceived: true,
                    receivedReviews: true,
                    mentorSessions: {
                        where: { status: 'COMPLETED' }
                    }
                }
            }
        },
    });

    if (!user) {
        throw new NotFoundError("User not found");
    }

    if (user.mentorSkills) {
        try {
            user.mentorSkills = JSON.parse(user.mentorSkills);
        } catch (e) {
            user.mentorSkills = [];
        }
    }

    const cacheKey = `profile_stats_${user.id}`;
    let cachedStats = cache ? await cache.get(cacheKey) : null;

    let uniqueLearners;
    let finishedSessionsCount;
    let badges;

    if (cachedStats) {
        uniqueLearners = cachedStats.uniqueLearners;
        finishedSessionsCount = cachedStats.finishedSessionsCount;
        badges = cachedStats.badges;
    } else {
        uniqueLearners = 0;
        if (user.role === 'MENTOR') {
            uniqueLearners = await getUniqueLearnersCount(prisma, user.id);

            // Self-healing DB update
            if (user.uniqueLearners !== uniqueLearners) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { uniqueLearners }
                });
                user.uniqueLearners = uniqueLearners;
            }
        }

        // count finished sessions
        finishedSessionsCount = await getFinishedSessionsCount(prisma, userId);

        const effectiveSessions = Math.max(user.totalSessions, finishedSessionsCount);

        badges = user.role === 'MENTOR'
            ? calculateBadges({
                ...user,
                totalSessions: effectiveSessions
            }, uniqueLearners)
            : [];

        if (cache) {
            await cache.set(cacheKey, { uniqueLearners, finishedSessionsCount, badges }, 300);
        }
    }

    const effectiveSessions = Math.max(user.totalSessions, finishedSessionsCount);

    return {
        ...user,
        followersCount: user._count.followers,
        likesCount: user._count.likesReceived,
        badges,
        uniqueLearners,
        totalSessions: effectiveSessions,
        _count: undefined
    };
};

exports.updateProfile = async (prisma, cache, userId, body, file) => {
    const {
        name,
        department,
        yearOfStudy,
        bio,
        skills,
        phone,
        linkedin,
    } = body;

    const updateData = {};

    if (name && name.trim()) {
        updateData.name = sanitizeString(name.trim());
    }

    if (department && department.trim()) {
        updateData.department = sanitizeString(department.trim());
    }

    if (yearOfStudy) {
        const parsedYear = parseInt(yearOfStudy, 10);
        if (!Number.isNaN(parsedYear) && parsedYear >= 1) {
            updateData.year = parsedYear;
        }
    }

    if (bio !== undefined) {
        updateData.bio = bio ? sanitizeString(bio.trim()) : null;
    }

    if (phone !== undefined) {
        updateData.phoneNumber = phone ? phone.trim() : null;
    }

    if (linkedin !== undefined) {
        const trimmedLinkedin = linkedin ? linkedin.trim() : null;
        if (trimmedLinkedin && !isValidUrl(trimmedLinkedin)) {
            throw new BadRequestError("linkedinUrl must be a valid URL (e.g. https://linkedin.com/in/yourname)");
        }
        updateData.linkedinUrl = trimmedLinkedin;
    }

    if (skills !== undefined) {
        try {
            const parsedSkills = Array.isArray(skills)
                ? skills
                : JSON.parse(skills);
            updateData.mentorSkills = JSON.stringify(parsedSkills);
        } catch (error) {
            updateData.mentorSkills = null;
        }
    }

    if (file) {
        if (!file.mimetype.startsWith("image/")) {
            throw new BadRequestError("Only image files are allowed");
        }
        try {
            const uploadResult = await uploadToCloudinary(
                file.buffer,
                file.originalname
            );
            updateData.profilePicture = uploadResult.secure_url;
        } catch (error) {
            logger.error("Image upload failed details:", error);
            throw new BadRequestError("Image upload failed: " + (error.message || "Unknown error"));
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            department: true,
            year: true,
            bio: true,
            profilePicture: true,
            mentorSkills: true,
            linkedinUrl: true,
            role: true,
            isProfileComplete: true,
            updatedAt: true,
        },
    });

    if (updatedUser.mentorSkills) {
        try {
            updatedUser.mentorSkills = JSON.parse(updatedUser.mentorSkills);
        } catch (e) {
            updatedUser.mentorSkills = [];
        }
    }

    if (cache) {
        await cache.del(`profile_stats_${userId}`);
    }

    return updatedUser;
};

exports.getMentors = async (prisma, cache, userId, queryParams) => {
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `mentor_list_${userId}_${page}_${limit}`;
    if (cache && await cache.has(cacheKey)) {
        return await cache.get(cacheKey);
    }

    // 1. Group bookings by sessionId and userId to get all unique learner-session pairs
    const bookings = await prisma.booking.groupBy({
        by: ['sessionId', 'userId'],
        where: {
            status: { in: ['CONFIRMED', 'COMPLETED'] }
        }
    });

    // 2. Fetch all session mappings to mentorIds to resolve the unique learners per mentor
    const sessions = await prisma.session.findMany({
        select: { id: true, mentorId: true }
    });
    const sessionToMentorMap = new Map(sessions.map(s => [s.id, s.mentorId]));

    // 3. Build a set of unique learner userIds per mentorId
    const mentorLearnersSetMap = new Map();
    for (const booking of bookings) {
        const mentorId = sessionToMentorMap.get(booking.sessionId);
        if (mentorId) {
            if (!mentorLearnersSetMap.has(mentorId)) {
                mentorLearnersSetMap.set(mentorId, new Set());
            }
            mentorLearnersSetMap.get(mentorId).add(booking.userId);
        }
    }

    // 4. Create unique learners count map keyed by mentorId
    const uniqueLearnersMap = new Map();
    for (const [mentorId, learnersSet] of mentorLearnersSetMap.entries()) {
        uniqueLearnersMap.set(mentorId, learnersSet.size);
    }

    // 5. Query total count and paginate + sort the mentors at database level
    const [mentors, total] = await Promise.all([
        prisma.user.findMany({
            where: {
                role: "MENTOR",
                isProfileComplete: true
            },
            orderBy: [
                { averageRating: 'desc' },
                { totalSessions: 'desc' }
            ],
            skip,
            take: limit,
            select: {
                id: true,
                name: true,
                department: true,
                profilePicture: true,
                mentorSkills: true,
                averageRating: true,
                totalSessions: true,
                totalReviews: true,
                _count: {
                    select: {
                        followers: true,
                        likesReceived: true,
                        receivedReviews: true,
                        mentorSessions: {
                            where: {
                                status: { in: ['COMPLETED', 'LIVE', 'UPCOMING'] },
                                bookings: {
                                    some: {
                                        status: { in: ['CONFIRMED', 'COMPLETED'] }
                                    }
                                }
                            }
                        }
                    }
                },
                followers: {
                    where: { followerId: userId },
                    select: { id: true }
                },
                likesReceived: {
                    where: { userId: userId },
                    select: { id: true }
                }
            }
        }),
        prisma.user.count({
            where: {
                role: "MENTOR",
                isProfileComplete: true
            }
        })
    ]);

    // 6. Map and hydrate the paginated results
    const fullyHydratedMentors = mentors.map((mentor) => {
        const effectiveSessions = mentor._count.mentorSessions;
        let skills = [];
        try {
            skills = mentor.mentorSkills ? JSON.parse(mentor.mentorSkills) : [];
        } catch (e) { }

        const uniqueLearners = uniqueLearnersMap.get(mentor.id) || 0;
        const badges = calculateBadges({
            ...mentor,
            totalSessions: effectiveSessions
        }, uniqueLearners);

        return {
            id: mentor.id,
            name: mentor.name,
            department: mentor.department,
            profilePicture: mentor.profilePicture,
            mentorSkills: skills,
            averageRating: mentor.averageRating,
            totalSessions: effectiveSessions,
            totalReviews: mentor.totalReviews,
            followersCount: mentor._count.followers,
            likesCount: mentor._count.likesReceived,
            isFollowing: mentor.followers.length > 0,
            isLiked: mentor.likesReceived.length > 0,
            uniqueLearners,
            badges
        };
    });

    const totalPages = Math.ceil(total / limit);
    const response = {
        mentors: fullyHydratedMentors,
        pagination: {
            page,
            limit,
            total,
            totalPages
        }
    };

    if (cache) {
        await cache.set(cacheKey, response, 300);
    }

    return response;
};

exports.getProfileById = async (prisma, cache, userId, id) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            department: true,
            year: true,
            bio: true,
            profilePicture: true,
            mentorSkills: true,
            linkedinUrl: true,
            role: true,
            isProfileComplete: true,
            createdAt: true,
            updatedAt: true,
            totalSessions: true,
            averageRating: true,
            totalReviews: true,
            uniqueLearners: true,
            _count: {
                select: {
                    followers: true,
                    likesReceived: true,
                    receivedReviews: true,
                    mentorSessions: { where: { status: 'COMPLETED' } }
                }
            },
            followers: {
                where: { followerId: userId },
                select: { id: true }
            },
            likesReceived: {
                where: { userId },
                select: { id: true }
            }
        },
    });

    if (!user) {
        throw new NotFoundError("User not found");
    }

    if (user.mentorSkills) {
        try {
            user.mentorSkills = JSON.parse(user.mentorSkills);
        } catch (e) {
            user.mentorSkills = [];
        }
    }

    const cacheKey = `profile_stats_${user.id}`;
    let cachedStats = cache ? await cache.get(cacheKey) : null;

    let uniqueLearners;
    let finishedSessionsCount;
    let badges;

    if (cachedStats) {
        uniqueLearners = cachedStats.uniqueLearners;
        finishedSessionsCount = cachedStats.finishedSessionsCount;
        badges = cachedStats.badges;
    } else {
        uniqueLearners = 0;
        if (user.role === 'MENTOR') {
            uniqueLearners = await getUniqueLearnersCount(prisma, user.id);

            // Self-healing DB update
            if (user.uniqueLearners !== uniqueLearners) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { uniqueLearners }
                });
                user.uniqueLearners = uniqueLearners;
            }
        }

        // count finished sessions
        finishedSessionsCount = await getFinishedSessionsCount(prisma, user.id);

        const effectiveSessions = Math.max(user.totalSessions, finishedSessionsCount);

        badges = user.role === 'MENTOR'
            ? calculateBadges({
                ...user,
                totalSessions: effectiveSessions
            }, uniqueLearners)
            : [];

        if (cache) {
            await cache.set(cacheKey, { uniqueLearners, finishedSessionsCount, badges }, 300);
        }
    }

    const effectiveSessions = Math.max(user.totalSessions, finishedSessionsCount);

    return {
        ...user,
        followersCount: user._count.followers,
        likesCount: user._count.likesReceived,
        badges,
        uniqueLearners,
        totalSessions: effectiveSessions,
        isFollowing: user.followers.length > 0,
        isLiked: user.likesReceived.length > 0,
        followers: undefined,
        likesReceived: undefined,
        _count: undefined
    };
};
