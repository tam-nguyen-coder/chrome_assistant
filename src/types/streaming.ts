import type { ConversationMessage, LLMConfig } from './index';

export interface StreamingCallbacks {
  onChunk: (text: string) => void;
  onDone: (text: string | null) => void;
  onError: (error: string) => void;
}

export interface UseStreamingReturn {
  sendMessage: (
    messages: ConversationMessage[],
    config: LLMConfig,
    onChunk: (text: string) => void,
    onDone: (text: string | null) => void,
    onError: (error: string) => void
  ) => void;
  isStreaming: boolean;
  stopStreaming: () => void;
}