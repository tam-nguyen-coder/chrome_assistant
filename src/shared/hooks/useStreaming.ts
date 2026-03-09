import { useState, useRef, useCallback } from 'react';
import { streamLLMResponse } from '@/shared/streaming';
import type { ConversationMessage, LLMConfig } from '@/types';

export default function useStreaming() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(async (
    messages: ConversationMessage[],
    config: LLMConfig,
    onChunk: (text: string) => void,
    onDone: (text: string | null) => void,
    onError: (error: string) => void
  ) => {
    setIsStreaming(true);
    abortRef.current = new AbortController();

    streamLLMResponse(
      messages,
      config,
      onChunk,
      (finalText) => {
        setIsStreaming(false);
        abortRef.current = null;
        onDone(finalText);
      },
      (errMsg) => {
        setIsStreaming(false);
        abortRef.current = null;
        onError(errMsg);
      },
      abortRef.current
    );
  }, []);

  return { sendMessage, isStreaming, stopStreaming };
}
