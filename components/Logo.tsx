"use client";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";

/** The A×D mark. It is ticklish: seven quick taps reveal a secret. */
export function Logo({ size = 40 }: { size?: number }) {
  const taps = useRef<number[]>([]);
  const [wiggle, setWiggle] = useState(0);
  const findSecret = useStore((s) => s.findSecret);
  return (
    <button
      className="logo"
      style={{ width: size, height: size, transform: `rotate(${wiggle}deg)` }}
      aria-label="A×D"
      onClick={() => {
        const now = Date.now();
        taps.current = [...taps.current.filter((t) => now - t < 2500), now];
        setWiggle((w) => (w > 0 ? -12 : 12));
        setTimeout(() => setWiggle(0), 180);
        if (taps.current.length >= 7) {
          taps.current = [];
          findSecret("logo");
        }
      }}
    >
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
        <rect x="1" y="1" width="38" height="38" rx="11" fill="#fff4e3" />
        <path d="M8 29 L14 11 L20 29 M10.5 23 H17.5" stroke="#1b120c" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 17 L23 21 M23 17 L19 21" stroke="#ff7a1a" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M24 11 H27 C33 11 34 16 34 20 C34 24 33 29 27 29 H24 Z" stroke="#1b120c" strokeWidth="3" fill="none" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
