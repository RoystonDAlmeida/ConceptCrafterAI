export type {
  Message,
  ConceptData, // This will be the dynamic { [key: string]: string } type
  StructuredConceptData,
  Conversation,
  ProcessedConversation,
  VideoConceptSummary,
} from './conversation';

export interface Question {
  id: string;
  text: string;
  category: string;
  followUpQuestions: string[];
}