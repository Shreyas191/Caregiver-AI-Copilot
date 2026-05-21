'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { SquarePen } from 'lucide-react';

type Thread = {
  id: string;
  title: string | null;
  updated_at: string;
};

type ThreadSidebarProps = {
  careRecipientId: string;
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000') + '/api/v1';
const MONO: React.CSSProperties = { fontFamily: 'var(--font-ibm-plex-mono), monospace' };

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ThreadSidebar({
  careRecipientId,
  activeThreadId,
  onSelectThread,
  onNewThread,
}: ThreadSidebarProps) {
  const { getToken } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/chat/${careRecipientId}/threads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setThreads(await res.json());
    }
    load();
  }, [careRecipientId, getToken, activeThreadId]);

  return (
    <aside
      className="w-56 md:w-60 shrink-0 flex flex-col"
      style={{ background: 'var(--muted)', borderRight: '1px solid var(--border)' }}
    >
      {/* New chat */}
      <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={onNewThread}
          className="w-full flex items-center justify-center gap-2 h-9 text-sm rounded-md transition-all duration-200"
          style={{
            ...MONO,
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            border: '1px solid var(--foreground)',
            color: 'var(--foreground)',
            background: 'transparent',
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--foreground)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)';
          }}
        >
          <SquarePen className="h-3.5 w-3.5" />
          New Chat
        </button>
      </div>

      {/* Thread list */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {threads.length === 0 ? (
          <p
            className="text-center py-6 text-xs uppercase tracking-[0.1em]"
            style={{ ...MONO, color: 'var(--muted-foreground)' }}
          >
            No conversations yet
          </p>
        ) : (
          <ul className="space-y-0.5">
            {threads.map((t) => {
              const isActive = activeThreadId === t.id;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => onSelectThread(t.id)}
                    className="w-full text-left px-3 py-2.5 rounded-md transition-all duration-200"
                    style={{
                      borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                      background: isActive ? 'rgba(255,255,255,0.65)' : 'transparent',
                      paddingLeft: isActive ? '10px' : '12px',
                    }}
                  >
                    <p
                      className="text-sm truncate leading-snug"
                      style={{ color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)', fontWeight: isActive ? 500 : 400 }}
                    >
                      {t.title ?? 'New conversation'}
                    </p>
                    <p
                      className="text-xs mt-0.5 uppercase tracking-[0.08em]"
                      style={{ ...MONO, color: 'var(--muted-foreground)', opacity: 0.7 }}
                    >
                      {formatDate(t.updated_at)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
