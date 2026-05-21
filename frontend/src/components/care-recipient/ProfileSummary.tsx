type Condition = { name: string; icd10_code?: string | null; diagnosed_date?: string | null };
type Allergy = { substance: string; reaction?: string | null; severity?: string | null };

type ProfileSummaryProps = {
  displayName: string;
  dateOfBirth: string;
  sexAtBirth: string;
  conditions: Condition[];
  allergies: Allergy[];
  baselineNotes?: string | null;
  primaryProviderName?: string | null;
  primaryProviderPhone?: string | null;
  primaryProviderEmail?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  consentBasis: string;
};

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const MONO: React.CSSProperties = { fontFamily: 'var(--font-ibm-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' };

const severityStyle: Record<string, React.CSSProperties> = {
  mild:     { background: '#FEF9EC', color: '#8B6914', border: '1px solid #F3E0A0' },
  moderate: { background: '#FEF3ED', color: '#9A3412', border: '1px solid #F8C8B0' },
  severe:   { background: '#FEE8E8', color: '#7F1D1D', border: '1px solid #F4AAAA' },
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-xl mb-5"
      style={SERIF}
    >
      {children}
    </h3>
  );
}

function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.12em] mb-1" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
      {children}
    </p>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-8" style={{ borderBottom: '1px solid var(--border)' }}>
      {children}
    </div>
  );
}

export function ProfileSummary({
  dateOfBirth,
  sexAtBirth,
  conditions,
  allergies,
  baselineNotes,
  primaryProviderName,
  primaryProviderPhone,
  primaryProviderEmail,
  emergencyContactName,
  emergencyContactPhone,
  consentBasis,
}: ProfileSummaryProps) {
  const age = calcAge(dateOfBirth);

  return (
    <div>

      {/* Demographics */}
      <Section>
        <SectionHeading>Demographics</SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <MetaLabel>Date of Birth</MetaLabel>
            <p className="text-sm font-medium">{dateOfBirth}</p>
            <p className="text-xs mt-0.5" style={{ ...MONO, color: 'var(--muted-foreground)' }}>{age} years old</p>
          </div>
          <div>
            <MetaLabel>Sex at Birth</MetaLabel>
            <p className="text-sm font-medium capitalize">{sexAtBirth}</p>
          </div>
          <div>
            <MetaLabel>Consent Basis</MetaLabel>
            <p className="text-sm font-medium capitalize">{consentBasis.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </Section>

      {/* Conditions */}
      <Section>
        <SectionHeading>Conditions</SectionHeading>
        {conditions.length > 0 ? (
          <ul className="space-y-3">
            {conditions.map((c, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--accent)' }}
                />
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm">{c.name}</span>
                  {c.icd10_code && (
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ ...MONO, border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
                    >
                      {c.icd10_code}
                    </span>
                  )}
                  {c.diagnosed_date && (
                    <span className="text-xs" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
                      since {c.diagnosed_date}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm" style={{ ...MONO, color: 'var(--muted-foreground)', letterSpacing: '0.05em' }}>
            No conditions recorded
          </p>
        )}
      </Section>

      {/* Allergies */}
      <Section>
        <SectionHeading>Allergies</SectionHeading>
        {allergies.length > 0 ? (
          <ul className="space-y-3">
            {allergies.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: '#9A3412' }}
                />
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-medium">{a.substance}</span>
                  {a.reaction && (
                    <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      — {a.reaction}
                    </span>
                  )}
                  {a.severity && (
                    <span
                      className="text-xs px-2 py-0.5 rounded font-medium capitalize"
                      style={{
                        ...MONO,
                        ...(severityStyle[a.severity.toLowerCase()] ?? {
                          background: 'var(--muted)',
                          color: 'var(--muted-foreground)',
                          border: '1px solid var(--border)',
                        }),
                      }}
                    >
                      {a.severity}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm" style={{ ...MONO, color: 'var(--muted-foreground)', letterSpacing: '0.05em' }}>
            No allergies recorded
          </p>
        )}
      </Section>

      {/* Contacts */}
      {(primaryProviderName || emergencyContactName) && (
        <Section>
          <SectionHeading>Contacts</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {primaryProviderName && (
              <div>
                <MetaLabel>Primary Care Provider</MetaLabel>
                <p className="text-sm font-medium mb-1">{primaryProviderName}</p>
                {primaryProviderPhone && (
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{primaryProviderPhone}</p>
                )}
                {primaryProviderEmail && (
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{primaryProviderEmail}</p>
                )}
              </div>
            )}
            {emergencyContactName && (
              <div>
                <MetaLabel>Emergency Contact</MetaLabel>
                <p className="text-sm font-medium mb-1">{emergencyContactName}</p>
                {emergencyContactPhone && (
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{emergencyContactPhone}</p>
                )}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Baseline Notes */}
      {baselineNotes && (
        <div className="py-8">
          <SectionHeading>Baseline Notes</SectionHeading>
          <p
            className="text-sm leading-[1.85] whitespace-pre-line"
            style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', ...SERIF }}
          >
            {baselineNotes}
          </p>
        </div>
      )}
    </div>
  );
}
