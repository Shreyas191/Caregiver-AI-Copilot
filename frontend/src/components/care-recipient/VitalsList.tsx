type Vital = {
  id: string;
  type: string;
  value_numeric?: number | null;
  value_systolic?: number | null;
  value_diastolic?: number | null;
  value_text?: string | null;
  unit: string;
  recorded_at: string;
  notes?: string | null;
};

const MONO: React.CSSProperties = { fontFamily: 'var(--font-ibm-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' };

const typeLabels: Record<string, string> = {
  blood_pressure:    'Blood Pressure',
  heart_rate:        'Heart Rate',
  glucose:           'Glucose',
  weight:            'Weight',
  temperature:       'Temperature',
  oxygen_saturation: 'O₂ Saturation',
  respiratory_rate:  'Respiratory Rate',
  pain_score:        'Pain Score',
};

function formatValue(v: Vital): string {
  if (v.type === 'blood_pressure' && v.value_systolic != null && v.value_diastolic != null) {
    return `${v.value_systolic}/${v.value_diastolic}`;
  }
  if (v.value_numeric != null) return String(v.value_numeric);
  if (v.value_text) return v.value_text;
  return '—';
}

function formatUnit(v: Vital): string {
  if (v.type === 'blood_pressure') return 'mmHg';
  return v.unit ?? '';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function VitalsList({ vitals }: { vitals: Vital[] }) {
  if (vitals.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-xl mb-2" style={SERIF}>No vitals recorded</p>
        <p className="text-sm" style={{ ...MONO, color: 'var(--muted-foreground)', letterSpacing: '0.05em' }}>
          Vitals will appear here once added
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl mb-1" style={SERIF}>Recent Vitals</h2>
        <p className="text-xs font-medium uppercase tracking-[0.12em]" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
          {vitals.length} reading{vitals.length !== 1 ? 's' : ''} recorded
        </p>
      </div>

      <div className="h-px" style={{ background: 'var(--border)' }} />

      <ul>
        {vitals.map((v, i) => (
          <li
            key={v.id}
            className="py-5 flex items-center justify-between gap-4"
            style={{ borderBottom: i < vitals.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium uppercase tracking-[0.12em] mb-2"
                style={{ ...MONO, color: 'var(--accent)' }}
              >
                {typeLabels[v.type] ?? v.type.replace(/_/g, ' ')}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl" style={SERIF}>{formatValue(v)}</span>
                <span className="text-sm" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
                  {formatUnit(v)}
                </span>
              </div>
              {v.notes && (
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{v.notes}</p>
              )}
            </div>

            <div className="text-right shrink-0">
              <p className="text-xs uppercase tracking-[0.08em]" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
                {formatDate(v.recorded_at)}
              </p>
              <p className="text-xs mt-0.5" style={{ ...MONO, color: 'var(--muted-foreground)', opacity: 0.7 }}>
                {formatTime(v.recorded_at)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
