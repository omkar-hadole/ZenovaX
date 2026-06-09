const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger");
const { BadRequestError } = require("../utils/errors");

// Fail fast if no key
if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
}

const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: "gemini-flash-latest" });
const HELP_CONTEXT = fs.readFileSync(path.join(__dirname, '../../HELP_CENTER.md'), 'utf8');

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

    try {
        const result = await model.generateContent(SYSTEM_PROMPT + question);
        return { answer: result.response.text() };
    } catch (error) {
        logger.error("AI Service Error:", { message: error.message, status: error.status });

        if (error.status === 429 || error.message.includes("429")) {
            return { answer: "API Quota Exceeded (429). Your Google Project has no quota left. Please create a NEW Project." };
        }

        return { answer: "I'm having trouble connecting to the AI service right now. Please try again later." };
    }
};
