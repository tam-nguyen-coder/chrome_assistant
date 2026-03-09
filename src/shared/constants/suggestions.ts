import { Lightbulb, Code, Languages, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Suggestion {
  icon: LucideIcon;
  text: string;
  label: string;
}

export const SUGGESTIONS: Suggestion[] = [
  { icon: Lightbulb, text: 'Explain this concept clearly and concisely', label: 'Explain' },
  { icon: Code, text: 'Write a code snippet to solve this problem', label: 'Code' },
  { icon: Languages, text: 'Translate the following text', label: 'Translate' },
  { icon: Zap, text: 'Summarize the key points of this topic', label: 'Summarize' },
];