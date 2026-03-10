import type { AIAction } from '@/types';

/** Seed actions — written to storage on first install. All are editable/deletable except Translate (isFixed). */
export const SEED_ACTIONS: AIAction[] = [
  { id: 'explain', label: '💡 Explain', prompt: 'Please explain the following text clearly and concisely:\n\n' },
  { id: 'summarize', label: '📝 Summarize', prompt: 'Please provide a concise summary of the following text:\n\n' },
  { id: 'rewrite', label: '✍️ Rewrite', prompt: 'Please rewrite the following text to improve clarity and readability:\n\n' },
  { id: 'translate', label: '🌐 Translate', prompt: 'Please translate the following text to English (or if it is already in English, translate to Vietnamese):\n\n', isFixed: true },
];

// Backward compatibility — used as inline fallback in content script before storage is loaded
export const DEFAULT_CONTEXT_ACTIONS = SEED_ACTIONS;
export const DEFAULT_AI_ACTIONS = SEED_ACTIONS;
export const CONTEXT_ACTIONS = SEED_ACTIONS;
export const AI_ACTIONS = SEED_ACTIONS;

/** Load all actions from chrome.storage.local. Seeds with defaults if empty. */
export async function loadAllActions(): Promise<AIAction[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get('customActions', (result: { customActions?: AIAction[] }) => {
      if (result.customActions && result.customActions.length > 0) {
        resolve(result.customActions);
      } else {
        // First load — seed with defaults
        chrome.storage.local.set({ customActions: SEED_ACTIONS });
        resolve(SEED_ACTIONS);
      }
    });
  });
}

/** @deprecated Use loadAllActions instead */
export const loadCustomActions = loadAllActions;
export const getMergedActions = loadAllActions;