const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// PERFORMANCE: Fail fast if no key
if (!process.env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");

// PERFORMANCE: Initialize SDK and load context ONCE at module level (not per request)
const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: "gemini-flash-latest" });
const HELP_CONTEXT = fs.readFileSync(path.join(__dirname, '../../HELP_CENTER.md'), 'utf8');

// PERFORMANCE: Pre-allocate static parts of the prompt to minimize allocation
const SYSTEM_PROMPT = `You're ZenovaX support. Context:\n${HELP_CONTEXT}\n\nAnswer ONLY using context. If unrelated, say "I can’t help with this. Please contact WhatsApp support."\n\nQuestion: `;

exports.askAI = async (req, res) => {
  try {
    if (!req.body.question) return res.status(400).end();

    // EASTER EGG: Owner Attribution (Deterministic, Zero-Cost)
    const q = req.body.question?.toLowerCase().trim();

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
      const name = req.user?.username || req.body.username || 'You';

      const responses = [
        `ZenovaX was built by you, ${name}. Without you, this platform wouldn’t exist.`,
        `${name}, you’re the reason ZenovaX exists. No you, no platform.`,
        `This platform? Yours, ${name}. ZenovaX exists because you made it happen.`,
        `I am Zen, your AI assistant. And you are ${name}, the creator of ZenovaX.`
      ];

      return res.json({
        answer: responses[Math.floor(Math.random() * responses.length)]
      });
    }

    // PERFORMANCE: Direct call, minimal awaits
    const result = await model.generateContent(SYSTEM_PROMPT + req.body.question);
    res.json({ answer: result.response.text() });
  } catch (error) {
    // PERFORMANCE: Minimal error handling logic
    // 429 = Quota limit (System overloaded)
    console.error("AI Service Error:", error.message);

    if (error.status === 429 || error.message.includes("429")) {
      return res.json({ answer: "API Quota Exceeded (429). Your Google Project has no quota left. Please create a NEW Project." });
    }

    // Pass the actual error to the user so they can debug (e.g. 404 Model Not Found)
    res.json({ answer: "I'm having trouble connecting to the AI service right now. Please try again later." });
  }
};
