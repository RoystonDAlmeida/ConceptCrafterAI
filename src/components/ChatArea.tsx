import React from 'react';
import { ProgressBar } from './ProgressBar';
import { MessageList } from './MessageList';
import { Message } from '../types';
import { questions } from '../data/questions';

interface ChatAreaProps {
    messages: Message[];
    isTyping: boolean;
    currentQuestionIndex: number;
    chatContainerHeight?: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
    messages,
    isTyping,
    currentQuestionIndex,
    chatContainerHeight = 'calc(100vh - 12rem)',
}) => {
    return (
        <div
            className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl flex flex-col overflow-hidden"
            style={{ height: chatContainerHeight }}
        >
            <div className="flex flex-col h-full">
                <ProgressBar
                    currentStep={currentQuestionIndex + 1}
                    totalSteps={questions.length}
                />
                <div className="flex-1 overflow-y-auto p-4"> {/* Added padding here for MessageList content */}
                    <MessageList messages={messages} isTyping={isTyping} />
                </div>
            </div>
        </div>
    );
};