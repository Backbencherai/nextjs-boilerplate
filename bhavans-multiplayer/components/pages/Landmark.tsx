"use client";
import { Flag } from "@/components/ui";
import Link from "next/link";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { LM_BY_ID } from "@/lib/game/landmarks";

/** A postcard from your trip. */
export function Landmark() {
  const id = useGame((s) => s.lastLandmark);
  const n = useGame((s) => s.nation)!;
  const lm = id ? LM_BY_ID.get(id) : null;
  if (!lm)
    return (
      <main className="page">
        <h1 className="page-title">No trip</h1>
        <Link href="/world" className="btn">
          World map
        </Link>
      </main>
    );
  return (
    <main className="page" style={{ alignItems: "center" }}>
      <motion.div className="postcard" initial={{ rotate: -8, scale: 0.8, opacity: 0 }} animate={{ rotate: -2, scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 14 }}>
        <div className="pc-pic">
          <span>{lm.icon}</span>
          <div className="pc-sun" />
          <b className="display">{lm.name}</b>
        </div>
        <div className="pc-back">
          <p className="kicker">greetings from {lm.country}</p>
          <p style={{ margin: 0 }}>💡 {lm.fact}</p>
          <p className="small" style={{ margin: 0 }}>
            — President {n.president} of <Flag code={n.flag} /> {n.name}
          </p>
          <span className="pc-stamp">{lm.icon}</span>
        </div>
      </motion.div>
      <p className="small muted center">Stamped in your passport. Share a photo of the real place with your friends!</p>
      <div className="row">
        <Link href="/world" className="btn">
          🌍 World map
        </Link>
        <Link href="/city" className="btn saffron">
          ✈️ Fly home
        </Link>
      </div>
    </main>
  );
}
