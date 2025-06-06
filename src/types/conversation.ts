/**
 * Represents a single message in the conversation
 * @interface Message
 */
export interface Message {
    /** Unique identifier for the message */
    id: string;
    /** Role of the message sender - either user or AI assistant */
    role: 'user' | 'assistant';
    /** The actual content/text of the message */
    content: string;
    /** Unix timestamp of when the message was created */
    timestamp: number;
}

/**
 * Represents the structured data collected during the concept development conversation
 * @interface ConceptData
 */
export interface ConceptData {
    /** Detailed description of the video concept */
    conceptDetails: string;
    /** Array of key messages or points to be conveyed in the video */
    keyMessages: string[];
    /** Description of the visual style and aesthetic for the video */
    visualStyle: string;
}

/**
 * Represents a complete conversation session
 * @interface Conversation
 */
export interface Conversation {
    /** Array of all messages exchanged during the conversation */
    messages: Message[];
    /** Structured data collected about the video concept */
    conceptData: ConceptData;
}

/**
 * Represents a processed conversation with additional analysis and metadata
 * @interface ProcessedConversation
 */
export interface ProcessedConversation {
    /** Unix timestamp when the conversation was completed */
    completedAt: number;
    /** Structured data collected about the video concept */
    conceptData: ConceptData;
    /** Array of key messages extracted from the conversation */
    keyMessages: string[];
    /** Final visual style description */
    visualStyle: string;
    /** Array of all messages exchanged during the conversation */
    messages: Message[];
    /** Unique identifier for the conversation session */
    sessionId: string;
    /** Confidence scores for different aspects of the concept */
    confidenceScores: {
        /** How clear the target audience is defined */
        audienceClarity: number;
        /** How well-defined the concept is */
        conceptClarity: number;
        /** How specific the visual style description is */
        styleSpecificity: number;
    };
    /** Array of semantic tags extracted from the conversation */
    semanticTags: string[];
} 