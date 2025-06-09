import { useEffect } from 'react';
import { useConversation } from './hooks/useConversation';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { Header } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { questions } from './data/questions';

function App() {
    const {
        messages,
        isTyping,
        conversationComplete,
        handleSubmit,
        handleStartOver,
        currentQuestionIndex,
        showSafetyResetButton,
        // Destructure new summarization states and function
        videoSummary,
        isSummarizing,
        summaryError,
        generateConceptSummary,
        isConversationProcessingComplete,
    } = useConversation();

    // Initialize with AI welcome message
    useEffect(() => {
        handleStartOver();
    }, []);

    // Optionally, automatically generate summary when conversation completes and no safety reset is active
    useEffect(() => {
        if (conversationComplete && isConversationProcessingComplete && !videoSummary && !isSummarizing && !summaryError && !showSafetyResetButton) {
            // generateConceptSummary(); // Uncomment to auto-generate summary
        }
    }, [conversationComplete, isConversationProcessingComplete, videoSummary, isSummarizing, summaryError, showSafetyResetButton, generateConceptSummary]);


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 flex flex-col">
            <Header />
            
            {/* Main Content Area - with bottom padding for fixed input */}
            <div className="flex-1 max-w-4xl mx-auto w-full p-4" 
                 style={{
                    paddingBottom: (conversationComplete && !videoSummary && !showSafetyResetButton) ? '6rem' : // Space for generate summary button
                                   (conversationComplete && (videoSummary || showSafetyResetButton)) ? '1rem' : '5rem' // Normal padding otherwise
                 }}>
                {/* Main chat box - fixed height like original */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl flex flex-col overflow-hidden" 
                     style={{ height: 'calc(100vh - 12rem)' }}>
                    <ProgressBar 
                        currentStep={currentQuestionIndex + 1} 
                        totalSteps={questions.length} 
                    />
                    
                    {/* Message List Container - takes available space and is scrollable */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-4">
                            <MessageList 
                                messages={messages.map(msg => ({
                                    ...msg,
                                    role: msg.role === 'ai' ? 'assistant' : 'user'
                                }))} 
                                isTyping={isTyping} 
                            />
                        </div>
                    </div>
                    
                    {/* Conditional Buttons / Summary Display at the bottom of the chat box */}
                    {showSafetyResetButton ? (
                        <div className="p-4 border-t border-red-300 flex-shrink-0 bg-red-50">
                            <p className="text-center text-red-700 mb-2 text-sm">
                                Your previous input led to an automated safety block.
                            </p>
                            <button
                                onClick={handleStartOver}
                                className="w-full bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md font-medium"
                            >
                                Start New Conversation
                            </button>
                        </div>
                    ) : conversationComplete ? (
                        <div className="p-4 border-t border-indigo-200 flex-shrink-0 space-y-3">
                            {isConversationProcessingComplete && !videoSummary && !isSummarizing && !summaryError && (
                                <button
                                    onClick={generateConceptSummary}
                                    className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-2.5 rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-200 shadow-md font-medium"
                                >
                                    Generate Concept Summary
                                </button>
                            )}
                            {!isConversationProcessingComplete && !isSummarizing && !summaryError && (
                                <div className="text-center py-2.5 text-indigo-500 text-sm">
                                    Processing conversation, please wait...
                                </div>
                            )}
                            {isSummarizing && (
                                <div className="text-center py-2.5 text-indigo-700 font-medium">
                                    Generating summary...
                                    <div className="flex justify-center items-center space-x-1 mt-2">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0s]" />
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.1s]"/>
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"/>
                                    </div>
                                </div>
                            )}
                            {summaryError && !isSummarizing && (
                                <div className="text-center text-red-600 bg-red-50 p-3 rounded-md text-sm">
                                    <p className="font-semibold">Error generating summary:</p>
                                    <p>{summaryError}</p>
                                </div>
                            )}
                            {videoSummary && !isSummarizing && (
                                <div className="bg-indigo-50 p-3 rounded-lg shadow">
                                    <h3 className="text-lg font-semibold text-indigo-700 mb-2">Video Concept Summary:</h3>
                                    <p className="text-sm text-gray-700 truncate"><strong>Title:</strong> {videoSummary.videoTitleSuggestion}</p>
                                    <p className="text-sm text-gray-700 truncate"><strong>Concept:</strong> {videoSummary.coreConcept}</p>
                                    {/* You can add more details from the summary here or a link/modal to a full summary view */}
                                    <button
                                        onClick={() => alert(JSON.stringify(videoSummary, null, 2))} // Placeholder for better display
                                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                        View Full Summary Details
                                    </button>
                                </div>
                            )}
                             <button
                                 onClick={handleStartOver}
                                 className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md font-medium"
                             >
                                 Start New Conversation
                             </button>
                        </div>
                    ) : null}
                </div>
            </div>
            
            {/* Chat Input - Fixed at bottom of screen */}
            {/* Show input if conversation is not complete AND no safety reset button is active */}
            {!conversationComplete && !showSafetyResetButton && ( 
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 to-transparent">
                    <div className="max-w-4xl mx-auto w-full px-4">
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border-2 border-purple-700 p-2">
                            <ChatInput 
                                onSubmit={handleSubmit} 
                                isTyping={isTyping} 
                                showSafetyResetButton={showSafetyResetButton} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;