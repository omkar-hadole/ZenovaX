const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
// Ideally this should be in a config, but for now accessing process.env directly
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log("--------------------------------------------------");
console.log("DEBUG: Initializing Gemini Model: gemini-2.5-flash");
console.log("--------------------------------------------------");

// User requested 2.5 flash and it IS supported by their key.
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

let helpContext = "";

// Function to load the Help Center content
const loadHelpContext = () => {
    try {
        // Correctly resolve the path to HELP_CENTER.md in the project root
        // backend is in /backend, so specific file is ../HELP_CENTER.md
        const filePath = path.join(__dirname, '../../HELP_CENTER.md');
        helpContext = fs.readFileSync(filePath, 'utf8');
        console.log("HELP_CENTER.md loaded successfully.");
    } catch (error) {
        console.error("Error loading HELP_CENTER.md:", error);
        helpContext = "Error: Knowledge base could not be loaded.";
    }
};

// Load context on startup
loadHelpContext();

const askAI = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ error: "Question is required" });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "AI Service not configured (Missing API Key)" });
        }

        // Strict System Prompt
        const systemPrompt = `
You are a helpful support assistant for ZenovaX.
Your knowledge base is STRICTLY limited to the following "Context".
You MUST answer questions based ONLY on this Context.
If the answer is not in the Context, or if the user asks about restricted topics (payments, refunds, specific account issues, technical bugs), you MUST reply with exactly:
"I can’t help with this. Please contact WhatsApp support."

Do not provide any external information.
Do not hallucinate.
Do not act as a general AI.

Context:
${helpContext}
`;

        const fullPrompt = `${systemPrompt}\n\nUser Question: ${question}`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        res.json({ answer: text });

    } catch (error) {
        console.error("Error asking AI:", error);

        // Check for quota exceeded or overloaded errors
        // Broadened check to include message content
        if (error.status === 429 || error.status === 503 || error.message?.includes('429') || error.message?.includes('Quota exceeded')) {
            return res.json({ answer: "I'm currently overloaded with requests. Please try again later or contact WhatsApp support for immediate help." });
        }

        // Handle 404 (Model not found) gracefully-ish
        if (error.status === 404 || error.message?.includes('404')) {
            return res.status(500).json({ error: `AI Model 'gemini-2.5-flash' not found. Available models change; please check config.` });
        }

        res.status(500).json({ error: "Failed to get answer from AI" });
    }
};

module.exports = {
    askAI
};
