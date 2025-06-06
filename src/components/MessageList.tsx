import React, { useEffect, useRef } from 'react';
import { Message } from '../types/conversation';
import { User, Bot } from 'lucide-react';

interface MessageListProps {
    messages: Message[];
    isTyping: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isTyping }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4">
                {messages.map((message, index) => (
                    <div
                        key={message.id}
                        className={`flex items-start gap-3 animate-fade-in ${
                            message.role === 'user' ? 'justify-end' : ''
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {message.role === 'assistant' && (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] rounded-2xl p-4 shadow-md transform transition-all duration-200 hover:scale-[1.02] ${
                                message.role === 'user'
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                    : 'bg-white border border-gray-100'
                            }`}
                        >
                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        </div>
                        {message.role === 'user' && (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                                <User className="w-6 h-6 text-white" />
                            </div>
                        )}
                    </div>
                ))}
                {isTyping && (
                    <div className="flex items-start gap-3 animate-fade-in">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                            <div className="flex gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}; 