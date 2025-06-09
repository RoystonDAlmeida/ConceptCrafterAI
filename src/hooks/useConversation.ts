/**
 * Custom hook for managing the conversation flow with the AI assistant.
 * Handles message history, concept data collection, and conversation state.
 */
import { useState } from 'react';
import { Message } from '../types';
import { questions, initialMessage } from '../data/questions';
import { generateId } from '../utils/idGenerator';
import { processConversation } from '../services/conversationProcessor';

export const useConversation = () => {
    // State management for conversation
    const [messages, setMessages] = useState<Message[]>([]); // All messages in the conversation
    const [conceptData, setConceptData] = useState<Record<string, string>>({}); // Stores concept details by category
    const [isTyping, setIsTyping] = useState(false); // Indicates if AI is currently generating a response
    const [conversationComplete, setConversationComplete] = useState(false); // Tracks if conversation is finished
    const [llmConversationHistory, setLlmConversationHistory] = useState<Message[]>([]); // History for AI context
    const [sessionId] = useState(() => generateId()); // Unique session identifier
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Tracks current question in sequence
    const [showSafetyResetButton, setShowSafetyResetButton] = useState(false); // Controls visibility of a reset button after a safety error

    // System instructions for the AI model
    const systemInstructionForLLM = `You are ConceptCrafterAI, a friendly and highly efficient assistant. Your goal is to help the user develop a video concept by asking a series of questions.
    Your first turn in the conversation, which is not included in the chat history provided to you, was to greet the user and ask the initial question: "${initialMessage.text} ${questions[0].text}".
    The user's first message in the chat history you receive is their direct reply to this opening question about the topic '${questions[0].category}'.
    
    Your first task is to process this initial user answer.
    Based on their answer to the question about '${questions[0].category}': if the response is very short (e.g., one or two words, or a single brief sentence that lacks detail), or if it seems incomplete or unclear, you MUST ask a specific, relevant follow-up question to elicit more information about THAT SAME TOPIC ('${questions[0].category}').
    Only after you receive a satisfactory, more detailed answer for '${questions[0].category}' (either to the main question or your follow-up), should you then smoothly transition to the next main topic ('${questions[1].category}') and ask its main question (e.g., "${questions.find(q => q.category === questions[1].category)?.text}").
    
    Then, continue guiding the user through the remaining topics one by one: ${questions.slice(1).map(q => q.category).join(', ')}. For each of these subsequent topics, ask the main question associated with it.
    CRITICALLY IMPORTANT FOR FOLLOW-UPS (for all topics): After the user answers a main question, evaluate their response. If the response is very short, or seems incomplete or unclear for the question asked, you MUST ask a specific, relevant follow-up question to elicit more information about THAT SAME TOPIC. Only after you receive a satisfactory, more detailed answer to the main question or your follow-up, should you then smoothly transition to the next main topic. Do not ask more than one or two follow-up questions for a single main topic before moving on.
    Example of a good follow-up: If for 'visualStyle' the user says "modern", you could ask "Could you elaborate on what 'modern' means to you in terms of visuals? Any specific elements like colors, typography, or imagery?".
    When all topics (${questions.map(q => q.category).join(', ')}) seem reasonably covered, or if the user indicates they have no more to add, provide a polite concluding message and then, on a new line, include the special marker: [CONVERSATION_COMPLETE]
    Do not use markdown formatting in your responses. Keep your responses concise and focused.`;

    /**
     * Creates a new message object with a unique ID and timestamp
     * @param content - The message content
     * @param role - Either 'user' or 'ai'
     * @returns Message object
     */
    const createMessage = (content: string, role: 'user' | 'ai'): Message => ({
        id: generateId(),
        content,
        role,
        timestamp: Date.now()
    });

    /**
     * Saves the conversation data to the backend and processes it
     * @param conversationMessages - Array of all messages in the conversation
     * @param finalConceptData - Collected concept data by category
     * @param currentSessionId - Current session identifier
     */
    const saveConversationToBackend = async (
        conversationMessages: Message[],
        finalConceptData: Record<string, string>,
        currentSessionId: string
    ) => {
        try {
            const response = await fetch('/api/save-conversation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: currentSessionId,
                    messages: conversationMessages,
                    conceptData: finalConceptData,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
                console.error('Failed to save conversation to backend:', response.status, errorData);
                return;
            }

            console.log('Conversation saved successfully to backend.');

            try {
                const conversationData = {
                    id: currentSessionId,
                    completedAt: new Date(),
                    conceptData: {
                        conceptDetails: finalConceptData['conceptDetails'] || '',
                        keyMessages: finalConceptData['keyMessages'] || '',
                        visualStyle: finalConceptData['visualStyle'] || ''
                    },
                    messages: conversationMessages,
                    sessionId: currentSessionId
                };

                const processedData = await processConversation(conversationData);
                console.log('Conversation processed successfully:', processedData);
            } catch (processingError) {
                console.error('Error processing conversation:', processingError);
            }
        } catch (error) {
            console.error('Error calling save-conversation endpoint:', error);
        }
    };

    /**
     * Gets a response from the AI model and updates conversation state
     * @param currentUserInput - The user's latest message
     * @param currentHistory - Current conversation history
     */
    const getAIResponse = async (currentUserInput: string | null, currentHistory: Message[]) => {
        setIsTyping(true);
        const historyForAPI = [...currentHistory];

        try {
            // Make API call to get AI response
            const response = await fetch('/api/gemini-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: historyForAPI, systemInstruction: systemInstructionForLLM }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API call failed: ${response.statusText}`);
            }

            const data = await response.json();
            let aiReplyContent = data.reply;

            // Update concept data based on user input
            let finalConceptDataForSaving = { ...conceptData };
            if (currentUserInput) {
                let categoryToUpdate: string | undefined = undefined;
                const lastMessageInHistoryForAPI = historyForAPI[historyForAPI.length - 1];

                // Determine which category to update based on conversation context
                if (lastMessageInHistoryForAPI && lastMessageInHistoryForAPI.role === 'user' && lastMessageInHistoryForAPI.content === currentUserInput) {
                    if (historyForAPI.length === 1) {
                        categoryToUpdate = questions[0].category;
                    } else if (historyForAPI.length > 1) {
                        const precedingAiMessage = historyForAPI[historyForAPI.length - 2];
                        if (precedingAiMessage && precedingAiMessage.role === 'ai') {
                            const matchedQuestion = questions.find(q =>
                                precedingAiMessage.content.toLowerCase().includes(q.text.toLowerCase().substring(0, 20)) || 
                                precedingAiMessage.content.toLowerCase().includes(q.category.toLowerCase().replace(/_/g, ' '))
                            );
                            if (matchedQuestion) {
                                categoryToUpdate = matchedQuestion.category;
                                setCurrentQuestionIndex(questions.findIndex(q => q.category === matchedQuestion.category));
                            }
                        }
                    }
                }

                // Update concept data for the identified category
                if (categoryToUpdate) {
                    const newEntry = finalConceptDataForSaving[categoryToUpdate] ? 
                        `${finalConceptDataForSaving[categoryToUpdate]}. ${currentUserInput}` : 
                        currentUserInput;
                    finalConceptDataForSaving = {
                        ...finalConceptDataForSaving,
                        [categoryToUpdate]: newEntry
                    };
                    setConceptData(finalConceptDataForSaving);
                }
            }

            // Check if conversation is complete
            let isConversationMarkedComplete = false;
            if (aiReplyContent.includes('[CONVERSATION_COMPLETE]')) {
                isConversationMarkedComplete = true;
                aiReplyContent = aiReplyContent.replace('[CONVERSATION_COMPLETE]', '').trim();
            }

            // Update messages and conversation state
            const aiMessage = createMessage(aiReplyContent, 'ai');
            setMessages(prevMessages => [...prevMessages, aiMessage]);
            setLlmConversationHistory(prevLlmHistory => [...prevLlmHistory, aiMessage]);

            // If conversation is complete, save to backend
            if (isConversationMarkedComplete) {
                setConversationComplete(true);
                const completeConversationToSave = [...currentHistory, aiMessage];
                saveConversationToBackend(completeConversationToSave, finalConceptDataForSaving, sessionId);
            }
        } catch (error) {
            console.error("Failed to get AI response:", error);
            let errorMessageContent = `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;

            const safetyErrorPattern = /response blocked due to safety settings/i; // Case-insensitive regex
            let shouldShowButton = false;

            if (error instanceof Error && typeof error.message === 'string') {
                if (safetyErrorPattern.test(error.message)) {
                    shouldShowButton = true;
                }
            }
            
            if (shouldShowButton) {
                setShowSafetyResetButton(true);
            }
            const errorMessage = createMessage(errorMessageContent, 'ai');
            setMessages(prevMessages => [...prevMessages, errorMessage]);
            setLlmConversationHistory(prevLlmHistory => [...prevLlmHistory, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    /**
     * Handles user message submission
     * @param userInput - The user's message
     */
    const handleSubmit = async (userInput: string) => {
        if (!userInput.trim() || isTyping) return;
        
        const userMessage = createMessage(userInput, 'user');
        setMessages(prevMessages => [...prevMessages, userMessage]);

        const updatedLlmHistory = [...llmConversationHistory, userMessage];
        setLlmConversationHistory(updatedLlmHistory);
        
        await getAIResponse(userInput, updatedLlmHistory);
    };

    /**
     * Resets the conversation to its initial state
     */
    const handleStartOver = () => {
        setMessages([]);
        setConceptData({});
        setIsTyping(false);
        setConversationComplete(false);
        setLlmConversationHistory([]);
        setCurrentQuestionIndex(0);
        setShowSafetyResetButton(false); // Reset the safety error flag

        const welcome = createMessage(`${initialMessage.text} ${questions[0].text}`, 'ai');
        setMessages([welcome]);
    };

    // Return public interface of the hook
    return {
        messages,
        conceptData,
        isTyping,
        conversationComplete,
        handleSubmit,
        handleStartOver,
        currentQuestionIndex,
        showSafetyResetButton
    };
}; 