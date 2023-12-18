const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config()
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const app = express();
// Environment variables
const apiKey = process.env.API_KEY;

const port = process.env.PORT || 8000;

app.use(express.json())
// CORS 
app.use(cors({
    origin: '*'
}));

// Compress responses
app.use(compression());



async function run(context = "google makersuite", type = "poem") {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const poem_prompt = [
        { text: `Based on a given user input, generate a 80 word sonnet on the scenario a user provides. \nThe response should be funny, a tiny bit offensive and should contain some technical jargons , also should be written in classical english or any language and context the user provides and the tone should be mostly semi formal. If no context is provided, just generate a random sonnet about google's makersuite in english. Make sure that every line break is explicitly mentioned with a \n. Input: ${context}` }
    ];
    const joke_prompt = [
        { text: `Based on a given user input, generate a joke on the scenario a user provides. \nThe response should be funny, a tiny bit offensive and should contain some technical jargons , also should be written in classical english or any language and context the user provides and the tone should be mostly semi formal. If no context is provided, just generate a random joke about google's makersuite in english. Input: ${context}` }
    ];
    const generationConfig = {
        temperature: 1,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
    };

    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
    ];


    const parts = type == "poem" ? poem_prompt : joke_prompt
    console.log(parts)
    const result = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig,
        safetySettings,
    });

    const response = result.response;
    return response
}


// Validate headers
app.use((req, res, next) => {
    if (req.headers['private-token']) {
        return res.status(403).send('Private token not allowed');
    }
    next()
});

// Security headers  
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'deny');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});


app.use('/poem', async (req, res) => {
    let response = (await run(req.body.input, "poem")).text()
    if (!response || response.trim() == "")
        res.status(500).send("Oops! This is too complex for me!")
    res.status(200).send(response);
});
app.use('/joke', async (req, res) => {
    let response = (await run(req.body.input, "joke")).text()
    if (!response || response.trim() == "")
        res.status(500).send("Oops! This is too complex for me!")
    res.status(200).send(response);
});
// Error handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

// Start server
app.listen(port, () => {
    console.log(`Proxy server running on port ${port}`);
});