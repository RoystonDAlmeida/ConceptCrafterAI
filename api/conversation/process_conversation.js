// api/conversation/process_conversation.js - Serverless function to process completed conversation

const express = require('express');
const admin = require('firebase-admin');

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

// Configuration for pattern matching and scoring
const CONFIG = {
    patterns: {
        visualStyle: ['minimalist', 'vibrant', 'color', 'style', 'visual', 'design'],
        targetAudience: ['audience', 'target', 'viewer', 'people', 'user'],
        moodTone: ['calm', 'inspired', 'emotional', 'mood', 'tone', 'feeling'],
        keyMessage: ['message', 'point', 'takeaway', 'key', 'important']
    },
    scoring: {
        conceptClarity: {
            lengthDivisor: 50,
            countDivisor: 3,
            weight: 0.5
        },
        styleSpecificity: {
            lengthDivisor: 20,
            countDivisor: 2,
            weight: 0.5
        },
        audienceClarity: {
            lengthDivisor: 2,
            countDivisor: 2,
            weight: 0.5
        }
    }
};

// Process and clean messages
async function processMessages(messages) {
    return messages.filter(message => {
        const content = message.content.trim().toLowerCase();
        return content.length >= 3 && 
               !['no', 'yes', 'ok', 'okay'].includes(content);
    });
}

// Extract semantic information from messages
async function extractSemanticInfo(messages) {
    const extractedData = {
        tags: [],
        keyMessages: [],
        targetAudience: [],
        moodTone: []
    };

    messages.forEach(message => {
        const content = message.content.toLowerCase();
        
        // Check each pattern category
        Object.entries(CONFIG.patterns).forEach(([category, patterns]) => {
            if (patterns.some(pattern => content.includes(pattern))) {
                const tagName = category.replace(/([A-Z])/g, '_$1').toLowerCase();
                extractedData.tags.push(tagName);
                
                if (message.role === 'user') {
                    const targetArray = category === 'keyMessage' ? 'keyMessages' : 
                                      category === 'moodTone' ? 'moodTone' :
                                      category === 'targetAudience' ? 'targetAudience' : null;
                    if (targetArray) {
                        extractedData[targetArray].push(message.content);
                    }
                }
            }
        });
    });

    // Remove duplicates
    Object.keys(extractedData).forEach(key => {
        if (Array.isArray(extractedData[key])) {
            extractedData[key] = [...new Set(extractedData[key])];
        }
    });

    return extractedData;
}

// Generic confidence score calculator
function calculateConfidenceScore(processedData, category) {
    const config = CONFIG.scoring[category];
    const data = processedData.extractedData;
    
    let lengthScore = 0;
    let countScore = 0;

    switch(category) {
        case 'conceptClarity':
            lengthScore = data.conceptDetails.length / config.lengthDivisor;
            countScore = data.keyMessages.length / config.countDivisor;
            break;
        case 'styleSpecificity':
            lengthScore = data.visualStyle.length / config.lengthDivisor;
            countScore = processedData.semanticTags.filter(tag => tag.includes('visual_style')).length / config.countDivisor;
            break;
        case 'audienceClarity':
            lengthScore = data.targetAudience.length / config.lengthDivisor;
            countScore = processedData.semanticTags.filter(tag => tag.includes('target_audience')).length / config.countDivisor;
            break;
    }

    return Math.min(1, (lengthScore + countScore) * config.weight);
}

// Calculate all confidence scores
function calculateConfidenceScores(processedData) {
    return {
        conceptClarity: calculateConfidenceScore(processedData, 'conceptClarity'),
        styleSpecificity: calculateConfidenceScore(processedData, 'styleSpecificity'),
        audienceClarity: calculateConfidenceScore(processedData, 'audienceClarity')
    };
}

// Process individual conversation
async function processConversation(conversation) {
    // Extract target audience and mood tone from messages
    const targetAudience = [];
    const moodTone = [];
    
    conversation.messages.forEach((message, index) => {
        if (message.role === 'ai' && index < conversation.messages.length - 1) {
            const aiContent = message.content.toLowerCase();
            const nextMessage = conversation.messages[index + 1];
            
            if (aiContent.includes('target audience') || aiContent.includes('who is your audience')) {
                targetAudience.push(nextMessage.content);
            } else if (aiContent.includes('mood') || aiContent.includes('tone') || aiContent.includes('feeling')) {
                moodTone.push(nextMessage.content);
            }
        }
    });

    const processedData = {
        id: conversation.id,
        completedAt: conversation.completedAt,
        sessionId: conversation.sessionId,
        extractedData: {
            conceptDetails: conversation.conceptData.conceptDetails || '',
            keyMessages: conversation.conceptData.keyMessages ? [conversation.conceptData.keyMessages] : [],
            visualStyle: conversation.conceptData.visualStyle || '',
            targetAudience: targetAudience,
            moodTone: moodTone
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
    
    // Only add semantic info if we don't have original data
    if (!processedData.extractedData.keyMessages.length) {
        processedData.extractedData.keyMessages = semanticInfo.keyMessages;
    }
    if (!processedData.extractedData.targetAudience.length) {
        processedData.extractedData.targetAudience = semanticInfo.targetAudience;
    }
    if (!processedData.extractedData.moodTone.length) {
        processedData.extractedData.moodTone = semanticInfo.moodTone;
    }

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
