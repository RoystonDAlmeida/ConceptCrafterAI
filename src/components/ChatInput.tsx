import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
    onSubmit: (message: string) => void;
    isTyping: boolean;
    showSafetyResetButton?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, isTyping, showSafetyResetButton }) => {
    const [message, setMessage] = useState('');
    const isDisabled = isTyping || showSafetyResetButton;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !isDisabled) {
            onSubmit(message);
            setMessage('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            {/* Custom styles to remove focus outline and style placeholder */}
            <style>{`
                .chat-input-field::placeholder {
                    font-weight: bold;
                }
                .chat-input-field:focus {
                    outline: none !important;
                    box-shadow: none !important;
                    border-color: transparent !important;
                }
            `}</style>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isDisabled}
                className="chat-input-field flex-1 bg-transparent border-none focus:outline-none focus:ring-0 focus:border-transparent focus:shadow-none text-gray-700 placeholder-gray-400 transition-all duration-200"
            />
            <button
                type="submit"
                disabled={!message.trim() || isDisabled}
                className={`p-2 rounded-lg transition-all duration-200
                    ${!message.trim() || isDisabled
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:scale-105'
                    }`}
            >
                <Send className="w-5 h-5" />
            </button>
        </form>
    );
}; 