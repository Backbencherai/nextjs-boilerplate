"use client";

/** Bhavan's Multiplayer mark: a saffron–white–green globe with a gold crown and an orbit ring. */
export function Logo({ size = 48, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={animated ? "logo-anim" : ""} aria-label="Bhavan's Multiplayer" role="img" style={{ overflow: "visible" }}>
      <defs>
        <clipPath id="lg-c">
          <circle cx="50" cy="54" r="33" />
        </clipPath>
      </defs>
      <g className="lg-globe">
        <circle cx="53" cy="58" r="34" fill="#16161d" />
        <g clipPath="url(#lg-c)">
          <rect x="10" y="20" width="80" height="24" fill="#ff9933" />
          <rect x="10" y="44" width="80" height="21" fill="#ffffff" />
          <rect x="10" y="65" width="80" height="25" fill="#138808" />
          <circle cx="50" cy="54.5" r="7" fill="none" stroke="#1f3a93" strokeWidth="2.2" />
          <path d="M26 30 C32 26 40 28 44 34 C40 40 30 40 26 30 Z M60 70 C66 64 76 66 78 74 C70 80 62 78 60 70 Z" fill="#ffffff55" />
        </g>
        <circle cx="50" cy="54" r="33" fill="none" stroke="#16161d" strokeWidth="4.5" />
      </g>
      <g className="lg-ring">
        <ellipse cx="50" cy="54" rx="47" ry="13" fill="none" stroke="#1f3a93" strokeWidth="3.5" transform="rotate(-18 50 54)" strokeDasharray="70 18" />
      </g>
      <g className="lg-crown">
        <path d="M33 26 L37 9 L45 19 L50 5 L55 19 L63 9 L67 26 Z" fill="#f2c31a" stroke="#16161d" strokeWidth="3.5" strokeLinejoin="round" />
        <circle cx="50" cy="19" r="2.6" fill="#d23a3a" />
      </g>
    </svg>
  );
}

export function Wordmark({ size = 1 }: { size?: number }) {
  return (
    <span className="display" style={{ fontSize: 18 * size, lineHeight: 0.9, display: "inline-flex", flexDirection: "column" }}>
      <span>BHAVAN&apos;S</span>
      <span style={{ color: "#1f3a93", fontSize: "0.72em" }}>MULTIPLAYER</span>
    </span>
  );
}
