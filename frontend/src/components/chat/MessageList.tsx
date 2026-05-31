'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage, ToolCallEvent } from '@/hooks/useChatStream';

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' };
const MONO: React.CSSProperties = { fontFamily: 'var(--font-ibm-plex-mono), monospace' };

const TOOL_LABELS: Record<string, string> = {
  get_care_recipient_profile: 'Loading profile',
  get_active_medications: 'Checking medications',
  get_recent_vitals: 'Getting vitals',
  get_recent_episodes: 'Loading episodes',
  log_vital: 'Logging vital',
  log_episode: 'Logging episode',
  check_drug_interactions: 'Checking drug interactions',
  lookup_medication_side_effects: 'Looking up side effects',
  check_symptom_medication_link: 'Analyzing symptoms',
  assess_urgency: 'Assessing urgency',
};

// ── Loading components ──────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 160, 320].map((delay, i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full animate-bounce"
          style={{
            background: 'var(--accent)',
            opacity: 0.5,
            animationDelay: `${delay}ms`,
            animationDuration: '1.4s',
          }}
        />
      ))}
    </div>
  );
}

function ResponseSkeleton() {
  return (
    <div className="space-y-2.5 py-1">
      <div
        className="h-3 rounded-md animate-pulse"
        style={{ background: 'var(--muted)', width: '78%', animationDelay: '0ms' }}
      />
      <div
        className="h-3 rounded-md animate-pulse"
        style={{ background: 'var(--muted)', width: '55%', animationDelay: '200ms' }}
      />
    </div>
  );
}

// ── Tool call badge ─────────────────────────────────────────────────

function ToolCallBadge({ tc }: { tc: ToolCallEvent }) {
  const label = TOOL_LABELS[tc.name] ?? tc.name.replace(/_/g, ' ');
  const calling = tc.status === 'calling';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full transition-all duration-300"
      style={{
        ...MONO,
        border: '1px solid var(--border)',
        background: calling ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent',
        color: calling ? 'var(--accent)' : 'var(--muted-foreground)',
        opacity: calling ? 1 : 0.7,
      }}
    >
      {calling ? (
        <span
          className="inline-block animate-spin leading-none"
          style={{ fontSize: '0.75rem' }}
        >
          ⟳
        </span>
      ) : (
        <span className="leading-none">✓</span>
      )}
      {label}
    </span>
  );
}

// ── Message list ────────────────────────────────────────────────────

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
              </div>
            ) : (
              /* ── Assistant bubble ── */
              <AssistantBubble msg={msg} />
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── Assistant bubble (extracted for clarity) ────────────────────────

function AssistantBubble({ msg }: { msg: ChatMessage }) {
  const hasToolCalls = (msg.toolCalls?.length ?? 0) > 0;
  const hasActiveTool = msg.toolCalls?.some((tc) => tc.status === 'calling') ?? false;
  const hasContent = Boolean(msg.content);

  // Phase derivation
  const isWaiting = msg.streaming && !hasContent && !hasToolCalls;
  const isToolCalling = msg.streaming && !hasContent && hasActiveTool;
  const isGenerating = msg.streaming && !hasContent && hasToolCalls && !hasActiveTool;

  return (
    <div
      className="max-w-[82%]"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '4px 14px 14px 14px',
        boxShadow: '0 1px 3px rgba(26,26,26,0.05)',
      }}
    >
      {/* ── Label row ── */}
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

      {/* ── Tool call badges ── */}
      {hasToolCalls && (
        <div
          className="px-4 pt-2.5 pb-2 flex flex-col gap-2"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex flex-wrap gap-1.5">
            {msg.toolCalls!.map((tc, i) => (
              <ToolCallBadge key={i} tc={tc} />
            ))}
          </div>

          {/* Animated progress bar while a tool is actively calling */}
          {isToolCalling && (
            <div
              className="h-px w-full rounded-full overflow-hidden"
              style={{ background: 'var(--muted)' }}
            >
              <div
                className="h-full animate-pulse rounded-full"
                style={{ background: 'var(--accent)', opacity: 0.5, width: '100%' }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Content / loading state ── */}
      <div className="px-4 py-3">
        {isWaiting ? (
          /* Phase 0: no events yet — show typing dots */
          <TypingIndicator />
        ) : isToolCalling || isGenerating ? (
          /* Phase 1–2: tools running or done but no text yet — show skeleton */
          <ResponseSkeleton />
        ) : (
          /* Phase 3+: actual content (streaming or done) */
          <>
            <div className="chat-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content || ''}
              </ReactMarkdown>
            </div>
            {msg.streaming && (
              <span
                className="inline-block w-1.5 h-3.5 ml-0.5 rounded-sm animate-pulse align-middle mt-1"
                style={{ background: 'var(--accent)', opacity: 0.7 }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
