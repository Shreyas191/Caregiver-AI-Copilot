type Episode = {
  id: string;
  started_at: string;
  caregiver_description: string;
  agent_assessment?: string | null;
  urgency_level: string;
  status: string;
  symptoms: Array<{ name?: string; [key: string]: unknown }>;
};

const MONO: React.CSSProperties = { fontFamily: 'var(--font-ibm-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' };

const urgencyStyle: Record<string, React.CSSProperties> = {
  routine:   { background: 'var(--muted)',  color: 'var(--muted-foreground)', border: '1px solid var(--border)' },
  same_day:  { background: '#FEF9EC', color: '#8B6914', border: '1px solid #F3E0A0' },
  urgent:    { background: '#FEF3ED', color: '#9A3412', border: '1px solid #F8C8B0' },
  emergency: { background: '#FEE8E8', color: '#7F1D1D', border: '1px solid #F4AAAA' },
};

const statusStyle: Record<string, React.CSSProperties> = {
  open:       { background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' },
  monitoring: { background: '#F5F3FF', color: '#5B21B6', border: '1px solid #DDD6FE' },
  resolved:   { background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' },
  escalated:  { background: '#FEE8E8', color: '#7F1D1D', border: '1px solid #F4AAAA' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function EpisodesList({ episodes }: { episodes: Episode[] }) {
  if (episodes.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-xl mb-2" style={SERIF}>No episodes recorded</p>
        <p className="text-sm" style={{ ...MONO, color: 'var(--muted-foreground)', letterSpacing: '0.05em' }}>
          Episodes will appear here once logged via chat
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl mb-1" style={SERIF}>Care Episodes</h2>
        <p className="text-xs font-medium uppercase tracking-[0.12em]" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
          {episodes.length} episode{episodes.length !== 1 ? 's' : ''} logged
        </p>
      </div>

      <div className="h-px" style={{ background: 'var(--border)' }} />

      <ul>
        {episodes.map((ep, i) => (
          <li
            key={ep.id}
            className="py-6"
            style={{ borderBottom: i < episodes.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            {/* Date + badges row */}
            <div className="flex items-center justify-between gap-4 mb-3">
              <p className="text-xs font-medium uppercase tracking-[0.1em]" style={{ ...MONO, color: 'var(--muted-foreground)' }}>
                {formatDate(ep.started_at)}
              </p>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full capitalize"
                  style={{
                    ...MONO,
                    ...(urgencyStyle[ep.urgency_level] ?? urgencyStyle.routine),
                  }}
                >
                  {ep.urgency_level.replace(/_/g, ' ')}
                </span>
                <span
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full capitalize"
                  style={{
                    ...MONO,
                    ...(statusStyle[ep.status] ?? statusStyle.resolved),
                  }}
                >
                  {ep.status}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm leading-[1.75] mb-3" style={{ color: 'var(--foreground)' }}>
              {ep.caregiver_description}
            </p>

            {/* AI assessment */}
            {ep.agent_assessment && (
              <div
                className="mt-3 pl-4 text-sm leading-[1.75]"
                style={{ borderLeft: '2px solid var(--border)', color: 'var(--muted-foreground)', fontStyle: 'italic' }}
              >
                {ep.agent_assessment}
              </div>
            )}

            {/* Symptoms */}
            {ep.symptoms.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ep.symptoms.map((s, j) => (
                  <span
                    key={j}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ ...MONO, border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
                  >
                    {s.name ?? String(s)}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
