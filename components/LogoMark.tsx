"use client";

/**
 * The A×D mark: hand-lettered A (Adarsh blue) and D (Dewanshi red) leaning on a little gold heart,
 * on an ink-outlined paper tile with a hard shadow. `animated` plays the opening animation.
 */
export function LogoMark({ size = 64, animated = false, tile = true }: { size?: number; animated?: boolean; tile?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={animated ? "lm lm-anim" : "lm"} aria-label="A×D" role="img">
      {tile && (
        <g className="lm-tile">
          <rect x="9" y="10" width="86" height="86" rx="24" fill="#14140f" />
          <rect x="5" y="5" width="86" height="86" rx="24" fill="#fbfaf6" stroke="#14140f" strokeWidth="4.5" />
        </g>
      )}
      <g className="lm-heart">
        <path d="M48 76 C30 63 25 53 31 45 C36 39 44 41 48 47 C52 41 60 39 65 45 C71 53 66 63 48 76 Z" fill="#f2c31a" stroke="#14140f" strokeWidth="4" strokeLinejoin="round" />
      </g>
      <g className="lm-a">
        <text x="30" y="62" textAnchor="middle" fontFamily="var(--font-display), 'Luckiest Guy', sans-serif" fontSize="44" fill="#2b5a9b" stroke="#14140f" strokeWidth="4" paintOrder="stroke" transform="rotate(-8 30 50)">
          A
        </text>
      </g>
      <g className="lm-d">
        <text x="67" y="62" textAnchor="middle" fontFamily="var(--font-display), 'Luckiest Guy', sans-serif" fontSize="44" fill="#c0342a" stroke="#14140f" strokeWidth="4" paintOrder="stroke" transform="rotate(7 67 50)">
          D
        </text>
      </g>
    </svg>
  );
}
