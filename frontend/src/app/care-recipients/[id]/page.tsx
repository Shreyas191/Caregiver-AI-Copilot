'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Plus } from 'lucide-react';

import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProfileSummary } from '@/components/care-recipient/ProfileSummary';
import { MedicationsList } from '@/components/care-recipient/MedicationsList';
import { VitalsList } from '@/components/care-recipient/VitalsList';
import { EpisodesList } from '@/components/care-recipient/EpisodesList';
import { MedicationForm } from '@/components/medications/MedicationForm';
import { UploadButton } from '@/components/documents/UploadButton';

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
};
const SERIF: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), Georgia, serif',
};

export default function CareRecipientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [medDialogOpen, setMedDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const fetchDocuments = useCallback(async () => {
    const token = await getToken();
    if (!token || !id) return;
    const base = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000') + '/api/v1';
    try {
      const res = await fetch(`${base}/care-recipients/${id}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDocuments(await res.json());
    } catch { /* non-critical */ }
  }, [getToken, id]);

  const fetchAll = useCallback(async () => {
    const token = await getToken();
    if (!token || !id) return;
    const [profileRes, medsRes, vitalsRes, episodesRes] = await Promise.allSettled([
      api.careRecipients.get(token, id),
      api.careRecipients.medications(token, id),
      api.careRecipients.vitals(token, id, 10),
      api.careRecipients.episodes(token, id, 5),
    ]);
    if (profileRes.status === 'fulfilled') setProfile(profileRes.value);
    if (medsRes.status === 'fulfilled') setMedications(medsRes.value ?? []);
    if (vitalsRes.status === 'fulfilled') setVitals(vitalsRes.value ?? []);
    if (episodesRes.status === 'fulfilled') setEpisodes(episodesRes.value ?? []);
  }, [getToken, id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAll(), fetchDocuments()]).finally(() => setLoading(false));
  }, [fetchAll, fetchDocuments]);

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm uppercase tracking-[0.12em]" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
            Loading profile…
          </p>
        </div>
      </div>
    );
  }

  /* ── Not found ───────────────────────────────────────────── */
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <p className="text-2xl mb-3" style={SERIF}>Care recipient not found.</p>
          <Link href="/dashboard">
            <button className="btn-outline-serif h-9 px-5 text-sm">← Back to Dashboard</button>
          </Link>
        </div>
      </div>
    );
  }

  const activeMedCount = medications.filter((m) => !m.stopped_at).length;
  const age = calcAge(profile.date_of_birth);

  const tabs = [
    { id: 'profile',     label: 'Profile' },
    { id: 'medications', label: activeMedCount > 0 ? `Medications (${activeMedCount})` : 'Medications' },
    { id: 'vitals',      label: 'Vitals' },
    { id: 'episodes',    label: 'Episodes' },
    { id: 'documents',   label: 'Documents' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

      {/* ── Navigation ────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(250,250,248,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-8 flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2 transition-colors duration-200" style={{ color: 'var(--muted-foreground)' }}>
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase tracking-[0.1em]" style={MONO}>Dashboard</span>
          </Link>
          <span className="text-xl tracking-tight hidden sm:block" style={SERIF}>
            Caregiver Co-Pilot
          </span>
          <div className="flex items-center gap-4">
            <Link href={`/chat/${id}`}>
              <button className="btn-gold h-9 px-4 text-sm flex items-center gap-1.5 min-h-[36px]">
                <MessageSquare className="h-3.5 w-3.5" />
                Open Chat
              </button>
            </Link>
            <UserButton />
          </div>
        </div>
      </nav>

      {/* ── Profile Hero ──────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-8 pt-12 pb-8">
        <h1 className="text-4xl md:text-5xl tracking-[-0.01em] mb-3" style={SERIF}>
          {profile.display_name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5">
          <span className="text-xs font-medium uppercase tracking-[0.12em]" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
            {age} yrs · {profile.sex_at_birth === 'female' ? 'Female' : profile.sex_at_birth === 'male' ? 'Male' : profile.sex_at_birth}
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.12em]" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
            DOB {profile.date_of_birth}
          </span>
          {profile.consent_revoked_at && (
            <span
              className="text-xs font-medium uppercase tracking-[0.1em] px-2.5 py-0.5 rounded-full"
              style={{ ...MONO, border: '1px solid var(--border)', color: 'var(--muted-foreground)', background: 'var(--muted)' }}
            >
              Consent Revoked
            </span>
          )}
        </div>

        {(profile.conditions ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(profile.conditions as Array<{ name: string }>).map((c, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-0.5 rounded-full"
                style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', background: 'var(--muted)' }}
              >
                {c.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Tab Bar ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <div className="flex gap-1 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="pb-3 pt-1 px-1 mr-5 text-xs font-medium uppercase tracking-[0.12em] whitespace-nowrap transition-all duration-200 shrink-0"
              style={{
                ...MONO,
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--muted-foreground)',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 md:px-8 py-10">

        {activeTab === 'profile' && (
          <ProfileSummary
            displayName={profile.display_name}
            dateOfBirth={profile.date_of_birth}
            sexAtBirth={profile.sex_at_birth}
            conditions={profile.conditions ?? []}
            allergies={profile.allergies ?? []}
            baselineNotes={profile.baseline_notes}
            primaryProviderName={profile.primary_provider_name}
            primaryProviderPhone={profile.primary_provider_phone}
            primaryProviderEmail={profile.primary_provider_email}
            emergencyContactName={profile.emergency_contact_name}
            emergencyContactPhone={profile.emergency_contact_phone}
            consentBasis={profile.consent_basis}
          />
        )}

        {activeTab === 'medications' && (
          <MedicationsList
            medications={medications}
            onAddClick={() => setMedDialogOpen(true)}
          />
        )}

        {activeTab === 'vitals' && <VitalsList vitals={vitals} />}

        {activeTab === 'episodes' && <EpisodesList episodes={episodes} />}

        {activeTab === 'documents' && (
          <DocumentsTab
            id={id}
            documents={documents}
            getToken={getToken}
            onUploadComplete={fetchDocuments}
          />
        )}
      </main>

      {/* ── Add Medication Dialog ─────────────────────────────── */}
      <Dialog open={medDialogOpen} onOpenChange={setMedDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle style={SERIF}>Add Medication</DialogTitle>
            <DialogDescription>
              Search for a medication and fill in the prescription details.
            </DialogDescription>
          </DialogHeader>
          <MedicationForm
            careRecipientId={id}
            onSuccess={() => {
              setMedDialogOpen(false);
              fetchAll();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Documents Tab ──────────────────────────────────────────── */
function DocumentsTab({
  id,
  documents,
  getToken,
  onUploadComplete,
}: {
  id: string;
  documents: any[];
  getToken: () => Promise<string | null>;
  onUploadComplete: () => void;
}) {
  const MONO: React.CSSProperties = { fontFamily: 'var(--font-ibm-plex-mono), monospace' };
  const SERIF: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl mb-1" style={SERIF}>Clinical Documents</h2>
          <p className="text-sm leading-[1.75]" style={{ color: 'var(--muted-foreground)' }}>
            Upload lab reports, discharge summaries, or after-visit notes. The AI can answer questions about uploaded documents.
          </p>
        </div>
        <div className="shrink-0 mt-1">
          <UploadButton careRecipientId={id} onUploadComplete={onUploadComplete} />
        </div>
      </div>

      <div className="h-px mb-8" style={{ background: 'var(--border)' }} />

      {documents.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-xl mb-2" style={SERIF}>No documents yet</p>
          <p className="text-sm" style={{ ...MONO, color: 'var(--muted-foreground)', letterSpacing: '0.05em' }}>
            Upload a PDF or image to get started
          </p>
        </div>
      ) : (
        <ul className="space-y-0">
          {documents.map((doc, i) => {
            const statusColor =
              doc.status === 'indexed' ? '#4A7C59'
              : doc.status === 'failed' ? '#9A3412'
              : '#8B6914';

            return (
              <li
                key={doc.id}
                className="flex items-center justify-between py-4 gap-4"
                style={{ borderBottom: i < documents.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate mb-1" style={{ color: 'var(--foreground)' }}>
                    {doc.original_filename}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs uppercase tracking-[0.1em]" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
                      {doc.document_type}
                    </span>
                    <span className="text-xs" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
                      {(doc.file_size_bytes / 1024).toFixed(0)} KB
                    </span>
                    <span className="text-xs font-medium uppercase tracking-[0.08em]" style={{ ...MONO, color: statusColor }}>
                      {doc.status}
                    </span>
                    <span className="text-xs" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
                      {new Date(doc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const token = await getToken();
                    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
                    const res = await fetch(
                      `${base}/api/v1/care-recipients/${id}/documents/${doc.id}/download`,
                      { headers: { Authorization: `Bearer ${token}` } },
                    );
                    if (res.ok) {
                      const { url } = await res.json();
                      window.open(url, '_blank');
                    }
                  }}
                  className="text-xs font-medium uppercase tracking-[0.1em] transition-colors duration-200 shrink-0"
                  style={{ ...MONO, color: 'var(--accent)' }}
                >
                  View
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
