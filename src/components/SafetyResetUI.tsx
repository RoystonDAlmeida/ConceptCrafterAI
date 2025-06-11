import React from 'react';

interface SafetyResetUIProps {
    onStartNewConversation: () => void;
}

export const SafetyResetUI: React.FC<SafetyResetUIProps> = ({ onStartNewConversation }) => {
    return (
        <div className="p-4 border-t border-red-300 bg-red-50 rounded-lg shadow-md">
            <p className="text-center text-red-700 mb-2 text-sm">
                Your previous input led to an automated safety block.
            </p>
            <button
                onClick={onStartNewConversation}
                className="w-full bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md font-medium"
            >
                Start New Conversation
            </button>
        </div>
    );
};