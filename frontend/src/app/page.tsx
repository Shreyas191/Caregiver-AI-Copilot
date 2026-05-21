import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

const features = [
  {
    num: "01",
    title: "AI Clinical Chat",
    body: "Ask questions about medications, diagnoses, and care plans. Get clear, contextual answers grounded in your loved one's personal health record.",
  },
  {
    num: "02",
    title: "Medication Management",
    body: "Track every prescription, dosage, and schedule in one place. Stay informed about potential interactions and upcoming refills automatically.",
  },
  {
    num: "03",
    title: "Care Timeline",
    body: "A living record of episodes, vitals, appointments, and documents — every detail preserved and searchable exactly when you need it.",
  },
];

const steps = [
  {
    num: "01",
    title: "Add your loved one",
    body: "Create a secure profile with their conditions, medications, and care history. Takes under five minutes.",
  },
  {
    num: "02",
    title: "Upload documents",
    body: "Import medical records, discharge summaries, and lab results. The AI reads and indexes everything automatically.",
  },
  {
    num: "03",
    title: "Ask anything",
    body: "Chat with your AI co-pilot about medications, interactions, symptoms, or next steps — any time, day or night.",
  },
];

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>

      {/* ── Navigation ──────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: "rgba(250,250,248,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-8 flex items-center justify-between h-16">
          <span
            className="text-xl tracking-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Caregiver Co-Pilot
          </span>

          <div className="flex items-center gap-6">
            {userId ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden sm:block text-sm font-medium tracking-[0.05em] transition-colors duration-200"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Dashboard
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden sm:block text-sm font-medium tracking-[0.05em] transition-colors duration-200"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Sign In
                </Link>
                <Link href="/sign-up">
                  <button className="btn-gold h-9 px-5 text-sm min-h-[36px]">
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative py-36 md:py-52 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div
            className="w-[800px] h-[800px] rounded-full"
            style={{
              background: "rgba(184,134,11,0.06)",
              filter: "blur(130px)",
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 md:px-8 text-center">
          {/* Section label */}
          <div className="mb-10 flex items-center justify-center gap-4">
            <span className="h-px w-12 flex-shrink-0" style={{ background: "var(--border)" }} />
            <span
              className="text-xs font-medium uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                color: "var(--accent)",
              }}
            >
              AI-Powered Care Management
            </span>
            <span className="h-px w-12 flex-shrink-0" style={{ background: "var(--border)" }} />
          </div>

          <h1
            className="text-[2.5rem] md:text-[4.5rem] leading-[1.1] tracking-[-0.02em] mb-8"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Thoughtful care,
            <br />
            <em>always at hand.</em>
          </h1>

          <p
            className="text-lg leading-[1.75] tracking-[0.01em] max-w-xl mx-auto mb-12"
            style={{ color: "var(--muted-foreground)" }}
          >
            An AI co-pilot for family caregivers — managing medications,
            answering clinical questions, and keeping every detail of your loved
            one&apos;s care in one trusted place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {userId ? (
              <Link href="/dashboard">
                <button className="btn-gold h-12 px-8 text-base min-h-[48px] min-w-[180px]">
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link href="/sign-up">
                  <button className="btn-gold h-12 px-8 text-base min-h-[48px] min-w-[180px]">
                    Get Started Free
                  </button>
                </Link>
                <a href="#features">
                  <button className="btn-outline-serif h-12 px-8 text-base min-h-[48px] min-w-[180px]">
                    Learn More ↓
                  </button>
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <div className="h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <section className="py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {[
              { value: "AI", label: "Clinical intelligence" },
              { value: "24/7", label: "Always available" },
              { value: "< 30s", label: "Average response" },
              { value: "Free", label: "To get started" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div
                  className="text-4xl md:text-5xl mb-3"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs font-medium uppercase tracking-[0.12em]"
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    color: "var(--muted-foreground)",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <div className="h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="py-32 md:py-44">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          {/* Section label */}
          <div className="mb-14 flex items-center gap-4">
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
            <span
              className="text-xs font-medium uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                color: "var(--accent)",
              }}
            >
              What We Do
            </span>
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
          </div>

          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl leading-[1.2] tracking-[-0.01em] mb-5"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Everything a caregiver needs
            </h2>
            <p
              className="text-lg leading-[1.75] max-w-2xl mx-auto"
              style={{ color: "var(--muted-foreground)" }}
            >
              From managing complex medication schedules to navigating difficult
              conversations with specialists, Caregiver Co-Pilot is built for
              the full complexity of caregiving.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {features.map((f) => (
              <div
                key={f.num}
                className="p-8 md:p-10 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(26,26,26,0.06)]"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderTop: "2px solid var(--accent)",
                  borderRadius: "8px",
                  boxShadow: "0 1px 2px rgba(26,26,26,0.04)",
                }}
              >
                <div
                  className="text-xs font-medium uppercase tracking-[0.15em] mb-5"
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    color: "var(--accent)",
                  }}
                >
                  {f.num}
                </div>
                <h3
                  className="text-xl mb-3"
                  style={{
                    fontFamily: "var(--font-playfair), Georgia, serif",
                    fontWeight: 600,
                  }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-sm leading-[1.75]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section className="py-32 md:py-44" style={{ background: "var(--muted)" }}>
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          {/* Section label */}
          <div className="mb-14 flex items-center gap-4">
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
            <span
              className="text-xs font-medium uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                color: "var(--accent)",
              }}
            >
              How It Works
            </span>
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
          </div>

          <h2
            className="text-4xl md:text-5xl text-center leading-[1.2] tracking-[-0.01em] mb-20"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Up and running in minutes
          </h2>

          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            {steps.map((s) => (
              <div key={s.num}>
                <div
                  className="text-5xl md:text-6xl mb-6 leading-none"
                  style={{
                    fontFamily: "var(--font-playfair), Georgia, serif",
                    color: "var(--accent)",
                    opacity: 0.35,
                  }}
                >
                  {s.num}
                </div>
                <h3
                  className="text-xl mb-3"
                  style={{
                    fontFamily: "var(--font-playfair), Georgia, serif",
                    fontWeight: 600,
                  }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-sm leading-[1.75]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ─────────────────────────────────────────── */}
      <section className="py-32 md:py-44">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div
            className="py-16 md:py-20 text-center"
            style={{
              borderTop: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {/* Decorative quote mark */}
            <div
              className="text-7xl md:text-8xl leading-none mb-2"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: "var(--accent)",
              }}
            >
              &ldquo;
            </div>
            <blockquote
              className="text-2xl md:text-3xl leading-[1.5] max-w-3xl mx-auto mb-8"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                fontStyle: "italic",
              }}
            >
              For the first time since my father&apos;s diagnosis, I feel like I
              truly understand what&apos;s happening with his care — and I know
              exactly where to find every document when I need it.
            </blockquote>
            <cite
              className="text-xs font-medium uppercase tracking-[0.15em] not-italic"
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                color: "var(--muted-foreground)",
              }}
            >
              Sarah M. — Caring for a parent with Alzheimer&apos;s
            </cite>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <section className="py-32 md:py-44" style={{ background: "var(--muted)" }}>
        <div className="max-w-5xl mx-auto px-6 md:px-8 text-center">
          {/* Section label */}
          <div className="mb-10 flex items-center justify-center gap-4">
            <span className="h-px w-12 flex-shrink-0" style={{ background: "var(--border)" }} />
            <span
              className="text-xs font-medium uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                color: "var(--accent)",
              }}
            >
              Get Started Today
            </span>
            <span className="h-px w-12 flex-shrink-0" style={{ background: "var(--border)" }} />
          </div>

          <h2
            className="text-4xl md:text-5xl leading-[1.2] tracking-[-0.01em] mb-6"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Ready to simplify
            <br />
            <em>caregiving?</em>
          </h2>
          <p
            className="text-lg leading-[1.75] mb-12 max-w-lg mx-auto"
            style={{ color: "var(--muted-foreground)" }}
          >
            Join caregivers who trust Caregiver Co-Pilot to keep them informed,
            organized, and at ease — no matter what each day brings.
          </p>

          {userId ? (
            <Link href="/dashboard">
              <button className="btn-gold h-12 px-10 text-base min-h-[48px]">
                Go to Dashboard
              </button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <button className="btn-gold h-12 px-10 text-base min-h-[48px] min-w-[180px]">
                  Start for Free
                </button>
              </Link>
              <Link href="/sign-in">
                <button className="btn-outline-serif h-12 px-8 text-base min-h-[48px] min-w-[180px]">
                  Sign In
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto px-6 md:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <span
              className="text-lg"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Caregiver Co-Pilot
            </span>
            <div
              className="text-xs font-medium uppercase tracking-[0.1em]"
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                color: "var(--muted-foreground)",
              }}
            >
              © 2026 — Built with care
            </div>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-sm transition-colors duration-200"
                style={{ color: "var(--muted-foreground)" }}
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm transition-colors duration-200"
                style={{ color: "var(--muted-foreground)" }}
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
