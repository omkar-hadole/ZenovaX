const { SchemaType } = require("@google/generative-ai");
const { tool } = require("ai");
const { z } = require("zod");
const zenTools = require("./zenTools");

const LEARNER_GEMINI_FN = [
    {
        name: "get_recent_sessions",
        description: "Get the current user's own most recent booked mentorship sessions (title, subject, description, mentor, date, status). Only returns sessions the user actually attended or has confirmed.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                limit: { type: SchemaType.INTEGER, description: "How many recent sessions to return, max 10. Defaults to 2." }
            }
        }
    },
    {
        name: "search_mentors",
        description: "Search the platform's mentor catalog to find or recommend mentors, optionally filtered by department or a skill/topic keyword. Use this for 'find me a mentor' or 'top mentors for me' style questions — do not rely only on the user's past bookings for recommendations.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                department: { type: SchemaType.STRING, description: "Exact department/branch name to filter by, e.g. 'Computer Science'." },
                skillKeyword: { type: SchemaType.STRING, description: "A skill or topic keyword to search mentor skills for, e.g. 'React' or 'DSA'." },
                limit: { type: SchemaType.INTEGER, description: "How many mentors to return, max 10. Defaults to 5." }
            }
        }
    },
    {
        name: "get_mentor_details",
        description: "Get details about one specific mentor by name — department, bio, skills, rating, session count. Use after search_mentors, or when the user names a specific mentor.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                mentorName: { type: SchemaType.STRING, description: "The mentor's name (or part of it) to look up." }
            },
            required: ["mentorName"]
        }
    },
    {
        name: "check_mentor_history",
        description: "Check whether the current user has ever booked a session with a specific mentor, and when their most recent session with that mentor was.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                mentorName: { type: SchemaType.STRING, description: "The mentor's name (or part of it) to check." }
            },
            required: ["mentorName"]
        }
    }
];

const MENTOR_GEMINI_FN = [
    {
        name: "get_mentor_upcoming_sessions",
        description: "Get the currently logged-in mentor's upcoming sessions (scheduled in the future), ordered by date (nearest first). Use this when a mentor asks about their upcoming, next, or future sessions.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                limit: { type: SchemaType.INTEGER, description: "How many upcoming sessions to return, max 20. Defaults to 5." }
            }
        }
    },
    {
        name: "get_mentor_recent_sessions",
        description: "Get the currently logged-in mentor's recently completed sessions, ordered by date (most recent first). Use this when a mentor asks about their recent, past, last, or previous sessions, or asks to summarize their sessions.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                limit: { type: SchemaType.INTEGER, description: "How many recent sessions to return, max 20. Defaults to 5." }
            }
        }
    },
    {
        name: "get_mentor_profile",
        description: "Get the currently logged-in mentor's own profile information: name, department, bio, skills, average rating, total sessions, total reviews, unique learner count, and badge level. Use this when a mentor asks about their own profile, bio, or stats.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {}
        }
    },
    {
        name: "get_mentor_reviews",
        description: "Get recent reviews/feedback received by the currently logged-in mentor, ordered by date (most recent first). Includes rating, comment, and the session title. Use this when a mentor asks about their reviews or feedback.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                limit: { type: SchemaType.INTEGER, description: "How many reviews to return, max 20. Defaults to 5." }
            }
        }
    },
    {
        name: "get_mentor_mentees",
        description: "Get the unique learners/mentees who have booked sessions with the currently logged-in mentor. Returns first names only. Use this when a mentor asks about their learners, students, or mentees.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                limit: { type: SchemaType.INTEGER, description: "How many mentees to return, max 100. Defaults to 20." }
            }
        }
    }
];

const executeZenTool = async (name, prisma, cache, userId, args = {}) => {
    switch (name) {
        case "get_recent_sessions":
            return zenTools.getRecentSessions(prisma, userId, { limit: args.limit });
        case "search_mentors":
            return zenTools.searchMentors(prisma, {
                department: args.department,
                skillKeyword: args.skillKeyword,
                limit: args.limit
            });
        case "get_mentor_details":
            return zenTools.getMentorDetails(prisma, cache, userId, args.mentorName);
        case "check_mentor_history":
            return zenTools.checkMentorHistory(prisma, userId, args.mentorName);
        case "get_mentor_upcoming_sessions":
            return zenTools.getMentorUpcomingSessions(prisma, userId, { limit: args.limit });
        case "get_mentor_recent_sessions":
            return zenTools.getMentorRecentSessions(prisma, userId, { limit: args.limit });
        case "get_mentor_profile":
            return zenTools.getMentorProfile(prisma, userId);
        case "get_mentor_reviews":
            return zenTools.getMentorReviews(prisma, userId, { limit: args.limit });
        case "get_mentor_mentees":
            return zenTools.getMentorMentees(prisma, userId, { limit: args.limit });
        default:
            return { error: true, reason: 'unsupported_capability' };
    }
};
exports.executeZenTool = executeZenTool;

exports.getDeclarationsForRole = (role) => {
    const isMentor = role === 'MENTOR' || role === 'BOTH';
    return isMentor ? MENTOR_GEMINI_FN : LEARNER_GEMINI_FN;
};

exports.buildVercelToolsForRole = (prisma, cache, userId, role) => {
    const isMentor = role === 'MENTOR' || role === 'BOTH';
    if (!userId) return undefined;

    if (isMentor) {
        return {
            get_mentor_upcoming_sessions: tool({
                description: MENTOR_GEMINI_FN[0].description,
                inputSchema: z.object({
                    limit: z.number().int().min(1).max(20).optional().describe("How many upcoming sessions to return.")
                }),
                execute: async (a) => executeZenTool("get_mentor_upcoming_sessions", prisma, cache, userId, a)
            }),
            get_mentor_recent_sessions: tool({
                description: MENTOR_GEMINI_FN[1].description,
                inputSchema: z.object({
                    limit: z.number().int().min(1).max(20).optional().describe("How many recent sessions to return.")
                }),
                execute: async (a) => executeZenTool("get_mentor_recent_sessions", prisma, cache, userId, a)
            }),
            get_mentor_profile: tool({
                description: MENTOR_GEMINI_FN[2].description,
                inputSchema: z.object({}),
                execute: async () => executeZenTool("get_mentor_profile", prisma, cache, userId, {})
            }),
            get_mentor_reviews: tool({
                description: MENTOR_GEMINI_FN[3].description,
                inputSchema: z.object({
                    limit: z.number().int().min(1).max(20).optional().describe("How many reviews to return.")
                }),
                execute: async (a) => executeZenTool("get_mentor_reviews", prisma, cache, userId, a)
            }),
            get_mentor_mentees: tool({
                description: MENTOR_GEMINI_FN[4].description,
                inputSchema: z.object({
                    limit: z.number().int().min(1).max(100).optional().describe("How many mentees to return.")
                }),
                execute: async (a) => executeZenTool("get_mentor_mentees", prisma, cache, userId, a)
            }),
        };
    }

    return {
        get_recent_sessions: tool({
            description: LEARNER_GEMINI_FN[0].description,
            inputSchema: z.object({
                limit: z.number().int().min(1).max(10).optional().describe("How many recent sessions to return, max 10. Defaults to 2.")
            }),
            execute: async (a) => executeZenTool("get_recent_sessions", prisma, cache, userId, a)
        }),
        search_mentors: tool({
            description: LEARNER_GEMINI_FN[1].description,
            inputSchema: z.object({
                department: z.string().max(100).optional().describe("Exact department/branch name to filter by."),
                skillKeyword: z.string().max(100).optional().describe("A skill or topic keyword to search mentor skills for."),
                limit: z.number().int().min(1).max(10).optional().describe("How many mentors to return, max 10. Defaults to 5.")
            }),
            execute: async (a) => executeZenTool("search_mentors", prisma, cache, userId, a)
        }),
        get_mentor_details: tool({
            description: LEARNER_GEMINI_FN[2].description,
            inputSchema: z.object({
                mentorName: z.string().min(1).max(100).describe("The mentor's name (or part of it) to look up.")
            }),
            execute: async (a) => executeZenTool("get_mentor_details", prisma, cache, userId, a)
        }),
        check_mentor_history: tool({
            description: LEARNER_GEMINI_FN[3].description,
            inputSchema: z.object({
                mentorName: z.string().min(1).max(100).describe("The mentor's name (or part of it) to check.")
            }),
            execute: async (a) => executeZenTool("check_mentor_history", prisma, cache, userId, a)
        })
    };
};
