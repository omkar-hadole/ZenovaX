const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger");
const { BadRequestError } = require("../utils/errors");

// Lazily initialized on first askAI call so a missing key
// doesn't crash the server at startup.
let model = null;

const HELP_CONTEXT = fs.readFileSync(path.join(__dirname, '../HELP_CENTER.md'), 'utf8');

const SYSTEM_PROMPT = `You're ZenovaX support. Context:\n${HELP_CONTEXT}\n\nAnswer ONLY using context. If unrelated, say "I can’t help with this. Please contact WhatsApp support."\n\nQuestion: `;

exports.askAI = async (user, { question, username } = {}) => {
    if (!question) {
        throw new BadRequestError("Question is required");
    }

    const q = question.toLowerCase().trim();

    const ownerTriggers = [
        'who created',
        'who made',
        'who built',
        'who owns',
        'owner of',
        'creator of',
        'who is the owner',
        'who is the creator',
        'who is the owner of',
        'who is the creator of',
        'who is the owner of the platform',
        'who is the creator of the platform',
        'ceo',
        'founder',
        'owner',
        'creator',
        'who are you',
    ];

    const isOwnerQuestion = ownerTriggers.some(trigger => q.includes(trigger));

    if (isOwnerQuestion) {
        const name = user?.username || username || 'You';

        const responses = [
            `ZenovaX was built by you, ${name}. Without you, this platform wouldn’t exist.`,
            `${name}, you’re the reason ZenovaX exists. No you, no platform.`,
            `This platform? Yours, ${name}. ZenovaX exists because you made it happen.`,
            `I am Zen, your AI assistant. And you are ${name}, the creator of ZenovaX.`
        ];

        return {
            answer: responses[Math.floor(Math.random() * responses.length)]
        };
    }

    // Lazy initialization — only instantiate the model when it is actually needed.
    if (!model) {
        if (!process.env.GEMINI_API_KEY) {
            logger.warn("GEMINI_API_KEY is not set. AI assistant is unavailable.");
            return { answer: "The AI assistant is not configured right now. Please contact WhatsApp support for help." };
        }
        model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: "gemini-flash-latest" });
    }

    try {
        // Gemini occasionally degrades under load (503 "high demand") and can
        // otherwise take 10-20+s to respond — a 30s timeout means a chat
        // widget hangs for half a minute before failing. 8s keeps the worst
        // case bounded to something a "thinking..." indicator can cover.
        const result = await model.generateContent(SYSTEM_PROMPT + question, { timeout: 8000 });
        return { answer: result.response.text() };
    } catch (error) {
        logger.error("AI Service Error:", { message: error.message, status: error.status });

        if (error.status === 429 || error.message.includes("429")) {
            return { answer: "API Quota Exceeded (429). Your Google Project has no quota left. Please create a NEW Project." };
        }

        if (error.code === 'ETIMEDOUT' || /timeout|abort/i.test(error.message || '')) {
            return { answer: "The AI assistant is taking too long to respond right now. Please try again in a moment." };
        }

        return { answer: "I'm having trouble connecting to the AI service right now. Please try again later." };
    }
};
