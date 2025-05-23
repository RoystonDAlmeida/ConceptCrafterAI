import React, { useState, useRef, useEffect } from 'react';
import { Message } from './types';
import { questions, initialMessage } from './data/questions';
import { ChatMessage } from './components/ChatMessage';
import { ProgressBar } from './components/ProgressBar';
import { ConceptSummary } from './components/ConceptSummary';
import { Brain, Send } from 'lucide-react';
import {
  generateId
} from './utils/idGenerator';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conceptData, setConceptData] = useState<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [userInput, setUserInput] = useState('');
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Store conversation history for LLM context. Matches your Message type.
  const [llmConversationHistory, setLlmConversationHistory] = useState<Message[]>([]);

  // System prompt for Gemini - this is crucial for guiding its behavior, including follow-ups.
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

  useEffect(() => {
    if (messages.length === 0) {
      const welcome: Message = {
        id: generateId(),
        content: `${initialMessage.text} ${questions[0].text}`, // Combine greeting with the first actual question
        role: 'ai',
        timestamp: Date.now()
      };

      setMessages([welcome]);

      // LLM conversation history starts empty. The 'welcome' message is for display only
      // and its content is described to the LLM in the system prompt.
      setLlmConversationHistory([]); 
    }
  }, []);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const getAIResponse = async (
    currentUserInput: string | null, // Can be null for the initial call
    currentHistory: Message[]
  ) => {
    setIsTyping(true);

    // The history sent to the API should be what the LLM needs to understand the conversation context.
    // If currentUserInput is present, it means it was just added to llmConversationHistory by handleSubmit.
    const historyForAPI = [...currentHistory];

    try {
      // Invoking the vercel serverless function
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

      if (aiReplyContent.includes('[CONVERSATION_COMPLETE]')) {
        setConversationComplete(true);
        aiReplyContent = aiReplyContent.replace('[CONVERSATION_COMPLETE]', '').trim();
      }

      // AI message object generated after obtaining response from backend endpoint
      const aiMessage: Message = {
        id: generateId(),
        content: aiReplyContent,
        role: 'ai',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setLlmConversationHistory(prev => [...prev, aiMessage]);

      // ConceptData update logic
      if (currentUserInput) { // currentUserInput is the text of the user message that the AI just processed
        // historyForAPI is the history *up to and including* the currentUserInput message
        // Example 1 (first turn): historyForAPI = [{role: 'user', content: 'User Q1 Answer'}]
        // Example 2 (second turn): historyForAPI = [{role: 'user', ...}, {role: 'ai', ...}, {role: 'user', content: 'User Q2 Answer'}]
        
        let categoryToUpdate: string | undefined = undefined;
        const lastMessageInHistoryForAPI = historyForAPI[historyForAPI.length - 1];

        // Ensure the currentUserInput matches the last message in historyForAPI and it's a user message
        if (lastMessageInHistoryForAPI && lastMessageInHistoryForAPI.role === 'user' && lastMessageInHistoryForAPI.content === currentUserInput) {
          if (historyForAPI.length === 1) {
            // This is the very first user message, responding to the implicit first question
            categoryToUpdate = questions[0].category;
          } else if (historyForAPI.length > 1) {
            // Find the AI message immediately preceding this user input
            const precedingAiMessage = historyForAPI[historyForAPI.length - 2];
            if (precedingAiMessage && precedingAiMessage.role === 'ai') {
              const matchedQuestion = questions.find(q =>
                precedingAiMessage.content.toLowerCase().includes(q.text.toLowerCase().substring(0, 20)) || // Check against question text
                precedingAiMessage.content.toLowerCase().includes(q.category.toLowerCase().replace(/_/g, ' ')) // Check against category name
              );
              if (matchedQuestion) {
                categoryToUpdate = matchedQuestion.category;
              }
            }
          }
        }

        if (categoryToUpdate) {
          setConceptData(prev => ({
              ...prev,
              [categoryToUpdate!]: prev[categoryToUpdate!] ? `${prev[categoryToUpdate!]}. ${currentUserInput}` : currentUserInput
          }));
        }
      } 
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage: Message = {
        id: generateId(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        role: 'ai',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setLlmConversationHistory(prev => [...prev, errorMessage]); // Also add error to history if needed
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isTyping) return;
    
    // Usermessage object corresponding to the userInput
    const userMessage: Message = {
      id: generateId(),
      content: userInput,
      role: 'user',
      timestamp: Date.now()
    };

    // Update messages and history immediately for UI responsiveness
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    const updatedLlmHistory = [...llmConversationHistory, userMessage];
    setLlmConversationHistory(updatedLlmHistory);
    
    const currentUserInputText = userInput;
    setUserInput('');
    
    // Get AI response using the updated history
    getAIResponse(currentUserInputText, updatedLlmHistory);
  };
  
  const handleStartOver = () => {
    setMessages([]);
    setConceptData({});

    setIsTyping(false);
    setConversationComplete(false);

    setUserInput('');

    setLlmConversationHistory([]); // Clear LLM history

    // Re-initialize with welcome and trigger first AI message
    const combinedInitialText = `${initialMessage.text} ${questions[0].text}`;
    const welcome: Message = { 
      id: generateId(), 
      content: combinedInitialText, 
      role: 'ai', 
      timestamp: Date.now() 
    };
    setMessages([welcome]);

    // LLM conversation history starts empty on reset as well.
    setLlmConversationHistory([]);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">ConceptCrafterAI</h1>
          </div>
          <p className="text-gray-600">
            Let's develop your video concept through a structured conversation
          </p>
        </div>
        
        <ProgressBar
          // current={currentQuestionIndex}
          // total={questions.length}
          // Progress can be estimated by number of categories in conceptData
          current={Object.keys(conceptData).length}
          total={questions.length} // Total number of defined categories
        />
        
        <div
          ref={chatContainerRef}
          className="bg-white rounded-lg shadow-lg p-6 mt-6 h-[500px] overflow-y-auto"
        >
          {messages.map(message => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {isTyping && (
            <div className="flex gap-2 p-4">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
          )}
        </div>
        
        {!conversationComplete && (
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!userInput.trim() || isTyping}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}
        
        {conversationComplete && (
          <ConceptSummary
            conceptData={conceptData}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  );
}

export default App;