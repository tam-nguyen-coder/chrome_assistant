import { useState, useRef, useCallback } from 'react';

export default function useStreaming() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(async (messages, config, onChunk, onDone, onError) => {
    setIsStreaming(true);
    abortRef.current = new AbortController();

    try {
      const isAnthropic = config.baseUrl.includes('anthropic');
      const url = isAnthropic
        ? `${config.baseUrl.replace(/\/$/, '')}/v1/messages`
        : `${config.baseUrl.replace(/\/$/, '')}/v1/chat/completions`;

      const headers = { 'Content-Type': 'application/json' };
      let body;

      if (isAnthropic) {
        headers['x-api-key'] = config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        headers['anthropic-dangerous-direct-browser-access'] = 'true';
        body = JSON.stringify({
          model: config.model,
          max_tokens: 8192,
          stream: true,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });
      } else {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        body = JSON.stringify({
          model: config.model,
          max_tokens: 8192,
          stream: true,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        if (res.status === 401) throw new Error(`Authentication failed: ${errMsg}`);
        if (res.status === 403) throw new Error(`Access denied: ${errMsg}`);
        if (res.status === 429) throw new Error(`Rate limit exceeded. Please wait and try again.`);
        throw new Error(errMsg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            let text = '';

            if (isAnthropic) {
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                text = parsed.delta.text;
              }
            } else {
              text = parsed.choices?.[0]?.delta?.content || '';
            }

            if (text) {
              fullText += text;
              onChunk(fullText);
            }
          } catch {
            // skip malformed JSON
          }
        }
      }

      onDone(fullText);
    } catch (err) {
      if (err.name === 'AbortError') {
        onDone(null);
      } else {
        onError(err.message);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, []);

  return { sendMessage, isStreaming, stopStreaming };
}
