"use client";

import { useEffect, useState } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Check } from "lucide-react";

const SERIF: React.CSSProperties = { fontFamily: "var(--font-playfair), Georgia, serif" };
const MONO: React.CSSProperties  = { fontFamily: "var(--font-ibm-plex-mono), monospace" };

export default function SettingsPage() {
  const { getToken } = useAuth();
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    async function checkStatus() {
      const token = await getToken();
      const res = await fetch(`${apiUrl}/auth/google/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarConnected(data.connected);
      }
    }
    checkStatus();
  }, [getToken]);

  async function handleDisconnect() {
    setLoading(true);
    const token = await getToken();
    await fetch(`${apiUrl}/auth/google/disconnect`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setCalendarConnected(false);
    setLoading(false);
  }

  async function handleConnect() {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/auth/google/connect`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      window.location.href = data.authorization_url;
    }
  }

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
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 transition-colors duration-200"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase tracking-[0.1em]" style={MONO}>
              Dashboard
            </span>
          </Link>
          <span className="text-xl tracking-tight hidden sm:block" style={SERIF}>
            Caregiver Co-Pilot
          </span>
          <UserButton />
        </div>
      </nav>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 md:px-8 pt-14 pb-10">
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px flex-1" style={{ background: "var(--border)" }} />
          <span className="text-xs font-medium uppercase tracking-[0.15em]" style={{ ...MONO, color: "var(--accent)" }}>
            Settings
          </span>
          <span className="h-px flex-1" style={{ background: "var(--border)" }} />
        </div>

        <h1 className="text-4xl md:text-5xl tracking-[-0.01em]" style={SERIF}>
          Account Settings
        </h1>
        <p className="mt-2 text-base leading-[1.75]" style={{ color: "var(--muted-foreground)" }}>
          Manage your integrations and preferences.
        </p>
      </div>

      {/* ── Divider ─────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 md:px-8">
        <div className="h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-6 md:px-8 py-12 space-y-px">

        {/* Google Calendar integration */}
        <div
          className="p-7 md:p-8 transition-all duration-200"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderTop: "2px solid var(--accent)",
            borderRadius: "8px",
            boxShadow: "0 1px 2px rgba(26,26,26,0.04)",
          }}
        >
          {/* Card header */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
            >
              <CalendarDays className="h-5 w-5" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h2 className="text-xl mb-1" style={{ ...SERIF, fontWeight: 600 }}>
                Google Calendar
              </h2>
              <p className="text-sm leading-[1.75]" style={{ color: "var(--muted-foreground)" }}>
                Connect Google Calendar to allow the assistant to set reminders and schedule follow-up appointments directly from your care conversations.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px mb-6" style={{ background: "var(--border)" }} />

          {/* Status & action */}
          {calendarConnected === null ? (
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
              />
              <span className="text-xs uppercase tracking-[0.1em]" style={{ ...MONO, color: "var(--muted-foreground)" }}>
                Checking status…
              </span>
            </div>
          ) : calendarConnected ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(74,124,89,0.12)", border: "1px solid rgba(74,124,89,0.3)" }}
                >
                  <Check className="h-3 w-3" style={{ color: "#4A7C59" }} />
                </div>
                <span className="text-sm font-medium" style={{ color: "#4A7C59" }}>Connected</span>
                <span className="text-xs uppercase tracking-[0.1em]" style={{ ...MONO, color: "var(--muted-foreground)" }}>
                  — Google Calendar
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="btn-outline-serif h-9 px-4 text-sm min-h-[36px] disabled:opacity-50"
              >
                {loading ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Not connected
              </p>
              <button
                onClick={handleConnect}
                disabled={loading}
                className="btn-gold h-9 px-5 text-sm min-h-[36px] disabled:opacity-50"
              >
                {loading ? "Connecting…" : "Connect Google Calendar"}
              </button>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
