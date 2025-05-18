const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-1.5-flash-latest';

// Helper function to transform app's message format to gemini's message format
function transformMessagesForGemini(appMessages) {
    return appMessages
        .filter(msg => msg.role === 'user' || msg.role === 'ai')
        .map(msg => ({
            role: msg.role === 'ai'? 'model': 'user',
            parts: [{ text: msg.content }],
        }))
}

app.post('/api/gemini-chat', async (req, res) => { 
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY environment variable is not set.");
    return res.status(500).json({ error: 'Server configuration error: API key not available.' });
  }

  const { messages: clientMessages, systemInstruction } = req.body;

  if (!clientMessages || !Array.isArray(clientMessages)) {
    return res.status(400).json({ error: 'Invalid payload: "messages" array is required.' });
  }
  if (!systemInstruction || typeof systemInstruction !== 'string') {
    return res.status(400).json({ error: 'Invalid payload: "systemInstruction" string is required.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: systemInstruction,
    });

    const geminiFormattedMessages = transformMessagesForGemini(clientMessages);

    let historyForChatSDK = [];
    let messageToSendToSDK = "";

    if (geminiFormattedMessages.length === 0) {
        // Handles the very first call to get the AI's initial question.
        messageToSendToSDK = "Based on your instructions, please provide your first question or statement to the user.";
    } else {
        const lastFormattedMessage = geminiFormattedMessages[geminiFormattedMessages.length - 1];
        historyForChatSDK = geminiFormattedMessages.slice(0, -1); // History is all but the last message
        messageToSendToSDK = lastFormattedMessage.parts[0].text; // Last message is the one to send
    }

    const chat = model.startChat({
      history: historyForChatSDK,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    const result = await chat.sendMessage(messageToSendToSDK);
    const response = result.response;

    if (!response) {
        console.warn('Gemini API returned no response object. Check for potential blocking.');
        return res.status(500).json({ error: 'AI model did not return a response. It might have been blocked.' });
    }

    const llmReply = response.text();
    res.status(200).json({ reply: llmReply });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    let errorMessage = 'Failed to get response from LLM. Please try again later.';
    if (error.message && error.message.toLowerCase().includes('safety')) {
        errorMessage = 'Response blocked due to safety settings. Please rephrase your input.';
    } else if (error.message && error.message.toLowerCase().includes('api key not valid')) {
        errorMessage = 'Invalid API Key. Please check server configuration.';
    }
    res.status(500).json({ error: errorMessage });
  }
});

// Export the app for Vercel.
// For local direct execution (node api/gemini-chat.cjs), we'll add a listen call.
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV) {
    const PORT = process.env.PORT || 3001; // Vercel sets PORT, so this is for direct node run
    app.listen(PORT, () => {
        console.log(`[Local Dev] Gemini chat backend listening on port ${PORT}. Ensure frontend calls this port if not using 'vercel dev'.`);
    });
}

module.exports = app;