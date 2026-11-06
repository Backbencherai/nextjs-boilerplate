"use client";
/**
 * The Bharatiya Vidya Bhavan emblem, drawn as crisp vector art: a ring of lotus petals, the navy ring with the
 * name in Hindi and English, the lamp of learning inside a temple arch, the chakra, and "अमृतं तु विद्या /
 * Knowledge is Nectar". With `animated`, the petals bloom, the ring draws in and the lamp lights up.
 */
const NAVY = "#2b3990";

function Swastika({ x, y, s = 7 }: { x: number; y: number; s?: number }) {
  const a = s;
  const b = s * 0.55;
  return (
    <g transform={`translate(${x} ${y})`} stroke={NAVY} strokeWidth={s * 0.32} fill="none" strokeLinecap="square">
      <path d={`M0 ${-a} V${a} M${-a} 0 H${a} M0 ${-a} H${b} M${a} 0 V${b} M0 ${a} H${-b} M${-a} 0 V${-b}`} />
    </g>
  );
}

const DEVA = "'Noto Sans Devanagari','Kohinoor Devanagari','Nirmala UI','Mangal',sans-serif";
const LATIN = "'Nunito','Arial',sans-serif";

export function Logo({ size = 48, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={animated ? "em em-anim" : "em"} role="img" aria-label="Bharatiya Vidya Bhavan" style={{ overflow: "visible" }}>
      <defs>
        <path id="em-top" d="M 50 100 A 50 50 0 0 1 150 100" />
        <path id="em-bot" d="M 37 100 A 63 63 0 0 0 163 100" />
        <radialGradient id="em-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* lotus petals */}
      <g className="em-petals">
        {Array.from({ length: 16 }).map((_, i) => (
          <g key={i} transform={`rotate(${(i * 360) / 16} 100 100)`}>
            <g className="em-petal" style={{ ["--i" as string]: i }}>
              <path d="M 90 30 Q 88 14 100 4 Q 112 14 110 30" fill="#ffffff" stroke={NAVY} strokeWidth="2.6" strokeLinejoin="round" />
              <path d="M 94 30 Q 93 20 100 13 Q 107 20 106 30" fill="none" stroke={NAVY} strokeWidth="1.6" />
            </g>
          </g>
        ))}
      </g>
      {/* the navy ring and white field */}
      <circle cx="100" cy="100" r="71" fill="#ffffff" />
      <circle className="em-ring" cx="100" cy="100" r="71" fill="none" stroke={NAVY} strokeWidth="7" pathLength={1} />
      {/* names around the ring */}
      <g className="em-text" fill={NAVY}>
        <text fontSize="16" fontWeight={700} fontFamily={DEVA}>
          <textPath href="#em-top" startOffset="50%" textAnchor="middle">
            भारतीय विद्या भवन
          </textPath>
        </text>
        <text fontSize="11.5" fontWeight={800} letterSpacing="0.8" fontFamily={LATIN}>
          <textPath href="#em-bot" startOffset="50%" textAnchor="middle">
            BHARATIYA VIDYA BHAVAN
          </textPath>
        </text>
        <Swastika x={56} y={100} s={6} />
        <Swastika x={144} y={100} s={6} />
      </g>
      {/* temple arch with the lamp of learning */}
      <g className="em-arch">
        <path d="M 72 122 L 72 92 Q 72 66 100 56 Q 128 66 128 92 L 128 122 Z" fill={NAVY} />
        <path d="M 79 122 L 79 94 Q 79 73 100 65 Q 121 73 121 94 L 121 122 Z" fill="#ffffff" />
        <path d="M 66 122 H 134 V 126 H 66 Z M 62 126 H 138 V 129 H 62 Z" fill={NAVY} />
        <circle className="em-halo" cx="100" cy="86" r="17" fill="url(#em-glow)" />
        <path className="em-flame" d="M 100 73 Q 106 83 103 91 Q 100 95 97 91 Q 94 83 100 73 Z" fill={NAVY} />
        <path d="M 88 98 Q 100 107 112 98 L 110 96 H 90 Z" fill={NAVY} />
        <path d="M 97 96 V 92 H 103 V 96 Z" fill={NAVY} />
        <g transform="translate(100 113)" stroke={NAVY} strokeWidth="1" fill="none">
          <circle r="6" strokeWidth="1.6" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1="0" y1="0" x2={Math.cos((i * Math.PI) / 6) * 6} y2={Math.sin((i * Math.PI) / 6) * 6} />
          ))}
        </g>
      </g>
      <g className="em-motto" fill={NAVY} textAnchor="middle">
        <text x="100" y="134" fontSize="8.5" fontWeight={700} fontFamily={DEVA}>
          अमृतं तु विद्या
        </text>
        <text x="100" y="141.5" fontSize="6" fontWeight={800} letterSpacing="0.4" fontFamily={LATIN}>
          KNOWLEDGE
        </text>
        <text x="100" y="148" fontSize="6" fontWeight={800} letterSpacing="0.4" fontFamily={LATIN}>
          IS NECTAR
        </text>
      </g>
    </svg>
  );
}

export function Wordmark({ size = 1 }: { size?: number }) {
  return (
    <span className="display" style={{ fontSize: 18 * size, lineHeight: 0.9, display: "inline-flex", flexDirection: "column" }}>
      <span>BHAVAN&apos;S</span>
      <span style={{ color: NAVY, fontSize: "0.72em" }}>MULTIPLAYER</span>
    </span>
  );
}
