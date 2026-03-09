import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Trash2, Sparkles, AlertCircle, MessageSquarePlus } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { useStreaming } from '@/shared/hooks';
import { SUGGESTIONS } from '@/shared/constants';
import type { Message, LLMConfig, PendingActionMessage } from '@/types';

interface StorageResult {
  llmConfig?: LLMConfig;
  pendingAction?: PendingActionMessage;
}

export default function SidePanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedTimestampRef = useRef<number>(0);
  const { sendMessage, isStreaming, stopStreaming } = useStreaming();

  // Load config
  useEffect(() => {
    const loadConfig = () => {
      chrome.storage.local.get('llmConfig', (result: StorageResult) => {
        if (result.llmConfig?.apiKey) {
          setConfig(result.llmConfig);
          setError(null);
        } else {
          setConfig(null);
        }
      });
    };
    loadConfig();
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.llmConfig) loadConfig();
    });
  }, []);

  // Listen for context menu messages (from background on right-click context menu)
  useEffect(() => {
    const listener = (message: { type: string; prompt: string; timestamp?: number }) => {
      if (message.type === 'CONTEXT_ACTION') {
        handleSend(message.prompt);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [config]);

  // Check for pending actions from text selection popup (stored in chrome.storage)
  useEffect(() => {
    if (!config) return; // Wait until config is loaded before consuming actions

    const consumePendingAction = () => {
      chrome.storage.local.get('pendingAction', (result: StorageResult) => {
        if (result.pendingAction?.prompt) {
          const timestamp = result.pendingAction.timestamp || 0;
          const age = Date.now() - timestamp;

          // Only process recent actions (within 10 seconds) and not already processed
          if (age < 10000 && timestamp > lastProcessedTimestampRef.current) {
            lastProcessedTimestampRef.current = timestamp;
            handleSend(result.pendingAction.prompt);
          }
          chrome.storage.local.remove('pendingAction');
        }
      });
    };

    // Check on mount (or when config just loaded)
    consumePendingAction();

    // Listen for new pending actions
    const storageListener = (changes: { pendingAction?: { newValue?: { prompt: string } } }) => {
      if (changes.pendingAction?.newValue?.prompt) {
        consumePendingAction();
      }
    };
    chrome.storage.onChanged.addListener(storageListener);
    return () => chrome.storage.onChanged.removeListener(storageListener);
  }, [config]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback((text: string) => {
    if (!config) return;
    setError(null);

    const userMsg: Message = { role: 'user', content: text, id: Date.now() };
    const assistantMsg: Message = { role: 'assistant', content: '', id: Date.now() + 1 };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const conversationHistory = [...messages, userMsg].filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
      role: m.role,
      content: m.content,
    }));

    sendMessage(
      conversationHistory,
      config,
      (partialText: string) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: partialText } : m))
        );
      },
      (finalText: string | null) => {
        if (finalText !== null) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: finalText } : m))
          );
        }
      },
      (errMsg: string) => {
        setError(errMsg);
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
      }
    );
  }, [config, messages, sendMessage]);

  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-border bg-bg-secondary/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-lg shadow-accent-glow/50">
            <Sparkles className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-text-primary leading-tight">LLM Assistant</h1>
            <p className="text-[11px] text-text-muted mt-0.5">
              {config ? `${config.model}` : 'Not configured'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClear}
            className="p-2.5 rounded-xl text-text-muted hover:text-accent-light hover:bg-accent/10 transition-all duration-200"
            title="New chat"
          >
            <MessageSquarePlus className="w-[18px] h-[18px]" />
          </button>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="p-2.5 rounded-xl text-text-muted hover:text-error hover:bg-error/10 transition-all duration-200"
              title="Clear chat"
            >
              <Trash2 className="w-[18px] h-[18px]" />
            </button>
          )}
          <button
            onClick={openOptions}
            className="p-2.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all duration-200"
            title="Settings"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-5 py-5 space-y-5">
          {!config ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-bg-tertiary border border-border flex items-center justify-center mb-5">
                <Settings className="w-7 h-7 text-text-muted" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">Setup Required</h2>
              <p className="text-sm text-text-secondary mb-5 leading-relaxed max-w-[280px]">
                Configure your API key and model to get started.
              </p>
              <button
                onClick={openOptions}
                className="px-6 py-3 bg-gradient-to-r from-accent to-accent-light text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-accent-glow transition-all duration-200"
              >
                Open Settings
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-5 min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-light/20 border border-accent/20 flex items-center justify-center mb-5">
                <MessageSquarePlus className="w-7 h-7 text-accent-light" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">Start a Conversation</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-7">
                Type a message or try a suggestion below.
              </p>
              <div className="w-full flex flex-col gap-2.5 max-w-[320px]">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s.text)}
                    className="suggestion-chip"
                  >
                    <s.icon className="w-[18px] h-[18px] text-accent-light flex-shrink-0" />
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'assistant'}
              />
            ))
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-error/10 border border-error/30 rounded-xl text-sm text-error animate-fade-in-up">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={stopStreaming}
        isStreaming={isStreaming}
        disabled={!config}
      />
    </div>
  );
}