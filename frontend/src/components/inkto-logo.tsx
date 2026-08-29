'use client';

/**
 * InktoLogo — The original Inkto icon (August 21 brand mark).
 * Precision SVG featuring the pen-nib facet with horizontal document lines.
 */

interface Props {
  size?: number;
  animate?: boolean;
  color?: string;
}

export function InktoLogo({ size = 26, animate = false, color = '#5A45FF' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Inkto"
      style={animate ? { animation: 'pulse 1.5s ease-in-out' } : undefined}
    >
      <path d="M16 50 L36 28 L54 38 L54 62 L36 72 Z" fill={color} />
      <circle cx="30" cy="50" r="3.5" fill="white" />
      <line x1="16" y1="50" x2="36" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="36" y1="28" x2="36" y2="72" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <rect x="57" y="30" width="28" height="7" rx="3.5" fill={color} />
      <rect x="57" y="46.5" width="26" height="7" rx="3.5" fill={color} />
      <rect x="57" y="63" width="20" height="7" rx="3.5" fill={color} />
    </svg>
  );
}

/** Wordmark: original logo icon + bold "Inkto" text */
export function InktoWordmark({ size = 26, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <InktoLogo size={size} animate={animate} />
      <span
        style={{
          fontWeight: 700,
          fontSize: Math.round(size * 0.7),
          letterSpacing: '-0.5px',
          color: '#0F172A',
          lineHeight: 1,
          userSelect: 'none',
          fontFamily: '"Poppins", -apple-system, sans-serif',
        }}
      >
        inkto
      </span>
    </div>
  );
}
