'use client';

/**
 * InktoLogo — The pen-nib SVG wordmark.
 *
 * animate=true  → stroke-in animation (0.6s, ease-out). Use ONCE per session
 *                 on the first screen the user sees.
 * animate=false → static, for nav bars and repeated occurrences.
 *
 * The animation class is defined in globals.css and respects
 * prefers-reduced-motion — do not duplicate it here.
 */

interface Props {
  /** Pixel height of the SVG. Width scales proportionally. */
  size?: number;
  /** Play the stroke-in animation. Default false. */
  animate?: boolean;
  /** Ink Black by default — override for light-on-dark contexts. */
  color?: string;
}

export function InktoLogo({ size = 28, animate = false, color = '#0B0D12' }: Props) {
  const accentColor = '#24467A'; // Ink Blue

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Inkto"
    >
      {/*
        Pen nib — two angled faces meeting at the tip, with a slit down the centre.
        All strokes are drawn on a 56×56 grid so the nib is legible at 24px.
      */}

      {/* Left face of nib */}
      <path
        d="M28 8 L10 40 L28 36 Z"
        stroke={accentColor}
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill={accentColor}
        fillOpacity="0.12"
        className={animate ? 'nib-path' : undefined}
        style={animate ? undefined : { strokeDashoffset: 0 }}
      />

      {/* Right face of nib */}
      <path
        d="M28 8 L46 40 L28 36 Z"
        stroke={accentColor}
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill={accentColor}
        fillOpacity="0.06"
        className={animate ? 'nib-path' : undefined}
        style={animate ? { animationDelay: '0.08s' } : { strokeDashoffset: 0 }}
      />

      {/* Centre slit */}
      <path
        d="M28 20 L28 36"
        stroke={accentColor}
        strokeWidth="1.6"
        strokeLinecap="round"
        className={animate ? 'nib-path' : undefined}
        style={animate ? { animationDelay: '0.22s' } : { strokeDashoffset: 0 }}
      />

      {/* Ink reservoir (horizontal flat at top of nib) */}
      <path
        d="M20 14 L36 14"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="round"
        className={animate ? 'nib-path' : undefined}
        style={animate ? { animationDelay: '0.34s' } : { strokeDashoffset: 0 }}
      />

      {/* Nib tip dot — ink bead. Appears last, as if the stroke just landed. */}
      <circle
        cx="28"
        cy="40"
        r="2.4"
        fill={accentColor}
        className={animate ? 'nib-dot' : undefined}
      />
    </svg>
  );
}

/** Wordmark: nib + "Inkto" text side by side */
export function InktoWordmark({ size = 28, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <InktoLogo size={size} animate={animate} />
      <span
        style={{
          fontFamily: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
          fontSize: size * 0.72,
          fontWeight: 700,
          color: '#0B0D12',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        Inkto
      </span>
    </div>
  );
}
