import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' };
const MONO: React.CSSProperties  = { fontFamily: 'var(--font-ibm-plex-mono), monospace' };

const features = [
  {
    label: 'Your complete care record',
    body: 'Every medication, vital, episode, and document — organized and always accessible.',
  },
  {
    label: 'AI answers in seconds',
    body: 'Ask anything about a condition, medication, or care decision and get a grounded answer.',
  },
  {
    label: 'Peace of mind, always',
    body: 'Know exactly what\'s happening and why, no matter the time of day.',
  },
];

const clerkAppearance = {
  variables: {
    colorPrimary: '#B8860B',
    colorBackground: '#FFFFFF',
    colorInputBackground: '#FAFAF8',
    colorInputText: '#1A1A1A',
    colorText: '#1A1A1A',
    colorTextSecondary: '#6B6B6B',
    colorDanger: '#9A3412',
    borderRadius: '6px',
    fontFamily: '"Source Sans 3", system-ui, sans-serif',
    fontFamilyButtons: '"Source Sans 3", system-ui, sans-serif',
    fontSize: '15px',
  },
};

export default function SignInPage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>

      {/* ── Left branding panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 xl:p-16 relative overflow-hidden"
        style={{ background: 'var(--muted)', borderRight: '1px solid var(--border)' }}
      >
        {/* Ambient glow */}
        <div
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'rgba(184,134,11,0.07)', filter: 'blur(100px)' }}
        />

        {/* Logo */}
        <Link href="/">
          <span className="text-2xl tracking-tight" style={SERIF}>
            Caregiver Co-Pilot
          </span>
        </Link>

        {/* Main copy */}
        <div className="relative">
          <div className="mb-8 flex items-center gap-4">
            <span className="h-px w-10 shrink-0" style={{ background: 'var(--border)' }} />
            <span
              className="text-xs font-medium uppercase tracking-[0.15em]"
              style={{ ...MONO, color: 'var(--accent)' }}
            >
              Welcome Back
            </span>
          </div>

          <h1
            className="text-5xl xl:text-6xl leading-[1.1] tracking-[-0.02em] mb-5"
            style={SERIF}
          >
            Your loved one&apos;s
            <br />
            <em>care is waiting.</em>
          </h1>

          <p className="text-lg leading-[1.75]" style={{ color: 'var(--muted-foreground)' }}>
            Sign in to pick up exactly where you left off — every record, conversation, and medication intact.
          </p>

          {/* Features */}
          <div className="mt-12 space-y-6">
            {features.map((f) => (
              <div key={f.label} className="flex items-start gap-4">
                <span
                  className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--accent)' }}
                />
                <div>
                  <p className="text-sm font-medium mb-0.5">{f.label}</p>
                  <p className="text-sm leading-[1.7]" style={{ color: 'var(--muted-foreground)' }}>
                    {f.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer quote */}
        <div>
          <div className="h-px mb-6" style={{ background: 'var(--border)' }} />
          <p
            className="text-sm leading-[1.75]"
            style={{ ...SERIF, fontStyle: 'italic', color: 'var(--muted-foreground)' }}
          >
            &ldquo;Designed for the full complexity of caregiving.&rdquo;
          </p>
        </div>
      </div>

      {/* ── Right auth panel ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Mobile-only logo */}
        <div className="lg:hidden mb-10 text-center">
          <Link href="/">
            <span className="text-2xl tracking-tight" style={SERIF}>
              Caregiver Co-Pilot
            </span>
          </Link>
          <p
            className="mt-2 text-xs uppercase tracking-[0.12em]"
            style={{ ...MONO, color: 'var(--muted-foreground)' }}
          >
            Welcome back
          </p>
        </div>

        <SignIn appearance={clerkAppearance} />

        <p className="mt-8 text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>
          Don&apos;t have an account?{' '}
          <Link
            href="/sign-up"
            className="font-medium underline underline-offset-2 transition-colors duration-200"
            style={{ color: 'var(--accent)' }}
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
