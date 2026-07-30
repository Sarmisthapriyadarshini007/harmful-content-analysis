require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function run() {
    const models = await ai.models.list();
    for await (const m of models) {
        if (!m.name.includes('flash') && !m.name.includes('pro')) continue;
        const modelName = m.name.replace('models/', '');
        try {
            console.log(`Testing ${modelName}...`);
            const res = await ai.models.generateContent({
                model: modelName,
                contents: 'hello'
            });
            console.log(`SUCCESS! ${modelName} works.`);
        } catch(e) {
            console.log(`FAILED ${modelName}: ${e.message.substring(0, 100)}`);
        }
    }
}
run();
