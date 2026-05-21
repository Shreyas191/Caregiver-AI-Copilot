'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-ibm-plex-mono), monospace' };

export function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (content: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  const canSend = !disabled && !!value.trim();

  return (
    <div
      className="shrink-0 px-4 md:px-6 pt-3 pb-4"
      style={{
        background: 'var(--background)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="max-w-3xl mx-auto flex items-end gap-3">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          placeholder="Ask about medications, symptoms, or care decisions…"
          className="flex-1 resize-none text-sm leading-relaxed focus:outline-none transition-all duration-150 disabled:opacity-50"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--foreground)',
            padding: '10px 14px',
            minHeight: '44px',
            maxHeight: '160px',
            fontFamily: 'var(--font-source-sans), system-ui, sans-serif',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(184,134,11,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />

        <button
          onClick={submit}
          disabled={!canSend}
          className="shrink-0 flex items-center justify-center rounded-lg transition-all duration-200"
          style={{
            width: '44px',
            height: '44px',
            background: canSend ? 'var(--accent)' : 'var(--muted)',
            color: canSend ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
            border: canSend ? 'none' : '1px solid var(--border)',
            cursor: canSend ? 'pointer' : 'not-allowed',
            boxShadow: canSend ? '0 1px 3px rgba(184,134,11,0.2)' : 'none',
          }}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Hint */}
      <p
        className="text-center mt-2 text-xs uppercase tracking-[0.1em]"
        style={{ ...MONO, color: 'var(--muted-foreground)', opacity: 0.5 }}
      >
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
}
