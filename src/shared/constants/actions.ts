import type { AIAction } from '@/types';

export const CONTEXT_ACTIONS: AIAction[] = [
  { id: 'explain', label: '💡 Explain', prompt: 'Please explain the following text clearly and concisely:\n\n' },
  { id: 'summarize', label: '📝 Summarize', prompt: 'Please provide a concise summary of the following text:\n\n' },
  { id: 'rewrite', label: '✍️ Rewrite', prompt: 'Please rewrite the following text to improve clarity and readability:\n\n' },
  { id: 'translate', label: '🌐 Translate', prompt: 'Please translate the following text to English (or if it is already in English, translate to Vietnamese):\n\n' },
];

export const AI_ACTIONS: AIAction[] = [
  { id: 'explain', label: '💡 Explain', prompt: 'Please explain the following text clearly and concisely:\n\n' },
  { id: 'summarize', label: '📝 Summarize', prompt: 'Please provide a concise summary of the following text:\n\n' },
  { id: 'rewrite', label: '✍️ Rewrite', prompt: 'Please rewrite the following text to improve clarity and readability:\n\n' },
  { id: 'translate', label: '🌐 Translate', prompt: 'Please translate the following text to English (or if it is already in English, translate to Vietnamese):\n\n' },
];