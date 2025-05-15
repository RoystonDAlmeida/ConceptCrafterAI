import React from 'react';
import { Message } from '../types';
import { cn } from '../utils/cn';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAI = message.role === 'ai';
  
  return (
    <div
      className={cn(
        'p-4 rounded-lg mb-4 max-w-[80%]',
        isAI ? 'bg-gray-100 ml-0' : 'bg-blue-600 text-white ml-auto',
        isAI ? 'rounded-br-none' : 'rounded-bl-none'
      )}
    >
      {message.content}
    </div>
  );
};