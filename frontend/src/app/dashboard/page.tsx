'use client';

import { useEffect, useState } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { MessageSquare, Plus, User } from 'lucide-react';
import { api } from '@/lib/api';

type CareRecipient = {
  id: string;
  display_name: string;
  date_of_birth: string;
  sex_at_birth: string;
  conditions: Array<{ name: string }>;
  consent_revoked_at?: string | null;
};

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
      <span
        className="text-xs font-medium uppercase tracking-[0.15em]"
        style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace', color: 'var(--accent)' }}
      >
        {children}
      </span>
      <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
    </div>
  );
}

function RecipientCard({ cr }: { cr: CareRecipient }) {
  const age = calcAge(cr.date_of_birth);
  const isRevoked = !!cr.consent_revoked_at;

  return (
    <div
      className="flex flex-col transition-all duration-200 hover:shadow-[0_4px_12px_rgba(26,26,26,0.07)]"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderTop: `2px solid ${isRevoked ? 'var(--border)' : 'var(--accent)'}`,
        borderRadius: '8px',
        boxShadow: '0 1px 2px rgba(26,26,26,0.04)',
      }}
    >
      {/* Card header */}
      <div className="px-7 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <Link href={`/care-recipients/${cr.id}`}>
            <h2
              className="text-xl leading-snug hover:underline underline-offset-2 decoration-[var(--accent)]"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontWeight: 600 }}
            >
              {cr.display_name}
            </h2>
          </Link>
          {isRevoked && (
            <span
              className="text-xs font-medium uppercase tracking-[0.1em] px-2 py-0.5 rounded"
              style={{
                fontFamily: 'var(--font-ibm-plex-mono), monospace',
                color: 'var(--muted-foreground)',
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                flexShrink: 0,
              }}
            >
              Revoked
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 mb-5">
          <span
            className="text-xs font-medium uppercase tracking-[0.12em]"
            style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace', color: 'var(--muted-foreground)' }}
          >
            {age} yrs · {cr.sex_at_birth === 'female' ? 'F' : cr.sex_at_birth === 'male' ? 'M' : cr.sex_at_birth}
          </span>
        </div>

        {/* Conditions */}
        {cr.conditions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {cr.conditions.slice(0, 3).map((c, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-0.5 rounded-full"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--muted-foreground)',
                  background: 'var(--muted)',
                }}
              >
                {c.name}
              </span>
            ))}
            {cr.conditions.length > 3 && (
              <span
                className="text-xs px-2.5 py-0.5 rounded-full"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--accent)',
                }}
              >
                +{cr.conditions.length - 3} more
              </span>
            )}
          </div>
        ) : (
          <p
            className="text-xs"
            style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace', color: 'var(--muted-foreground)', letterSpacing: '0.05em' }}
          >
            No conditions recorded
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="mx-7" style={{ height: '1px', background: 'var(--border)' }} />

      {/* Card footer */}
      <div className="px-7 py-4 flex gap-2.5">
        <Link href={`/chat/${cr.id}`} className="flex-1">
          <button
            className="btn-gold w-full h-9 text-sm flex items-center justify-center gap-1.5 min-h-[36px]"
            disabled={isRevoked}
            style={isRevoked ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Open Chat
          </button>
        </Link>
        <Link href={`/care-recipients/${cr.id}`}>
          <button className="btn-outline-serif h-9 px-4 text-sm min-h-[36px]">
            Profile
          </button>
        </Link>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderTop: '2px solid var(--border)',
            borderRadius: '8px',
            height: '220px',
          }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-24 text-center max-w-md mx-auto">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-8"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <User className="h-6 w-6" style={{ color: 'var(--muted-foreground)' }} />
      </div>
      <h2
        className="text-2xl mb-3"
        style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
      >
        No care recipients yet
      </h2>
      <p
        className="text-base leading-[1.75] mb-8"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Add the person you&apos;re caring for to get started. Their profile, medications, and care timeline will all live here.
      </p>
      <Link href="/care-recipients/new">
        <button className="btn-gold h-10 px-6 text-sm flex items-center gap-2 mx-auto min-h-[40px]">
          <Plus className="h-4 w-4" />
          Add Care Recipient
        </button>
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [recipients, setRecipients] = useState<CareRecipient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await api.careRecipients.list(token);
        setRecipients(data ?? []);
      } catch (err) {
        console.error('Failed to load care recipients', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

      {/* ── Navigation ──────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(250,250,248,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-8 flex items-center justify-between h-16">
          <Link href="/">
            <span
              className="text-xl tracking-tight"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              Caregiver Co-Pilot
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/care-recipients/new" className="hidden sm:block">
              <button className="btn-gold h-9 px-4 text-sm flex items-center gap-1.5 min-h-[36px]">
                <Plus className="h-3.5 w-3.5" />
                Add Recipient
              </button>
            </Link>
            <UserButton />
          </div>
        </div>
      </nav>

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-8 pt-14 pb-10">
        <div className="mb-8">
          <SectionLabel>Dashboard</SectionLabel>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1
              className="text-4xl md:text-5xl tracking-[-0.01em] mb-2"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              Your Care Recipients
            </h1>
            {!loading && (
              <p
                className="text-base leading-[1.75]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {recipients.length > 0
                  ? `${recipients.length} person${recipients.length !== 1 ? 's' : ''} in your care`
                  : 'Begin by adding someone you care for.'}
              </p>
            )}
          </div>

          <Link href="/care-recipients/new" className="sm:hidden">
            <button className="btn-gold h-10 px-5 text-sm flex items-center gap-2 min-h-[40px]">
              <Plus className="h-4 w-4" />
              Add Care Recipient
            </button>
          </Link>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <div className="h-px" style={{ background: 'var(--border)' }} />
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 md:px-8 py-12">
        {loading ? (
          <LoadingSkeleton />
        ) : recipients.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {recipients.map((cr) => (
              <RecipientCard key={cr.id} cr={cr} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
