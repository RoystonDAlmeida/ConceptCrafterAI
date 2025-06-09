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
        showSafetyResetButton // Destructure the new state
    } = useConversation();

    // Initialize with welcome message
    useEffect(() => {
        handleStartOver();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intentionally empty to run only on mount, handleStartOver is stable


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 flex flex-col">
            <Header />
            
            {/* Main Content Area - with bottom padding for fixed input */}
            <div className="flex-1 max-w-4xl mx-auto w-full p-4" 
                 style={{ paddingBottom: conversationComplete ? '1rem' : '5rem' }}>
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
                    
                    {/* Conditional Buttons at the bottom of the chat box */}
                    {showSafetyResetButton ? (
                        <div className="p-4 border-t border-red-300 flex-shrink-0 bg-red-50">
                            <p className="text-center text-red-700 mb-2 text-sm">
                                Your previous input led to an automated safety block.
                            </p>
                            <button
                                onClick={handleStartOver}
                                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md"
                            >
                                Start New Conversation
                            </button>
                        </div>
                    ) : conversationComplete ? (
                        <div className="p-4 border-t border-purple-700 flex-shrink-0">
                            <button
                                onClick={handleStartOver}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md"
                            >
                                Start New Conversation
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
            
            {/* Chat Input - Fixed at bottom of screen */}
            {/* Show input if conversation is not complete AND no safety reset button is active */}
            {/* Or, always show it and let ChatInput handle its disabled state */}
            {!conversationComplete && ( 
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