const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger");
const { BadRequestError } = require("../utils/errors");

// Lazily initialized on first askAI call so a missing key
// doesn't crash the server at startup.
let model = null;

// The @openai-oauth/* packages and `ai` are ESM-only (no CJS build), so they
// can't be `require()`'d directly from this CommonJS backend — loaded once
// via dynamic import() and cached, same lazy-init spirit as `model` above.
let openaiOAuthModulesPromise = null;
const loadOpenAIOAuthModules = () => {
    if (!openaiOAuthModulesPromise) {
        openaiOAuthModulesPromise = Promise.all([
            import('@openai-oauth/ai-sdk'),
            import('@openai-oauth/web/server'),
            import('ai'),
        ]).then(([aiSdk, web, ai]) => ({
            createOpenAIOAuth: aiSdk.createOpenAIOAuth,
            openaiCredentials: web.openaiCredentials,
            generateText: ai.generateText,
        }));
    }
    return openaiOAuthModulesPromise;
};

const HELP_CONTEXT = fs.readFileSync(path.join(__dirname, '../HELP_CENTER.md'), 'utf8');

const SYSTEM_PROMPT = `You're ZenovaX support. Context:\n${HELP_CONTEXT}\n\nAnswer ONLY using context. If unrelated, say "I can’t help with this. Please contact WhatsApp support."\n\nQuestion: `;

const OWNER_TRIGGERS = [
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

// Shared by both the Gemini and ChatGPT-OAuth paths so the easter egg (and
// the AI-credit savings from short-circuiting it) behaves identically either
// way.
const matchOwnerQuestion = (question, user, username) => {
    const q = question.toLowerCase().trim();
    if (!OWNER_TRIGGERS.some(trigger => q.includes(trigger))) {
        return null;
    }
    const name = user?.username || username || 'You';
    const responses = [
        `ZenovaX was built by you, ${name}. Without you, this platform wouldn’t exist.`,
        `${name}, you’re the reason ZenovaX exists. No you, no platform.`,
        `This platform? Yours, ${name}. ZenovaX exists because you made it happen.`,
        `I am Zen, your AI assistant. And you are ${name}, the creator of ZenovaX.`
    ];
    return { answer: responses[Math.floor(Math.random() * responses.length)] };
};

exports.askAI = async (user, { question, username } = {}) => {
    if (!question) {
        throw new BadRequestError("Question is required");
    }

    const ownerAnswer = matchOwnerQuestion(question, user, username);
    if (ownerAnswer) {
        return ownerAnswer;
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
            return {
                answer: "API Quota Exceeded (429). Your Google Project has no quota left. Please create a NEW Project.",
                quotaExceeded: true
            };
        }

        if (error.code === 'ETIMEDOUT' || /timeout|abort/i.test(error.message || '')) {
            return { answer: "The AI assistant is taking too long to respond right now. Please try again in a moment." };
        }

        return { answer: "I'm having trouble connecting to the AI service right now. Please try again later." };
    }
};

// Optional, per-user fallback: instead of the shared Gemini key, this uses
// the requester's OWN ChatGPT OAuth session (its access token + account id,
// read straight off this one request's headers — never stored or reused for
// anyone else's request) to answer via their personal ChatGPT account. See
// https://github.com/EvanZhouDev/openai-oauth — each user authenticates with
// their own ChatGPT login client-side; this function never pools credentials
// across users.
exports.askAIWithChatGPT = async (user, { question, username } = {}, requestHeaders = {}) => {
    if (!question) {
        throw new BadRequestError("Question is required");
    }

    const ownerAnswer = matchOwnerQuestion(question, user, username);
    if (ownerAnswer) {
        return ownerAnswer;
    }

    const { createOpenAIOAuth, openaiCredentials, generateText } = await loadOpenAIOAuthModules();

    let auth;
    try {
        auth = openaiCredentials(new Headers(requestHeaders));
    } catch (error) {
        throw new BadRequestError("ChatGPT sign-in required — connect your ChatGPT account first.");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
        const provider = createOpenAIOAuth(auth);
        const result = await generateText({
            model: provider('gpt-5.4-mini'),
            prompt: SYSTEM_PROMPT + question,
            abortSignal: controller.signal,
        });
        return { answer: result.text };
    } catch (error) {
        logger.error("ChatGPT OAuth AI Service Error:", { message: error.message });

        if (/timeout|abort/i.test(error.message || '')) {
            return { answer: "Your ChatGPT account is taking too long to respond right now. Please try again in a moment." };
        }

        return { answer: "I couldn't reach your ChatGPT account right now. Try reconnecting, or switch back to the default assistant." };
    } finally {
        clearTimeout(timeoutId);
    }
};
