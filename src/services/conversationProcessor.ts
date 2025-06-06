// src/services/conversationProcessor.ts

// Define interfaces for type safety
interface Message {
    content: string;
    role: string;
    timestamp: number;
    id: string;
}

interface ConceptData {
    conceptDetails: string;
    keyMessages: string;
    visualStyle: string;
}

interface Conversation {
    id: string;
    completedAt: any;
    conceptData: ConceptData;
    messages: Message[];
    sessionId: string;
}

interface ProcessedConversation {
    id: string;
    completedAt: any;
    sessionId: string;
    extractedData: {
        conceptDetails: string;
        keyMessages: string[];
        visualStyle: string;
        targetAudience: string[];
        moodTone: string[];
    };
    semanticTags: string[];
    processedMessages: Message[];
    confidenceScores: {
        conceptClarity: number;
        styleSpecificity: number;
        audienceClarity: number;
    };
}

export const processConversation = async (conversation: Conversation): Promise<ProcessedConversation> => {
    try {
        const response = await fetch('/api/conversation/process_conversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(conversation)
        });
        
        if (!response.ok) {
            throw new Error('Failed to process conversation');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error processing conversation:', error);
        throw error;
    }
};