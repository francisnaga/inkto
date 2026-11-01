'use client';

import React from 'react';

/**
 * InktoLogo — Official Inkto brand mark.
 * Monochromatic geometric vector mark matching Android app drawables and Google Play store icon.
 */

interface Props {
  size?: number;
  animate?: boolean;
  color?: string;
  bg?: string;
  variant?: 'squircle' | 'squircle-dark' | 'mark';
  className?: string;
  style?: React.CSSProperties;
}

export function InktoLogo({
  size = 28,
  animate = false,
  color = '#0060FF',
  bg,
  variant = 'squircle',
  className,
  style,
}: Props) {
  if (variant === 'squircle' || variant === 'squircle-dark') {
    const squircleBg = bg || (variant === 'squircle-dark' ? '#0E0F12' : '#0060FF');
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Inkto"
        className={className}
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          flexShrink: 0,
          ...(animate ? { animation: 'pulse 1.5s ease-in-out' } : {}),
          ...style,
        }}
      >
        {/* Vibrant Blue or Obsidian rounded squircle */}
        <rect width="512" height="512" rx="114" fill={squircleBg} />
        {/* Centered Inkto Symbol */}
        <g transform="translate(256, 256) scale(0.38) translate(-512, -512)">
          <path
            d="M 402,426.5 L 402,661.5 L 622,801.5 L 622,566.5 Z"
            fill="#FFFFFF"
            stroke="#FFFFFF"
            strokeWidth="32"
            strokeLinejoin="round"
          />
          <path
            d="M 402,222.5 L 402,334.5 L 622,474.5 L 622,362.5 Z"
            fill="#FFFFFF"
            stroke="#FFFFFF"
            strokeWidth="32"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    );
  }

  // Pure vector mark
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Inkto"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...(animate ? { animation: 'pulse 1.5s ease-in-out' } : {}),
        ...style,
      }}
    >
      <path
        d="M 402,426.5 L 402,661.5 L 622,801.5 L 622,566.5 Z"
        fill={color}
        stroke={color}
        strokeWidth="28"
        strokeLinejoin="round"
      />
      <path
        d="M 402,222.5 L 402,334.5 L 622,474.5 L 622,362.5 Z"
        fill={color}
        stroke={color}
        strokeWidth="28"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** InktoAppIcon: Pre-configured squircle app icon */
export function InktoAppIcon({ size = 32, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return <InktoLogo size={size} variant="squircle" className={className} style={style} />;
}

/** Wordmark: official logo icon + bold "Inkto" text */
export function InktoWordmark({
  size = 28,
  animate = false,
  color = '#111827',
  variant = 'squircle',
}: {
  size?: number;
  animate?: boolean;
  color?: string;
  variant?: 'mark' | 'squircle' | 'squircle-dark';
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <InktoLogo size={size} animate={animate} color={color} variant={variant} />
      <span
        style={{
          fontWeight: 800,
          fontSize: Math.round(size * 0.72),
          letterSpacing: '-0.4px',
          color: color,
          lineHeight: 1,
          userSelect: 'none',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        Inkto
      </span>
    </div>
  );
}
