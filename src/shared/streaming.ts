// Plain-JS streaming utility — no React dependencies
// Used by both the React useStreaming hook and the content script

export interface StreamConfig {
    provider?: string;
    baseUrl: string;
    apiKey: string;
    model: string;
}

export interface StreamMessage {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * Streams an LLM response using fetch + SSE.
 * Supports both Anthropic and OpenAI-compatible APIs.
 * Returns an AbortController so the caller can cancel the request.
 */
export function streamLLMResponse(
    messages: StreamMessage[],
    config: StreamConfig,
    onChunk: (fullText: string) => void,
    onDone: (fullText: string | null) => void,
    onError: (error: string) => void,
    abortController?: AbortController
): AbortController {
    const controller = abortController || new AbortController();

    (async () => {
        try {
            const isAnthropic = config.provider === 'anthropic' ||
                (!config.provider && config.baseUrl.includes('anthropic'));
            const url = isAnthropic
                ? `${config.baseUrl.replace(/\/$/, '')}/v1/messages`
                : `${config.baseUrl.replace(/\/$/, '')}/v1/chat/completions`;

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            let body: string;

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
                signal: controller.signal,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({})) as { error?: { message?: string } };
                const errMsg = errData.error?.message || `HTTP ${res.status}: ${res.statusText}`;
                if (res.status === 401) throw new Error(`Authentication failed: ${errMsg}`);
                if (res.status === 403) throw new Error(`Access denied: ${errMsg}`);
                if (res.status === 429) throw new Error(`Rate limit exceeded. Please wait and try again.`);
                throw new Error(errMsg);
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error('No response body');

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
                        const parsed = JSON.parse(data) as {
                            type?: string;
                            delta?: { text?: string };
                            choices?: Array<{ delta?: { content?: string } }>;
                        };
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
            if (err instanceof Error && err.name === 'AbortError') {
                onDone(null);
            } else {
                onError(err instanceof Error ? err.message : 'Unknown error');
            }
        }
    })();

    return controller;
}
