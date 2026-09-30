import { useId } from 'react';

type Mood = 'happy' | 'sad' | 'wait';

// Zero Share's cloud buddy. Purely decorative, so it's hidden from screen readers.
export default function Mascot({
  mood = 'happy',
  size = 120,
  className = '',
}: {
  mood?: Mood;
  size?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, '');
  const body = `mascot-body-${id}`;
  const shine = `mascot-shine-${id}`;

  return (
    <svg
      className={`mascot ${className}`}
      width={size}
      height={size * 0.85}
      viewBox="0 0 200 170"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={body} x1="0" y1="10" x2="0" y2="165" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#C6EFFB" />
          <stop offset="1" stopColor="#62C6EA" />
        </linearGradient>
        <radialGradient id={shine} cx="0.35" cy="0.25" r="0.6">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="102" cy="162" rx="62" ry="6" fill="#15201E" opacity="0.08" />

      <g fill={`url(#${body})`}>
        <circle cx="62" cy="72" r="40" />
        <circle cx="106" cy="52" r="46" />
        <circle cx="150" cy="78" r="38" />
        <circle cx="40" cy="112" r="33" />
        <circle cx="164" cy="116" r="32" />
        <circle cx="76" cy="124" r="34" />
        <circle cx="130" cy="124" r="34" />
        <rect x="44" y="78" width="120" height="70" rx="30" />
      </g>
      <ellipse cx="86" cy="58" rx="46" ry="30" fill={`url(#${shine})`} />

      {/* cheeks */}
      <ellipse cx="66" cy="116" rx="11" ry="6.5" fill="#FF9DB4" opacity="0.45" />
      <ellipse cx="140" cy="116" rx="11" ry="6.5" fill="#FF9DB4" opacity="0.45" />

      {/* eyes */}
      {mood === 'wait' ? (
        <g stroke="#15201E" strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M76 101 q7 -6 14 0" />
          <path d="M116 101 q7 -6 14 0" />
        </g>
      ) : (
        <g>
          <ellipse cx="83" cy="99" rx="7.5" ry="9.5" fill="#15201E" />
          <ellipse cx="123" cy="99" rx="7.5" ry="9.5" fill="#15201E" />
          <circle cx="85.5" cy="95.5" r="2.6" fill="#fff" />
          <circle cx="125.5" cy="95.5" r="2.6" fill="#fff" />
        </g>
      )}

      {/* mouth */}
      {mood === 'happy' && (
        <path d="M91 118 q12 12 24 0" stroke="#15201E" strokeWidth="5" strokeLinecap="round" fill="none" />
      )}
      {mood === 'sad' && (
        <path d="M92 126 q11 -10 22 0" stroke="#15201E" strokeWidth="5" strokeLinecap="round" fill="none" />
      )}
      {mood === 'wait' && <ellipse cx="103" cy="121" rx="6" ry="7" fill="#15201E" />}
    </svg>
  );
}
