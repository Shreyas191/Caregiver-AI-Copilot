'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth, UserButton } from '@clerk/nextjs';

import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { ThreadSidebar } from '@/components/chat/ThreadSidebar';
import { useChatStream } from '@/hooks/useChatStream';
import { api } from '@/lib/api';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-ibm-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' };

export default function ChatPage() {
  const { careRecipientId } = useParams<{ careRecipientId: string }>();
  const { getToken } = useAuth();
  const [recipientName, setRecipientName] = useState<string>('');

  const { messages, threadId, streaming, send, loadThread, startNewThread } =
    useChatStream(careRecipientId);

  // Derive streaming phase from the last streaming message for header status text
  const streamingMsg = streaming ? messages.findLast((m) => m.streaming) : null;
  const hasActiveTool = streamingMsg?.toolCalls?.some((tc) => tc.status === 'calling') ?? false;
  const hasAnyTool = (streamingMsg?.toolCalls?.length ?? 0) > 0;
  const hasContent = Boolean(streamingMsg?.content);
  const streamingLabel =
    !streaming ? null
    : hasActiveTool ? 'Getting data'
    : hasAnyTool && !hasContent ? 'Generating'
    : 'Responding';

  useEffect(() => {
    async function loadName() {
      try {
        const token = await getToken();
        if (!token) return;
        const cr = await api.careRecipients.get(token, careRecipientId);
        setRecipientName(cr.display_name ?? '');
      } catch { /* non-critical */ }
    }
    loadName();
  }, [careRecipientId, getToken]);

  const handleSelectThread = useCallback(
    async (tid: string) => { await loadThread(tid); },
    [loadThread],
  );

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <header
        className="shrink-0 h-14 flex items-center px-4 md:px-6 gap-4"
        style={{
          background: 'rgba(250,250,248,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Back link */}
        <Link
          href={`/care-recipients/${careRecipientId}`}
          className="flex items-center gap-1.5 transition-colors duration-200 shrink-0"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="text-xs font-medium uppercase tracking-[0.1em]" style={MONO}>
            Profile
          </span>
        </Link>

        {/* Title */}
        <div className="flex-1 flex flex-col items-center">
          {recipientName && (
            <span className="text-base leading-tight" style={SERIF}>
              {recipientName}
            </span>
          )}
          {streamingLabel && (
            <span
              className="text-xs uppercase tracking-[0.1em] flex items-center gap-1.5"
              style={{ ...MONO, color: 'var(--accent)' }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: 'var(--accent)' }}
              />
              {streamingLabel}
            </span>
          )}
        </div>

        {/* User button */}
        <div className="shrink-0">
          <UserButton />
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        <ThreadSidebar
          careRecipientId={careRecipientId}
          activeThreadId={threadId}
          onSelectThread={handleSelectThread}
          onNewThread={startNewThread}
        />

        <div className="flex flex-col flex-1 min-w-0">
          <MessageList messages={messages} />
          <MessageInput onSend={send} disabled={streaming} />
        </div>
      </div>
    </div>
  );
}
