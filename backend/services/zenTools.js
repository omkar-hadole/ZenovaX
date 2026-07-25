const logger = require("../utils/logger");
const sessionService = require("./sessionService");
const profileService = require("./profileService");

const MAX_NAME_LENGTH = 80;
const MAX_DESC_LENGTH = 200;
const MAX_BIO_LENGTH = 300;

const truncate = (str, max) =>
    (typeof str === 'string' && str.length > max) ? `${str.slice(0, max)}…` : (str || '');

const safeParseJSON = (str, fallback = []) => {
    if (!str) return fallback;
    try { const p = JSON.parse(str); return Array.isArray(p) ? p : fallback; } catch { return fallback; }
};

const EMPTY_IDENTITY = { text: '', name: null };
exports.getUserIdentitySnippet = async (prisma, userId) => {
    if (!userId) return EMPTY_IDENTITY;
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, year: true, department: true, mentorSkills: true, role: true }
        });
        if (!user) return EMPTY_IDENTITY;
        const name = truncate(user.name, MAX_NAME_LENGTH) || null;
        const parts = [name];
        if (user.role === 'MENTOR' || user.role === 'BOTH') {
            const skills = safeParseJSON(user.mentorSkills, []);
            if (skills.length > 0) parts.push(`Skills: ${skills.slice(0, 5).join(', ')}`);
            if (user.department) parts.push(truncate(user.department, MAX_NAME_LENGTH));
        } else {
            if (user.year) parts.push(`Year ${user.year}`);
            if (user.department) parts.push(truncate(user.department, MAX_NAME_LENGTH));
        }
        return { text: parts.filter(Boolean).join(', '), name: name ? name.split(' ')[0] : null };
    } catch (error) {
        logger.error('Zen: failed to load identity snippet', { message: error.message });
        return EMPTY_IDENTITY;
    }
};

exports.getRecentSessions = async (prisma, userId, { limit } = {}) => {
    if (!userId) return { error: true, reason: 'unauthorized' };
    const take = Math.min(Math.max(parseInt(limit, 10) || 2, 1), 10);
    try {
        const overFetchLimit = Math.min(take * 5, 50);
        const { sessions } = await sessionService.getMyBookings(prisma, userId, {
            limit: overFetchLimit,
            status: 'all'
        });
        const confirmed = sessions.filter(
            s => s.bookingStatus === 'CONFIRMED' || s.bookingStatus === 'COMPLETED'
        );
        return confirmed.slice(0, take).map(s => ({
            title: truncate(s.title, MAX_NAME_LENGTH),
            subject: truncate(s.subject, MAX_NAME_LENGTH),
            description: truncate(s.description, MAX_DESC_LENGTH),
            mentorName: truncate(s.mentor?.name, MAX_NAME_LENGTH),
            scheduledAt: s.scheduledAt,
            status: s.sessionStatus
        }));
    } catch (error) {
        logger.error('Zen: getRecentSessions failed', { message: error.message });
        return { error: true, reason: 'temporarily_unavailable' };
    }
};

exports.searchMentors = async (prisma, { department, skillKeyword, limit } = {}) => {
    try {
        return await profileService.searchMentorsFiltered(prisma, { department, skillKeyword, limit });
    } catch (error) {
        logger.error('Zen: searchMentors failed', { message: error.message });
        return { error: true, reason: 'temporarily_unavailable' };
    }
};

const resolveMentor = async (prisma, name) => {
    if (!name || typeof name !== 'string') return null;
    return prisma.user.findFirst({
        where: { role: 'MENTOR', name: { contains: name.slice(0, 100) } },
        orderBy: [{ averageRating: 'desc' }, { totalSessions: 'desc' }],
        select: { id: true, name: true }
    });
};

exports.getMentorDetails = async (prisma, cache, userId, mentorName) => {
    try {
        const mentor = await resolveMentor(prisma, mentorName);
        if (!mentor) return { found: false };
        const profile = await profileService.getProfileById(prisma, cache, userId, 'LEARNER', mentor.id);
        return {
            found: true,
            name: profile.name,
            department: profile.department,
            bio: truncate(profile.bio, MAX_BIO_LENGTH),
            mentorSkills: profile.mentorSkills,
            averageRating: profile.averageRating,
            totalSessions: profile.totalSessions,
            totalReviews: profile.totalReviews
        };
    } catch (error) {
        logger.error('Zen: getMentorDetails failed', { message: error.message });
        return { error: true, reason: 'temporarily_unavailable' };
    }
};

exports.checkMentorHistory = async (prisma, userId, mentorName) => {
    if (!userId) return { error: true, reason: 'unauthorized' };
    try {
        const mentor = await resolveMentor(prisma, mentorName);
        if (!mentor) return { found: false };
        const booking = await prisma.booking.findFirst({
            where: { userId, status: { in: ['CONFIRMED', 'COMPLETED'] }, session: { mentorId: mentor.id } },
            orderBy: { session: { scheduledAt: 'desc' } },
            select: { status: true, session: { select: { scheduledAt: true } } }
        });
        return {
            found: true,
            mentorName: truncate(mentor.name, MAX_NAME_LENGTH),
            everBooked: !!booking,
            mostRecentStatus: booking ? booking.status : null,
            mostRecentDate: booking ? booking.session.scheduledAt : null
        };
    } catch (error) {
        logger.error('Zen: checkMentorHistory failed', { message: error.message });
        return { error: true, reason: 'temporarily_unavailable' };
    }
};

const sanitizeSession = (s) => ({
    title: truncate(s.title, MAX_NAME_LENGTH),
    subject: truncate(s.subject, MAX_NAME_LENGTH),
    scheduledAt: s.scheduledAt,
    duration: s.duration,
    status: s.status,
    mode: s.mode,
    department: truncate(s.department, MAX_NAME_LENGTH),
    totalBookings: s.totalBookings ?? 0,
});

exports.getMentorUpcomingSessions = async (prisma, userId, { limit } = {}) => {
    if (!userId) return { error: true, reason: 'unauthorized' };
    const take = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20);
    try {
        const sessions = await prisma.session.findMany({
            where: {
                mentorId: userId,
                status: { in: ['UPCOMING', 'LIVE'] },
                scheduledAt: { gte: new Date() },
                isDeleted: false,
            },
            orderBy: { scheduledAt: 'asc' },
            take,
            select: {
                title: true, subject: true, scheduledAt: true, duration: true,
                status: true, mode: true, department: true, totalBookings: true,
            }
        });
        return sessions.map(sanitizeSession);
    } catch (error) {
        logger.error('Zen: getMentorUpcomingSessions failed', { message: error.message });
        return { error: true, reason: 'temporarily_unavailable' };
    }
};

exports.getMentorRecentSessions = async (prisma, userId, { limit } = {}) => {
    if (!userId) return { error: true, reason: 'unauthorized' };
    const take = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20);
    try {
        const sessions = await prisma.session.findMany({
            where: {
                mentorId: userId,
                status: 'COMPLETED',
                isDeleted: false,
            },
            orderBy: { scheduledAt: 'desc' },
            take,
            select: {
                title: true, subject: true, scheduledAt: true, duration: true,
                status: true, mode: true, department: true, totalBookings: true,
            }
        });
        return sessions.map(sanitizeSession);
    } catch (error) {
        logger.error('Zen: getMentorRecentSessions failed', { message: error.message });
        return { error: true, reason: 'temporarily_unavailable' };
    }
};

exports.getMentorProfile = async (prisma, userId) => {
    if (!userId) return { error: true, reason: 'unauthorized' };
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true, department: true, bio: true, mentorSkills: true,
                averageRating: true, totalSessions: true, totalReviews: true,
                uniqueLearners: true, badgeLevel: true,
            }
        });
        if (!user) return { found: false };
        return {
            name: user.name,
            department: user.department,
            bio: truncate(user.bio, MAX_BIO_LENGTH),
            skills: safeParseJSON(user.mentorSkills, []),
            averageRating: user.averageRating,
            totalSessions: user.totalSessions,
            totalReviews: user.totalReviews,
            uniqueLearners: user.uniqueLearners,
            badgeLevel: user.badgeLevel,
        };
    } catch (error) {
        logger.error('Zen: getMentorProfile failed', { message: error.message });
        return { error: true, reason: 'temporarily_unavailable' };
    }
};

exports.getMentorReviews = async (prisma, userId, { limit } = {}) => {
    if (!userId) return { error: true, reason: 'unauthorized' };
    const take = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20);
    try {
        const reviews = await prisma.review.findMany({
            where: { mentorId: userId },
            orderBy: { createdAt: 'desc' },
            take,
            select: {
                rating: true, comment: true, createdAt: true,
                session: { select: { title: true } },
            }
        });
        return reviews.map(r => ({
            rating: r.rating,
            comment: truncate(r.comment, MAX_DESC_LENGTH),
            sessionTitle: truncate(r.session?.title, MAX_NAME_LENGTH),
            date: r.createdAt,
        }));
    } catch (error) {
        logger.error('Zen: getMentorReviews failed', { message: error.message });
        return { error: true, reason: 'temporarily_unavailable' };
    }
};

exports.getMentorMentees = async (prisma, userId, { limit } = {}) => {
    if (!userId) return { error: true, reason: 'unauthorized' };
    const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    try {
        const bookings = await prisma.booking.findMany({
            where: {
                session: { mentorId: userId },
                status: { in: ['CONFIRMED', 'COMPLETED'] },
            },
            select: { user: { select: { id: true, name: true } } },
            take: take * 2,
        });
        const seen = new Set();
        const mentees = [];
        for (const b of bookings) {
            if (!b.user || seen.has(b.user.id)) continue;
            seen.add(b.user.id);
            mentees.push({ name: (b.user.name || 'Unknown').split(' ')[0] });
            if (mentees.length >= take) break;
        }
        return mentees;
    } catch (error) {
        logger.error('Zen: getMentorMentees failed', { message: error.message });
        return { error: true, reason: 'temporarily_unavailable' };
    }
};
