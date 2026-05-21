'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '@/hooks/useChatStream';

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' };
const MONO: React.CSSProperties = { fontFamily: 'var(--font-ibm-plex-mono), monospace' };

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-3 px-6"
        style={{ background: 'var(--background)' }}
      >
        <div
          className="text-5xl leading-none select-none"
          style={{ ...SERIF, color: 'var(--accent)', opacity: 0.25 }}
        >
          &ldquo;
        </div>
        <p
          className="text-base text-center max-w-xs"
          style={{ ...SERIF, fontStyle: 'italic', color: 'var(--muted-foreground)' }}
        >
          Ask anything about medications, symptoms, or care decisions.
        </p>
        <p
          className="text-xs uppercase tracking-[0.12em]"
          style={{ ...MONO, color: 'var(--muted-foreground)', opacity: 0.6 }}
        >
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-5"
      style={{ background: 'var(--background)' }}
    >
      <div className="max-w-3xl mx-auto space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'user' ? (
              /* ── User bubble ── */
              <div
                className="max-w-[72%] px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: 'var(--foreground)',
                  color: '#FAFAF8',
                  borderRadius: '14px 14px 4px 14px',
                }}
              >
                {msg.content}
                {msg.streaming && (
                  <span
                    className="inline-block w-1.5 h-3.5 ml-1 rounded-sm animate-pulse align-middle"
                    style={{ background: 'rgba(250,250,248,0.6)' }}
                  />
                )}
              </div>
            ) : (
              /* ── Assistant bubble ── */
              <div
                className="max-w-[82%]"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px 14px 14px 14px',
                  boxShadow: '0 1px 3px rgba(26,26,26,0.05)',
                }}
              >
                {/* Assistant label */}
                <div
                  className="px-4 pt-3 pb-1 flex items-center gap-2"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <span
                    className="text-xs font-medium uppercase tracking-[0.12em]"
                    style={{ ...MONO, color: 'var(--accent)' }}
                  >
                    Co-Pilot
                  </span>
                </div>

                {/* Content */}
                <div className="px-4 py-3">
                  <div className="chat-prose">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content || (msg.streaming ? ' ' : '')}
                    </ReactMarkdown>
                  </div>
                  {msg.streaming && (
                    <span
                      className="inline-block w-1.5 h-3.5 ml-0.5 rounded-sm animate-pulse align-middle mt-1"
                      style={{ background: 'var(--accent)', opacity: 0.7 }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
