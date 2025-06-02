// api/conversation/process_conversation.js - Serverless function to process completed conversation

const express = require('express');
const admin = require('firebase-admin');
const natural = require('natural');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
    });
}

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

// Process and clean messages
async function processMessages(messages) {
    return messages.filter(message => {
        const content = message.content.trim().toLowerCase();
        if (content.length < 3 || 
            content === 'no' || 
            content === 'yes' || 
            content === 'ok' || 
            content === 'okay') {
            return false;
        }
        return true;
    });
}

// Extract semantic information from messages
async function extractSemanticInfo(messages) {
    const tags = [];
    const keyMessages = [];
    const targetAudience = [];
    const moodTone = [];

    const patterns = {
        visualStyle: ['minimalist', 'vibrant', 'color', 'style', 'visual', 'design'],
        targetAudience: ['audience', 'target', 'viewer', 'people', 'user'],
        moodTone: ['calm', 'inspired', 'emotional', 'mood', 'tone', 'feeling'],
        keyMessage: ['message', 'point', 'takeaway', 'key', 'important']
    };

    messages.forEach(message => {
        const content = message.content.toLowerCase();
        
        if (patterns.visualStyle.some(pattern => content.includes(pattern))) {
            tags.push('visual_style');
        }

        if (patterns.targetAudience.some(pattern => content.includes(pattern))) {
            tags.push('target_audience');
            if (message.role === 'user') {
                targetAudience.push(message.content);
            }
        }

        if (patterns.moodTone.some(pattern => content.includes(pattern))) {
            tags.push('mood_tone');
            if (message.role === 'user') {
                moodTone.push(message.content);
            }
        }

        if (patterns.keyMessage.some(pattern => content.includes(pattern))) {
            tags.push('key_message');
            if (message.role === 'user') {
                keyMessages.push(message.content);
            }
        }
    });

    return {
        tags: [...new Set(tags)],
        keyMessages: [...new Set(keyMessages)],
        targetAudience: [...new Set(targetAudience)],
        moodTone: [...new Set(moodTone)]
    };
}

// Calculate confidence scores
function calculateConfidenceScores(processedData) {
    return {
        conceptClarity: calculateConceptClarity(processedData),
        styleSpecificity: calculateStyleSpecificity(processedData),
        audienceClarity: calculateAudienceClarity(processedData)
    };
}

// Helper functions for confidence calculations
function calculateConceptClarity(processedData) {
    const conceptLength = processedData.extractedData.conceptDetails.length;
    const keyMessagesCount = processedData.extractedData.keyMessages.length;
    return Math.min(1, (conceptLength / 50 + keyMessagesCount / 3) / 2);
}

function calculateStyleSpecificity(processedData) {
    const styleLength = processedData.extractedData.visualStyle.length;
    const styleTags = processedData.semanticTags.filter(tag => tag.includes('visual_style')).length;
    return Math.min(1, (styleLength / 20 + styleTags / 2) / 2);
}

function calculateAudienceClarity(processedData) {
    const audienceCount = processedData.extractedData.targetAudience.length;
    const audienceTags = processedData.semanticTags.filter(tag => tag.includes('target_audience')).length;
    return Math.min(1, (audienceCount / 2 + audienceTags / 2) / 2);
}

// Process individual conversation
async function processConversation(conversation) {
    const processedData = {
        id: conversation.id,
        completedAt: conversation.completedAt,
        sessionId: conversation.sessionId,
        extractedData: {
            conceptDetails: conversation.conceptData.conceptDetails,
            keyMessages: [],
            visualStyle: conversation.conceptData.visualStyle,
            targetAudience: [],
            moodTone: []
        },
        semanticTags: [],
        processedMessages: [],
        confidenceScores: {
            conceptClarity: 0,
            styleSpecificity: 0,
            audienceClarity: 0
        }
    };

    const processedMessages = await processMessages(conversation.messages);
    processedData.processedMessages = processedMessages;

    const semanticInfo = await extractSemanticInfo(processedMessages);
    processedData.semanticTags = semanticInfo.tags;
    processedData.extractedData.keyMessages = semanticInfo.keyMessages;
    processedData.extractedData.targetAudience = semanticInfo.targetAudience;
    processedData.extractedData.moodTone = semanticInfo.moodTone;

    processedData.confidenceScores = calculateConfidenceScores(processedData);

    return processedData;
}

// Express app setup
const app = express();
app.use(express.json());

// API endpoint
app.post('/api/conversation/process_conversation', async (req, res) => {
    try {
        const conversation = req.body;
        const processedData = await processConversation(conversation);
        
        // Store processed data in Firestore
        await admin.firestore()
            .collection('processed_conversations')
            .doc(conversation.id)
            .set(processedData);

        res.json(processedData);
    } catch (error) {
        console.error('Error processing conversation:', error);
        res.status(500).json({ error: 'Error processing conversation' });
    }
});

// Export the Express app
module.exports = app;
