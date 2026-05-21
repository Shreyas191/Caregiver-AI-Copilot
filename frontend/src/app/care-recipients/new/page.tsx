import OnboardingForm from '@/components/care-recipient/OnboardingForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Add Care Recipient | Caregiver Co-Pilot',
  description: 'Add a new care recipient to your dashboard',
};

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' };
const MONO: React.CSSProperties  = { fontFamily: 'var(--font-ibm-plex-mono), monospace' };

export default function NewCareRecipientPage() {
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
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 transition-colors duration-200"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase tracking-[0.1em]" style={MONO}>
              Dashboard
            </span>
          </Link>
          <span className="text-xl tracking-tight hidden sm:block" style={SERIF}>
            Caregiver Co-Pilot
          </span>
          {/* Spacer keeps logo centred */}
          <div className="w-24" />
        </div>
      </nav>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-6 md:px-8 pt-12 pb-8 text-center">
        <div className="mb-6 flex items-center justify-center gap-4">
          <span className="h-px w-10 shrink-0" style={{ background: 'var(--border)' }} />
          <span
            className="text-xs font-medium uppercase tracking-[0.15em]"
            style={{ ...MONO, color: 'var(--accent)' }}
          >
            New Care Recipient
          </span>
          <span className="h-px w-10 shrink-0" style={{ background: 'var(--border)' }} />
        </div>
        <h1 className="text-4xl md:text-5xl tracking-[-0.01em] mb-3" style={SERIF}>
          Let&apos;s get started.
        </h1>
        <p className="text-base leading-[1.75]" style={{ color: 'var(--muted-foreground)' }}>
          Tell us about the person you&apos;re caring for. We&apos;ll use this to tailor the assistant&apos;s advice.
        </p>
      </div>

      {/* ── Form ────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-6 md:px-8 pb-20">
        <OnboardingForm />
      </div>
    </div>
  );
}
