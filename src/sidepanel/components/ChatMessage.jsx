import React, { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, User, Sparkles } from 'lucide-react';

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace('language-', '') || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="code-block-header">
        <span>{lang || 'code'}</span>
        <button onClick={handleCopy}>
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <code className={className}>{children}</code>
    </div>
  );
}

export default function ChatMessage({ message, isStreaming }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const markdownComponents = useMemo(() => ({
    pre({ children }) {
      return <pre>{children}</pre>;
    },
    code({ className, children, ...props }) {
      const isInline = !className;
      if (isInline) {
        return <code className={className} {...props}>{children}</code>;
      }
      return <CodeBlock className={className}>{children}</CodeBlock>;
    },
  }), []);

  return (
    <div className={`flex gap-3 animate-fade-in-up ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs mt-1 ${
        isUser
          ? 'bg-gradient-to-br from-accent to-accent-light text-white'
          : 'bg-bg-tertiary border border-border text-accent-light'
      }`}>
        {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
      </div>

      {/* Bubble */}
      <div className={`relative max-w-[85%] group ${isUser ? 'ml-auto' : 'mr-auto'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm ${
          isUser
            ? 'bg-gradient-to-br from-accent to-accent-light text-white rounded-tr-md'
            : 'bg-ai-bubble border border-border text-text-primary rounded-tl-md'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className={`markdown-body ${isStreaming ? 'streaming-cursor' : ''}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {message.content || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Copy button for AI messages */}
        {!isUser && !isStreaming && message.content && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100"
          >
            {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}
