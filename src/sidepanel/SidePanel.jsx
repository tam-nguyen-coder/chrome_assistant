import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Trash2, Sparkles, AlertCircle, MessageSquarePlus } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import useStreaming from './hooks/useStreaming';

export default function SidePanel() {
  const [messages, setMessages] = useState([]);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const { sendMessage, isStreaming, stopStreaming } = useStreaming();

  // Load config
  useEffect(() => {
    const loadConfig = () => {
      chrome.storage.local.get('llmConfig', (result) => {
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

  // Listen for context menu messages
  useEffect(() => {
    const listener = (message) => {
      if (message.type === 'CONTEXT_ACTION') {
        handleSend(message.prompt);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [config]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback((text) => {
    if (!config) return;
    setError(null);

    const userMsg = { role: 'user', content: text, id: Date.now() };
    const assistantMsg = { role: 'assistant', content: '', id: Date.now() + 1 };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const conversationHistory = [...messages, userMsg].filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
      role: m.role,
      content: m.content,
    }));

    sendMessage(
      conversationHistory,
      config,
      (partialText) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: partialText } : m))
        );
      },
      (finalText) => {
        if (finalText !== null) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: finalText } : m))
          );
        }
      },
      (errMsg) => {
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary/60 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-md shadow-accent-glow">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary leading-tight">LLM Assistant</h1>
            <p className="text-[10px] text-text-muted">
              {config ? `${config.model}` : 'Not configured'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all duration-200"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={openOptions}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all duration-200"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {!config ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-bg-tertiary border border-border flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-text-muted" />
            </div>
            <h2 className="text-base font-semibold text-text-primary mb-1.5">Setup Required</h2>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              Configure your API key and model to get started.
            </p>
            <button
              onClick={openOptions}
              className="px-5 py-2.5 bg-gradient-to-r from-accent to-accent-light text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-accent-glow transition-all duration-200"
            >
              Open Settings
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-light/20 border border-accent/20 flex items-center justify-center mb-4">
              <MessageSquarePlus className="w-6 h-6 text-accent-light" />
            </div>
            <h2 className="text-base font-semibold text-text-primary mb-1.5">Start a Conversation</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Type a message below or select text on any webpage and right-click to interact with AI.
            </p>
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
          <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/30 rounded-xl text-sm text-error animate-fade-in-up">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

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
