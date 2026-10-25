/** Swasth Setu mark: a bridge arc ("setu") over a cross. Pure SVG, no external asset. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden fill="none">
      <rect width="40" height="40" rx="11" fill="#0f766e" />
      <path d="M6 25c4-9 10-13 14-13s10 4 14 13" stroke="#99f6e4" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 17v11M14.5 22.5h11" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M6 30h28" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}
