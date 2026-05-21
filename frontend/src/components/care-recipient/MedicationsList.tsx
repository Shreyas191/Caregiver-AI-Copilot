import { Plus } from 'lucide-react';

type Medication = {
  id: string;
  display_name: string;
  rxnorm_code?: string | null;
  dose?: string | null;
  frequency?: string | null;
  route?: string | null;
  started_at: string;
  stopped_at?: string | null;
  prescribed_for?: string | null;
  prescriber?: string | null;
};

type MedicationsListProps = {
  medications: Medication[];
  onAddClick: () => void;
};

const MONO: React.CSSProperties = { fontFamily: 'var(--font-ibm-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' };

export function MedicationsList({ medications, onAddClick }: MedicationsListProps) {
  const active = medications.filter((m) => !m.stopped_at);

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl mb-1" style={SERIF}>Active Medications</h2>
          <p className="text-xs font-medium uppercase tracking-[0.12em]" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
            {active.length} medication{active.length !== 1 ? 's' : ''} currently active
          </p>
        </div>
        <button
          onClick={onAddClick}
          className="btn-outline-serif h-9 px-4 text-sm flex items-center gap-1.5 min-h-[36px]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      <div className="h-px mb-0" style={{ background: 'var(--border)' }} />

      {active.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-xl mb-2" style={SERIF}>No active medications</p>
          <p className="text-sm" style={{ ...MONO, color: 'var(--muted-foreground)', letterSpacing: '0.05em' }}>
            Add the first medication using the button above
          </p>
        </div>
      ) : (
        <ul>
          {active.map((med, i) => (
            <li
              key={med.id}
              className="py-5 flex items-start justify-between gap-4"
              style={{ borderBottom: i < active.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium mb-2">{med.display_name}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {med.dose && (
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={{ ...MONO, border: '1px solid var(--accent)', color: 'var(--accent)', background: 'rgba(184,134,11,0.05)' }}
                    >
                      {med.dose}
                    </span>
                  )}
                  {med.frequency && (
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full"
                      style={{ ...MONO, border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
                    >
                      {med.frequency}
                    </span>
                  )}
                  {med.route && med.route !== 'oral' && (
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full capitalize"
                      style={{ ...MONO, border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
                    >
                      {med.route}
                    </span>
                  )}
                </div>
                {med.prescribed_for && (
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    For: {med.prescribed_for}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs uppercase tracking-[0.1em]" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
                  Since {med.started_at}
                </p>
                {med.prescriber && (
                  <p className="text-xs mt-0.5" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
                    {med.prescriber}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
