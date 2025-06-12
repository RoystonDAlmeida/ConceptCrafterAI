import { Message } from '../types';
import { generateId } from './idGenerator';

export type MessageRole = 'user' | 'ai';

export const createMessage = (content: string, role: MessageRole): Message => ({
    id: generateId(),
    content,
    role,
    timestamp: Date.now()
});

export const SAFETY_ERROR_PATTERN = /response blocked due to safety settings/i; 