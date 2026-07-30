require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function testModel(modelName) {
    try {
        console.log(`Testing ${modelName}...`);
        const res = await ai.models.generateContent({
            model: modelName,
            contents: 'hello'
        });
        console.log(`Success: ${modelName} -> ${res.text.substring(0, 20).replace(/\n/g, ' ')}`);
        return true;
    } catch(e) {
        console.error(`Failed ${modelName}:`, e.message);
        return false;
    }
}

async function run() {
    await testModel('gemini-1.5-pro');
    await testModel('gemini-1.5-flash');
    await testModel('gemini-1.5-flash-8b');
    await testModel('gemini-2.0-flash');
    await testModel('gemini-2.5-flash');
    await testModel('gemini-2.5-pro');
}
run();
