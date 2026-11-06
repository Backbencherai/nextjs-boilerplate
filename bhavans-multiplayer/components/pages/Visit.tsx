"use client";
import * as E from "@/lib/game/engine";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGame } from "@/lib/store";
import type { TileView } from "../city/CityScene";
import { fmt, Flag } from "../ui";

const CityScene = dynamic(() => import("../city/CityScene"), { ssr: false, loading: () => <div className="blank">Landing…</div> });

/** Tourist mode: walk around someone else's capital. */
export function Visit() {
  const visit = useGame((s) => s.visit);
  const pub = useGame((s) => s.pub);
  const endVisit = useGame((s) => s.endVisit);
  const router = useRouter();
  const p = visit ? pub(visit) : null;
  if (!p)
    return (
      <main className="page">
        <h1 className="page-title">No trip</h1>
        <Link href="/world" className="btn">
          Open the world map
        </Link>
      </main>
    );
  return (
    <div className="city-root">
      <CityScene tiles={p.tiles as TileView[]} land={p.land} accent={p.color} character={p.character} pop={p.pop} heroAnim="cheer" hour={Math.round(E.localHour(p.home, Date.now()) * 10) / 10} flag={p.flag} title={`President ${p.president}`} />
      <div className="city-top">
        <div className="banner navy">
          <span className="e">🧳</span>
          <div className="grow">
            <b>
              You&apos;re a tourist in <Flag code={p.flag} /> {p.name}
            </b>
            <div className="small">
              President {p.president} · {p.home.country} · 👥 {fmt(p.pop)} · 😊 {p.happiness}% · 🏙️ Lv {p.cityLevel}
            </div>
          </div>
        </div>
      </div>
      <div className="city-panel">
        <button
          className="btn saffron lg block"
          onClick={() => {
            endVisit();
            router.push("/city/");
          }}
        >
          ✈️ Fly home
        </button>
      </div>
    </div>
  );
}
