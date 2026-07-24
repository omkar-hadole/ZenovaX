const { SchemaType } = require("@google/generative-ai");
const { tool } = require("ai");
const { z } = require("zod");
const zenTools = require("./zenTools");

// Static schemas — shared across requests since they carry no user data.
// Every schema deliberately has NO user-id parameter: userId is threaded in
// server-side by executeZenTool from the authenticated session, never from
// model-supplied args, so there's no parameter surface for a prompt-
// injection attempt to target another user's data.
const GEMINI_FUNCTION_DECLARATIONS = [
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

// The single shared dispatcher — used identically by the Gemini manual tool
// loop and the Vercel `tool()` `execute` closures. `userId` is an explicit
// argument on every call, never stored in closure/module state, so a
// concurrent request can never cross-contaminate another request's userId
// during tool execution.
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
        default:
            return { error: true, reason: 'unsupported_capability' };
    }
};
exports.executeZenTool = executeZenTool;
exports.GEMINI_FUNCTION_DECLARATIONS = GEMINI_FUNCTION_DECLARATIONS;

// Built fresh inside each askAIWithChatGPT call (never at module load) so
// the bound `execute` closures below never leak one request's prisma/cache/
// userId into a concurrent request.
exports.buildVercelTools = (prisma, cache, userId) => ({
    get_recent_sessions: tool({
        description: GEMINI_FUNCTION_DECLARATIONS[0].description,
        inputSchema: z.object({
            limit: z.number().int().min(1).max(10).optional().describe("How many recent sessions to return, max 10. Defaults to 2.")
        }),
        execute: async (args) => executeZenTool("get_recent_sessions", prisma, cache, userId, args)
    }),
    search_mentors: tool({
        description: GEMINI_FUNCTION_DECLARATIONS[1].description,
        inputSchema: z.object({
            department: z.string().max(100).optional().describe("Exact department/branch name to filter by."),
            skillKeyword: z.string().max(100).optional().describe("A skill or topic keyword to search mentor skills for."),
            limit: z.number().int().min(1).max(10).optional().describe("How many mentors to return, max 10. Defaults to 5.")
        }),
        execute: async (args) => executeZenTool("search_mentors", prisma, cache, userId, args)
    }),
    get_mentor_details: tool({
        description: GEMINI_FUNCTION_DECLARATIONS[2].description,
        inputSchema: z.object({
            mentorName: z.string().min(1).max(100).describe("The mentor's name (or part of it) to look up.")
        }),
        execute: async (args) => executeZenTool("get_mentor_details", prisma, cache, userId, args)
    }),
    check_mentor_history: tool({
        description: GEMINI_FUNCTION_DECLARATIONS[3].description,
        inputSchema: z.object({
            mentorName: z.string().min(1).max(100).describe("The mentor's name (or part of it) to check.")
        }),
        execute: async (args) => executeZenTool("check_mentor_history", prisma, cache, userId, args)
    })
});
