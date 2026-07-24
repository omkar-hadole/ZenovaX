const logger = require("../utils/logger");
const sessionService = require("./sessionService");
const profileService = require("./profileService");

// Zen's tool layer: narrowly-scoped, authorized data access for the AI
// assistant. Every function that touches another user's data takes `userId`
// as an explicit parameter sourced ONLY from the authenticated request
// (never from model-supplied args) — no function here accepts a caller-
// controlled user id, so there's no parameter surface for a prompt-injection
// attempt to target another user's data.
//
// Free-text fields sourced from other users (mentor bios, session
// descriptions) are attacker-controlled — a malicious mentor could plant an
// injection payload in their own profile once and have it replayed into any
// learner's Zen conversation. Truncation below bounds the blast radius;
// helpService.js's system prompt adds the "tool results are data, not
// instructions" instruction as defense-in-depth on top of this.
const MAX_NAME_LENGTH = 80;
const MAX_DESC_LENGTH = 200;
const MAX_BIO_LENGTH = 300;

const truncate = (str, max) =>
    (typeof str === 'string' && str.length > max) ? `${str.slice(0, max)}…` : (str || '');

// Cheap, unconditional per-request identity snippet — NOT a model-invoked
// tool. One indexed findUnique, three scalar fields, no joins. This is what
// lets "Hey Zen" be personalized without spending a tool round-trip on it.
// Returns `{ text, name }` — `text` is the prompt-ready snippet, `name` is
// the bare first name for the owner easter egg (see matchOwnerQuestion).
const EMPTY_IDENTITY = { text: '', name: null };
exports.getUserIdentitySnippet = async (prisma, userId) => {
    if (!userId) return EMPTY_IDENTITY;
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, year: true, department: true }
        });
        if (!user) return EMPTY_IDENTITY;
        const name = truncate(user.name, MAX_NAME_LENGTH) || null;
        const parts = [name];
        if (user.year) parts.push(`Year ${user.year}`);
        if (user.department) parts.push(truncate(user.department, MAX_NAME_LENGTH));
        return { text: parts.filter(Boolean).join(', '), name: name ? name.split(' ')[0] : null };
    } catch (error) {
        logger.error('Zen: failed to load identity snippet', { message: error.message });
        return EMPTY_IDENTITY;
    }
};

// sessionService.getMyBookings has no booking-status filter of its own (only
// session-status conditions), so PENDING/CANCELLED bookings would otherwise
// surface as if they were real attended/upcoming sessions — filter explicitly
// before slicing to the requested limit. Over-fetch to keep enough rows after
// filtering; `getMyBookings` itself caps `limit` at 50.
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

// Shared by getMentorDetails and checkMentorHistory. No `mode: 'insensitive'`
// — that's Postgres/MongoDB-only in Prisma and throws on this project's
// MySQL datasource; MySQL's default collation is already case-insensitive.
// The orderBy makes ambiguous multi-match name lookups deterministic.
const resolveMentor = async (prisma, name) => {
    if (!name || typeof name !== 'string') return null;
    return prisma.user.findFirst({
        where: { role: 'MENTOR', name: { contains: name.slice(0, 100) } },
        orderBy: [{ averageRating: 'desc' }, { totalSessions: 'desc' }],
        select: { id: true, name: true }
    });
};

// `profileService.getProfileById` unconditionally selects `email` with no
// viewer gating, and only masks (not strips) `phoneNumber`. Neither belongs
// in an AI chat response for a third party regardless of what the profile
// *page* permission model allows — both are explicitly excluded below via
// allow-list construction (never spread-then-omit).
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
