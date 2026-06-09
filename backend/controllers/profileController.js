const { sanitizeString, isValidUrl } = require("../utils/validation");
const { uploadToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

exports.completeProfile = async (req, res, next) => {
    try {
        const {
            role,
            department,
            yearOfStudy,
            bio,
            skills,
            phone,
            linkedin,
        } = req.body;

        if (!role || !department || !yearOfStudy) {
            logger.warn("Validation Failed: Missing required fields", { role, department, yearOfStudy });
            return res
                .status(400)
                .json({ error: "role, department and yearOfStudy are required" });
        }

        const roleValue = role.toLowerCase();
        if (!["mentor", "learner"].includes(roleValue)) {
            logger.warn("Validation Failed: Invalid role", { roleValue });
            return res.status(400).json({ error: "Invalid role provided" });
        }

        const normalizedRole = roleValue === "mentor" ? "MENTOR" : "LEARNER";
        const parsedYear = parseInt(yearOfStudy, 10);

        if (Number.isNaN(parsedYear) || parsedYear < 1) {
            logger.warn("Validation Failed: Invalid year", { parsedYear });
            return res.status(400).json({ error: "Invalid yearOfStudy" });
        }

        if (normalizedRole === "MENTOR" && (!phone || !phone.trim())) {
            logger.warn("Validation Failed: Mentor missing phone");
            return res
                .status(400)
                .json({ error: "Phone number is required for mentors" });
        }

        let profileImageUrl;
        if (req.file) {
            if (!req.file.mimetype.startsWith("image/")) {
                return res.status(400).json({ error: "Only image files are allowed" });
            }
            try {
                const uploadResult = await uploadToCloudinary(
                    req.file.buffer,
                    req.file.originalname
                );
                profileImageUrl = uploadResult.secure_url;
            } catch (error) {
                logger.error("Image upload failed details:", error);
                return res.status(400).json({
                    error: "Image upload failed",
                    details: error.message || "Unknown Cloudinary error"
                });
            }
        }

        const trimmedDepartment = department.trim();
        const trimmedBio = bio ? bio.trim() : null;
        const trimmedPhone = phone ? phone.trim() : null;
        const trimmedLinkedin = linkedin ? linkedin.trim() : null;

        if (trimmedLinkedin && !isValidUrl(trimmedLinkedin)) {
            return res.status(400).json({ error: "linkedinUrl must be a valid URL (e.g. https://linkedin.com/in/yourname)" });
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

        const updatedUser = await req.prisma.user.update({
            where: { id: req.user.id },
            data,
        });

        if (req.cache) {
            req.cache.del(`profile_stats_${req.user.id}`);
        }

        return res.json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        return next(error);
    }
};


const { calculateBadges } = require("../utils/badges");
const { getFinishedSessionsCount, getUniqueLearnersCount } = require("../utils/sessionUtils");

exports.getMe = async (req, res, next) => {
    try {
        const user = await req.prisma.user.findUnique({
            where: { id: req.user.id },
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
            return res.status(404).json({ error: "User not found" });
        }

        if (user.mentorSkills) {
            try {
                user.mentorSkills = JSON.parse(user.mentorSkills);
            } catch (e) {
                user.mentorSkills = [];
            }
        }

        const cacheKey = `profile_stats_${user.id}`;
        let cachedStats = req.cache ? await req.cache.get(cacheKey) : null;

        let uniqueLearners;
        let finishedSessionsCount;
        let badges;

        if (cachedStats) {
            uniqueLearners = cachedStats.uniqueLearners;
            finishedSessionsCount = cachedStats.finishedSessionsCount;
            badges = cachedStats.badges;
        } else {
            // Calculate unique learners helped
            uniqueLearners = 0;
            if (user.role === 'MENTOR') {
                uniqueLearners = await getUniqueLearnersCount(req.prisma, user.id);

                // Self-healing DB update
                if (user.uniqueLearners !== uniqueLearners) {
                    await req.prisma.user.update({
                        where: { id: user.id },
                        data: { uniqueLearners }
                    });
                    user.uniqueLearners = uniqueLearners;
                }
            }

            // count finished sessions
            finishedSessionsCount = await getFinishedSessionsCount(req.prisma, req.user.id);

            const effectiveSessions = Math.max(user.totalSessions, finishedSessionsCount);

            badges = user.role === 'MENTOR'
                ? calculateBadges({
                    ...user,
                    totalSessions: effectiveSessions
                }, uniqueLearners)
                : [];

            if (req.cache) {
                await req.cache.set(cacheKey, { uniqueLearners, finishedSessionsCount, badges }, 300);
            }
        }

        const effectiveSessions = Math.max(user.totalSessions, finishedSessionsCount);

        const responseUser = {
            ...user,
            followersCount: user._count.followers,
            likesCount: user._count.likesReceived,
            badges,
            uniqueLearners,
            totalSessions: effectiveSessions,
            _count: undefined
        };

        return res.json({ user: responseUser });
    } catch (error) {
        return next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const {
            name,
            department,
            yearOfStudy,
            bio,
            skills,
            phone,
            linkedin,
        } = req.body;

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
                return res.status(400).json({ error: "linkedinUrl must be a valid URL (e.g. https://linkedin.com/in/yourname)" });
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

        if (req.file) {
            if (!req.file.mimetype.startsWith("image/")) {
                return res.status(400).json({ error: "Only image files are allowed" });
            }
            try {
                const uploadResult = await uploadToCloudinary(
                    req.file.buffer,
                    req.file.originalname
                );
                updateData.profilePicture = uploadResult.secure_url;
            } catch (error) {
                logger.error("Image upload failed details:", error);
                return res.status(400).json({
                    error: "Image upload failed",
                    details: error.message || "Unknown Cloudinary error"
                });
            }
        }

        const updatedUser = await req.prisma.user.update({
            where: { id: req.user.id },
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

        if (req.cache) {
            await req.cache.del(`profile_stats_${req.user.id}`);
        }

        return res.json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        return next(error);
    }
};

exports.getMentors = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const cacheKey = `mentor_list_${userId}_${page}_${limit}`;
        if (req.cache && await req.cache.has(cacheKey)) {
            return res.json(await req.cache.get(cacheKey));
        }

        // 1. Group bookings by sessionId and userId to get all unique learner-session pairs
        const bookings = await req.prisma.booking.groupBy({
            by: ['sessionId', 'userId'],
            where: {
                status: { in: ['CONFIRMED', 'COMPLETED'] }
            }
        });

        // 2. Fetch all session mappings to mentorIds to resolve the unique learners per mentor
        const sessions = await req.prisma.session.findMany({
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
            req.prisma.user.findMany({
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
            req.prisma.user.count({
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

        if (req.cache) {
            await req.cache.set(cacheKey, response, 300);
        }

        return res.json(response);

    } catch (error) {
        return next(error);
    }
};

exports.getProfileById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;

        const user = await req.prisma.user.findUnique({
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
                // Stats
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
                    where: { followerId: currentUserId },
                    select: { id: true }
                },
                likesReceived: {
                    where: { userId: currentUserId },
                    select: { id: true }
                }
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.mentorSkills) {
            try {
                user.mentorSkills = JSON.parse(user.mentorSkills);
            } catch (e) {
                user.mentorSkills = [];
            }
        }

        const cacheKey = `profile_stats_${user.id}`;
        let cachedStats = req.cache ? await req.cache.get(cacheKey) : null;

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
                uniqueLearners = await getUniqueLearnersCount(req.prisma, user.id);

                // Self-healing DB update
                if (user.uniqueLearners !== uniqueLearners) {
                    await req.prisma.user.update({
                        where: { id: user.id },
                        data: { uniqueLearners }
                    });
                    user.uniqueLearners = uniqueLearners;
                }
            }

            // count finished sessions
            finishedSessionsCount = await getFinishedSessionsCount(req.prisma, user.id);

            const effectiveSessions = Math.max(user.totalSessions, finishedSessionsCount);

            badges = user.role === 'MENTOR'
                ? calculateBadges({
                    ...user,
                    totalSessions: effectiveSessions
                }, uniqueLearners)
                : [];

            if (req.cache) {
                await req.cache.set(cacheKey, { uniqueLearners, finishedSessionsCount, badges }, 300);
            }
        }

        const effectiveSessions = Math.max(user.totalSessions, finishedSessionsCount);

        const responseUser = {
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

        return res.json({ user: responseUser });
    } catch (error) {
        return next(error);
    }
};
