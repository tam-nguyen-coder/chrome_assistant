import { useState, useCallback, useMemo, useRef, useEffect, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import { Copy, Check, User, Sparkles } from 'lucide-react';
import type { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
  isStreaming: boolean;
}

function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}

interface CodeBlockProps {
  children: string;
  className?: string;
}

function CodeBlock({ children, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const lang = className?.replace('language-', '') || '';

  useEffect(() => {
    if (codeRef.current && lang) {
      Prism.highlightElement(codeRef.current);
    }
  }, [children, lang]);

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
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <code ref={codeRef} className={className}>
        {children}
      </code>
    </div>
  );
}

export default function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markdownComponents = useMemo((): any => ({
    pre({ children }: { children?: ReactNode }) {
      return <pre>{children}</pre>;
    },
    code({ className, children }: { className?: string; children?: ReactNode }) {
      const isInline = !className;
      if (isInline) {
        return <code className={className}>{children}</code>;
      }
      return <CodeBlock className={className}>{String(children)}</CodeBlock>;
    },
  }), []);

  const showTypingIndicator = isStreaming && !message.content;

  return (
    <div className={`flex gap-3 animate-fade-in-up ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
        isUser
          ? 'bg-gradient-to-br from-accent to-accent-light text-white'
          : 'bg-bg-tertiary border border-border text-accent-light'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className={`relative max-w-[85%] group ${isUser ? 'ml-auto' : 'mr-auto'}`}>
        <div className={`px-4 py-3.5 rounded-2xl text-[14px] leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-accent to-accent-light text-white rounded-tr-md'
            : 'bg-ai-bubble border border-border text-text-primary rounded-tl-md'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : showTypingIndicator ? (
            <TypingIndicator />
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
            className="absolute -bottom-7 left-0 flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100 py-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}