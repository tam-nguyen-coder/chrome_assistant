import type { LLMConfig, PendingActionMessage } from './index';

declare global {
  interface ChromeStorageArea {
    llmConfig?: LLMConfig;
    pendingAction?: PendingActionMessage;
  }
}

export {};