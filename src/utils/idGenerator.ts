import { v4 as uuidv4 } from 'uuid';

// Function to generate a unique ID for a user/ai message/response
export const generateId = (): string => {
  return uuidv4().slice(0, 8);
};