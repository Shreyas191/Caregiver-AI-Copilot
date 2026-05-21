import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' };
const MONO: React.CSSProperties  = { fontFamily: 'var(--font-ibm-plex-mono), monospace' };

const features = [
  {
    label: 'Set up in minutes',
    body: 'Create a care profile, add medications, and start asking questions right away.',
  },
  {
    label: 'AI-powered clinical answers',
    body: 'Ask about any medication, condition, or care decision — grounded in your loved one\'s record.',
  },
  {
    label: 'A complete care timeline',
    body: 'Every episode, vital, and document preserved in one organized, searchable place.',
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

export default function SignUpPage() {
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
              Get Started
            </span>
          </div>

          <h1
            className="text-5xl xl:text-6xl leading-[1.1] tracking-[-0.02em] mb-5"
            style={SERIF}
          >
            Caregiving,
            <br />
            <em>thoughtfully done.</em>
          </h1>

          <p className="text-lg leading-[1.75]" style={{ color: 'var(--muted-foreground)' }}>
            Create your account and bring order to one of the most important jobs there is — caring for someone you love.
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
            &ldquo;Built for caregivers who refuse to let anything fall through the cracks.&rdquo;
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
            Create your account
          </p>
        </div>

        <SignUp appearance={clerkAppearance} />

        <p className="mt-8 text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="font-medium underline underline-offset-2 transition-colors duration-200"
            style={{ color: 'var(--accent)' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
