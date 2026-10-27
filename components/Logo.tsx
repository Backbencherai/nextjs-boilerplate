export default function Logo({ size = 40, word = true }: { size?: number; word?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="Orvia logo" role="img">
        <defs>
          <linearGradient id="og" x1="0" y1="0" x2="64" y2="64">
            <stop stopColor="#7c5cff" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path className="logo-hex" d="M32 4 56 18v28L32 60 8 46V18z" stroke="url(#og)" strokeWidth="3" strokeLinejoin="round" />
        <path className="logo-o" d="M32 20a12 12 0 1 0 0 24 12 12 0 0 0 0-24z" stroke="url(#og)" strokeWidth="3.5" />
        <g className="logo-orbit"><circle cx="32" cy="8" r="3.5" fill="#22d3ee" /></g>
        <circle className="logo-core" cx="32" cy="32" r="3" fill="#7c5cff" />
      </svg>
      {word && <span className="text-xl font-semibold tracking-tight">Orvia</span>}
    </span>
  );
}
