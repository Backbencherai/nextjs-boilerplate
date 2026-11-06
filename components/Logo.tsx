"use client";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { LogoMark } from "./LogoMark";

/** The A×D mark. It is ticklish: seven quick taps reveal a secret. */
export function Logo({ size = 46 }: { size?: number }) {
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
      <LogoMark size={size} />
    </button>
  );
}
