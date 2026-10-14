import type { ReactNode } from 'react';
import type { AvatarId } from '@/lib/avatars';

export interface AvatarArt {
  /** Disc gradient, light to deep. `to` also fills the cut-outs of the glyph. */
  from: string;
  to: string;
  /** Drawn on a 48 × 48 canvas in white; `ink` is the deep disc colour. */
  glyph: (ink: string) => ReactNode;
}

const GEAR_TEETH = [0, 45, 90, 135, 180, 225, 270, 315];

export const AVATAR_ART: Record<AvatarId, AvatarArt> = {
  robot: {
    from: '#8b7cf8',
    to: '#5830d2',
    glyph: (ink) => (
      <>
        <path d="M24 17v-4.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="11" r="2.2" fill="#fff" />
        <rect x="9.5" y="22.5" width="4" height="7" rx="2" fill="#fff" opacity="0.7" />
        <rect x="34.5" y="22.5" width="4" height="7" rx="2" fill="#fff" opacity="0.7" />
        <rect x="13" y="17" width="22" height="18" rx="6" fill="#fff" />
        <circle cx="19.5" cy="25" r="2.6" fill={ink} />
        <circle cx="28.5" cy="25" r="2.6" fill={ink} />
        <rect x="20" y="30" width="8" height="1.8" rx="0.9" fill={ink} opacity="0.55" />
      </>
    ),
  },
  rocket: {
    from: '#fb7185',
    to: '#e11d48',
    glyph: (ink) => (
      <g transform="rotate(38 24 24)">
        <path
          d="M16.5 25.5l-4.5 6v4l4.5-2.2zM31.5 25.5l4.5 6v4l-4.5-2.2z"
          fill="#fff"
          opacity="0.7"
        />
        <path d="M21 33h6l-3 6.5z" fill="#fde68a" />
        <path d="M24 8c5 4 7.5 9.6 7.5 15.2V33h-15v-9.8C16.5 17.6 19 12 24 8z" fill="#fff" />
        <circle cx="24" cy="21" r="3.2" fill={ink} />
      </g>
    ),
  },
  planet: {
    from: '#60a5fa',
    to: '#1d4ed8',
    glyph: (ink) => (
      <g transform="rotate(-18 24 24)">
        <ellipse cx="24" cy="24" rx="17" ry="5.5" stroke="#fff" strokeWidth="2.2" opacity="0.6" />
        <circle cx="24" cy="24" r="9.5" fill="#fff" />
        <path
          d="M15.2 20.5h12M19 27.5h13.5"
          stroke={ink}
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path d="M7 24a17 5.5 0 0 0 34 0" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    ),
  },
  star: {
    from: '#fbbf24',
    to: '#ea580c',
    glyph: () => (
      <>
        <path
          d="M24 12l3.3 8.5 9.1.5-7.1 5.8 2.3 8.8L24 30.6l-7.6 5 2.3-8.8-7.1-5.8 9.1-.5z"
          fill="#fff"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <circle cx="37" cy="13" r="1.6" fill="#fff" opacity="0.8" />
        <circle cx="11" cy="35" r="1.2" fill="#fff" opacity="0.7" />
      </>
    ),
  },
  bolt: {
    from: '#e879f9',
    to: '#a21caf',
    glyph: () => (
      <path
        d="M27 9L14.5 26.5H23L20.5 39 33.5 21.5H25z"
        fill="#fff"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    ),
  },
  atom: {
    from: '#2dd4bf',
    to: '#0f766e',
    glyph: () => (
      <>
        <g stroke="#fff" strokeWidth="2" opacity="0.9">
          <ellipse cx="24" cy="24" rx="15.5" ry="6" />
          <ellipse cx="24" cy="24" rx="15.5" ry="6" transform="rotate(60 24 24)" />
          <ellipse cx="24" cy="24" rx="15.5" ry="6" transform="rotate(120 24 24)" />
        </g>
        <circle cx="24" cy="24" r="3.4" fill="#fff" />
      </>
    ),
  },
  bulb: {
    from: '#4ade80',
    to: '#15803d',
    glyph: (ink) => (
      <>
        <path
          d="M24 9.5a10 10 0 0 0-5.8 18.1c1 .7 1.6 1.8 1.6 3v.4h8.4v-.4c0-1.2.6-2.3 1.6-3A10 10 0 0 0 24 9.5z"
          fill="#fff"
        />
        <path
          d="M21 21.5l3 3 3-3M24 24.5V31"
          stroke={ink}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.75"
        />
        <rect x="19.8" y="33" width="8.4" height="2.2" rx="1.1" fill="#fff" opacity="0.75" />
        <rect x="21.2" y="36.6" width="5.6" height="2.2" rx="1.1" fill="#fff" opacity="0.75" />
      </>
    ),
  },
  gear: {
    from: '#94a3b8',
    to: '#475569',
    glyph: (ink) => (
      <>
        {GEAR_TEETH.map((angle) => (
          <rect
            key={angle}
            x="21"
            y="9"
            width="6"
            height="8"
            rx="1.8"
            fill="#fff"
            transform={`rotate(${angle} 24 24)`}
          />
        ))}
        <circle cx="24" cy="24" r="11" fill="#fff" />
        <circle cx="24" cy="24" r="4.6" fill={ink} />
      </>
    ),
  },
  chip: {
    from: '#818cf8',
    to: '#3730a3',
    glyph: (ink) => (
      <>
        <path
          d="M19 10v5M24 10v5M29 10v5M19 33v5M24 33v5M29 33v5M10 19h5M10 24h5M10 29h5M33 19h5M33 24h5M33 29h5"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.75"
        />
        <rect x="14.5" y="14.5" width="19" height="19" rx="4" fill="#fff" />
        <rect x="20" y="20" width="8" height="8" rx="2" fill={ink} />
      </>
    ),
  },
  compass: {
    from: '#f472b6',
    to: '#be185d',
    glyph: (ink) => (
      <>
        <circle cx="24" cy="24" r="14" fill="#fff" />
        <circle cx="24" cy="24" r="10.5" stroke={ink} strokeWidth="1.2" opacity="0.25" />
        <path d="M31 17l-4.5 9.5-5-5z" fill={ink} />
        <path d="M17 31l4.5-9.5 5 5z" fill={ink} opacity="0.4" />
        <circle cx="24" cy="24" r="1.4" fill="#fff" />
      </>
    ),
  },
  satellite: {
    from: '#22d3ee',
    to: '#0369a1',
    glyph: (ink) => (
      <>
        <g transform="rotate(-45 24 22)">
          <rect x="7" y="18.5" width="10" height="7" rx="1.5" fill="#fff" opacity="0.75" />
          <rect x="31" y="18.5" width="10" height="7" rx="1.5" fill="#fff" opacity="0.75" />
          <path d="M17 22h14" stroke="#fff" strokeWidth="2" />
          <rect x="19.5" y="15.5" width="9" height="13" rx="2.5" fill="#fff" />
          <circle cx="24" cy="22" r="2" fill={ink} />
        </g>
        <path
          d="M30 37.5a7.5 7.5 0 0 0 7.5-7.5"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M30 33.5a3.5 3.5 0 0 0 3.5-3.5"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),
  },
  puzzle: {
    from: '#fb923c',
    to: '#c2410c',
    glyph: () => (
      <path
        d="M13 19.5h5.2a3.6 3.6 0 1 1 6.6 0H30v5.2a3.6 3.6 0 1 1 0 6.6v5.2H13z"
        fill="#fff"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinejoin="round"
        transform="translate(0.7 -1.5)"
      />
    ),
  },
};
