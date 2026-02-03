const https = require('https');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Error: GEMINI_API_KEY not found in .env");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error(`Error: API returned status code ${res.statusCode}`);
            console.error(data);
            return;
        }

        try {
            const json = JSON.parse(data);
            console.log("--- Available Gemini Models ---");
            if (json.models) {
                json.models.forEach(model => {
                    if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
                        // Only show models that support generateContent
                        console.log(`- ${model.name.replace('models/', '')} (${model.displayName})`);
                    }
                });
            } else {
                console.log("No models found in response.");
            }
            console.log("-------------------------------");
        } catch (e) {
            console.error("Error parsing JSON:", e);
        }
    });

}).on('error', (err) => {
    console.error("Error fetching models:", err);
});
