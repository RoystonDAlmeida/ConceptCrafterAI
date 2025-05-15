export interface Message {
  id: string;
  content: string;
  role: 'user' | 'ai';
  timestamp: number;
  questionId?: string;
}

export interface Question {
  id: string;
  text: string;
  category: string;
  followUpQuestions: string[];
}

export interface ConceptData {
  [key: string]: string;
}