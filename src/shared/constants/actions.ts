import type { AIAction } from '@/types';
import {
  EXPLAIN_PROMPT,
  SUMMARIZE_PROMPT,
  REWRITE_PROMPT,
  TRANSLATE_PROMPT,
} from './prompts';

/** Seed actions — written to storage on first install. All are editable/deletable except Translate (isFixed). */
export const SEED_ACTIONS: AIAction[] = [
  { id: 'explain', label: '💡 Explain', prompt: EXPLAIN_PROMPT },
  { id: 'summarize', label: '📝 Summarize', prompt: SUMMARIZE_PROMPT },
  { id: 'rewrite', label: '✍️ Rewrite', prompt: REWRITE_PROMPT },
  { id: 'translate', label: '🌐 Translate', prompt: TRANSLATE_PROMPT, isFixed: true },
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