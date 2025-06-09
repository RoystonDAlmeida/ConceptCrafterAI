
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI;
if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} else {
    console.error("GEMINI_API_KEY is not set. The summarization API will not function.");
}

function formatConversationForLLM(messages) {
    return messages
        .map(msg => `${msg.role === 'ai' || msg.role === 'assistant' ? 'AI' : 'User'}: ${msg.content}`)
        .join('\n');
}

module.exports = async (req, res) => {
    if (!genAI) {
        return res.status(500).json({ error: "Generative AI SDK not initialized. Check API key." });
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty messages array provided.' });
    }

    const transcript = formatConversationForLLM(messages);

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
        generationConfig: {
            responseMimeType: "application/json", // Request JSON output
            temperature: 0.3, // Lower temperature for more factual summaries
        },
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ]
    });

    const prompt = `
        You are an expert video concept developer and script assistant.
        Your task is to analyze the following conversation between an AI assistant and a user, where they discussed ideas for a new video.
        Based on this conversation, generate a concise, hierarchical summary that will be used to create a video storyboard and production plan.

        The conversation transcript is as follows:
        --- BEGIN CONVERSATION ---
        ${transcript}
        --- END CONVERSATION ---

        Please extract and structure the information into the following JSON format.
        If a field cannot be determined from the conversation, use "Not specified" or an empty array [] as appropriate.

        {
        "videoTitleSuggestion": "A concise and catchy title suggestion based on the concept.",
        "coreConcept": "A brief (1-2 sentence) summary of the main idea or purpose of the video.",
        "targetAudience": {
            "description": "Who is the video for?",
            "keyTakeaways": [
            "What should this audience learn or feel?"
            ]
        },
        "keyMessages": [
            "List the primary messages the video should convey."
        ],
        "visualElements": {
            "style": "Describe the overall visual style (e.g., vibrant, minimalist, corporate, artistic).",
            "moodTone": "Describe the desired mood or tone (e.g., hopeful, urgent, informative, angry).",
            "imagerySuggestions": [
            "Suggest specific types of imagery, scenes, or visual metaphors based on the conversation (e.g., 'time-lapse of a seed growing', 'contrasting shots of deforested land and lush forests')."
            ],
            "colorPalette": "Suggest a color palette if mentioned or implied (e.g., 'nature-inspired greens and browns, with vibrant accents')."
        },
        "contentStructureOutline": [
            {
            "section": "Introduction",
            "description": "How the video might start, hook the audience."
            },
            {
            "section": "Problem_Context",
            "description": "Explain the core issue being addressed (e.g., deforestation)."
            },
            {
            "section": "KeyMessage1",
            "description": "Detail related to the first key message."
            },
            {
            "section": "KeyMessage2",
            "description": "Detail related to the second key message."
            },
            {
            "section": "CallToAction_Conclusion",
            "description": "What the audience should do or think next; how the video concludes."
            }
        ],
        "additionalNotes": "Any other relevant details, constraints, or creative ideas mentioned."
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const summaryJsonString = response.text();
        const summaryObject = JSON.parse(summaryJsonString); 

        return res.status(200).json(summaryObject);

    } catch (error) {
        console.error("Error generating summary with Gemini:", error);
        let errorMessage = "Failed to generate video concept summary.";
        if (error.message && error.message.includes("SAFETY")) {
             errorMessage = "Content blocked due to safety settings.";
        }
        return res.status(500).json({ error: errorMessage, details: error.message });
    }
};