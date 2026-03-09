export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}