import { useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
}

export default function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const text = textareaRef.current?.value.trim();
    if (!text || isStreaming) return;
    onSend(text);
    textareaRef.current!.value = '';
    adjustHeight();
  };

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  };

  return (
    <div className="flex-shrink-0 p-4 border-t border-border bg-bg-secondary/80 backdrop-blur-sm">
      <div className="flex items-end gap-2.5 bg-bg-tertiary/60 rounded-2xl border border-border focus-within:border-border-active focus-within:ring-1 focus-within:ring-accent-glow/50 transition-all duration-200 p-3">
        <textarea
          ref={textareaRef}
          onKeyDown={handleKeyDown}
          onInput={adjustHeight}
          placeholder="Send a message..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-text-primary placeholder-text-muted text-[14px] resize-none outline-none px-1 py-1.5 max-h-[120px] leading-relaxed"
        />
        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-error/20 text-error hover:bg-error/30 transition-all duration-200"
            title="Stop generating"
          >
            <Square className="w-[18px] h-[18px]" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={disabled}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-light text-white hover:shadow-lg hover:shadow-accent-glow transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>
    </div>
  );
}