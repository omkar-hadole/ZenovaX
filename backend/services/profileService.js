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
        profilePicture,
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
    } else if (profilePicture) {
        data.profilePicture = profilePicture;
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
        await cache.del('dashboard_top_mentors');
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
        profilePicture,
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

    if (profilePicture !== undefined) {
        updateData.profilePicture = profilePicture;
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
        await cache.del('dashboard_top_mentors');
    }

    return updatedUser;
};

exports.getMentors = async (prisma, cache, userId, queryParams) => {
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `mentor_list_${page}_${limit}`;
    let cachedData;

    if (cache && await cache.has(cacheKey)) {
        cachedData = await cache.get(cacheKey);
    } else {
        // 1. Query total count and paginate + sort the mentors at database level
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
                    uniqueLearners: true,
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

        // 2. Map and hydrate the paginated results for shared caching (excluding user-specific flags)
        const basicMentors = mentors.map((mentor) => {
            const effectiveSessions = mentor._count.mentorSessions;
            let skills = [];
            try {
                skills = mentor.mentorSkills ? JSON.parse(mentor.mentorSkills) : [];
            } catch (e) {
                // Ignore parsing errors
            }

            const uniqueLearners = mentor.uniqueLearners || 0;
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
                uniqueLearners,
                badges
            };
        });

        const totalPages = Math.ceil(total / limit);
        cachedData = {
            mentors: basicMentors,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };

        if (cache) {
            await cache.set(cacheKey, cachedData, 300);
        }
    }

    // 3. Dynamically merge user-specific relations (isFollowing and isLiked) outside the cache boundary
    const mentorIds = cachedData.mentors.map(m => m.id);

    const [userFollows, userLikes] = await Promise.all([
        prisma.follow.findMany({
            where: {
                followerId: userId,
                followingId: { in: mentorIds }
            },
            select: { followingId: true }
        }),
        prisma.like.findMany({
            where: {
                userId: userId,
                mentorId: { in: mentorIds }
            },
            select: { mentorId: true }
        })
    ]);

    const userFollowedIds = new Set(userFollows.map(f => f.followingId));
    const userLikedIds = new Set(userLikes.map(l => l.mentorId));

    const fullyHydratedMentors = cachedData.mentors.map((mentor) => ({
        ...mentor,
        isFollowing: userFollowedIds.has(mentor.id),
        isLiked: userLikedIds.has(mentor.id)
    }));

    return {
        mentors: fullyHydratedMentors,
        pagination: cachedData.pagination
    };
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
