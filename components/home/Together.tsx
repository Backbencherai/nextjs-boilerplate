"use client";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { PLAYER_META, partnerOf, type Activity, type PlayerId } from "@/lib/types";
import { distanceKm, fmtDistance, geoSupported, notifyGranted, notifySupported } from "@/lib/device";
import { timeAgo } from "@/lib/game/dates";

/** "📍 1,243 km apart" — from both phones' (opt-in, rounded, encrypted) locations. */
export function DistanceCard() {
  const me = useStore((s) => s.me) as PlayerId;
  const myLoc = useStore((s) => s.myLoc);
  const partnerLoc = useStore((s) => s.partnerLoc);
  const shareLoc = useStore((s) => s.shareLoc);
  const enableLocation = useStore((s) => s.enableLocation);
  const [busy, setBusy] = useState(false);
  const partner = PLAYER_META[partnerOf(me)].name;
  if (!geoSupported()) return null;

  let body: React.ReactNode;
  if (!shareLoc || !myLoc) {
    body = (
      <>
        <p className="small">See how far apart you two are, live. Your spot is rounded to ~100 m and only {partner} can see it.</p>
        <button
          className="btn btn-primary sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await enableLocation();
            setBusy(false);
          }}
        >
          {busy ? "Finding you…" : "📍 Share my location"}
        </button>
      </>
    );
  } else if (!partnerLoc) {
    body = <p className="small">You&apos;re sharing. Waiting for {partner} to turn on location (Home → 📍 on their phone).</p>;
  } else {
    const km = distanceKm(myLoc, partnerLoc);
    const together = km < 0.2;
    body = (
      <>
        <p className="big">{together ? "💞 Together!" : fmtDistance(km)}</p>
        <p className="small muted">
          {together ? `You and ${partner} are in the same place right now.` : `between you and ${partner}`} · {partner} updated {timeAgo(new Date(partnerLoc.at).toISOString())}
        </p>
      </>
    );
  }
  return (
    <section className="card distance-card">
      <div className="card-head">
        <h3>📍 Distance</h3>
      </div>
      {body}
    </section>
  );
}

/** Settings: notifications, location, backup & restore. */
export function DeviceSettings() {
  const enableNotifications = useStore((s) => s.enableNotifications);
  const shareLoc = useStore((s) => s.shareLoc);
  const enableLocation = useStore((s) => s.enableLocation);
  const disableLocation = useStore((s) => s.disableLocation);
  const persisted = useStore((s) => s.persisted);
  const acts = useStore((s) => s.activities);
  const importActivities = useStore((s) => s.importActivities);
  const toast = useStore((s) => s.toast);
  const file = useRef<HTMLInputElement>(null);
  const [notif, setNotif] = useState(notifyGranted());

  const backup = () => {
    const blob = new Blob([JSON.stringify({ app: "axd-universe", version: 1, exportedAt: new Date().toISOString(), activities: acts }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `AxD-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="stack">
      <p className="mono small muted">THIS DEVICE</p>
      <div className="perm-row">
        <span>🔔</span>
        <div className="grow">
          <b>Notifications</b>
          <small>{notifySupported() ? (notif ? "On" : "Cheers, bottles, medals, builds, daily nudge") : "Install the app first (iPhone: Share → Add to Home Screen)"}</small>
        </div>
        {notif ? <span className="ok">✓</span> : <button className="btn btn-primary sm" disabled={!notifySupported()} onClick={async () => setNotif(await enableNotifications())}>Turn on</button>}
      </div>
      <div className="perm-row">
        <span>📍</span>
        <div className="grow">
          <b>Share location</b>
          <small>Distance between you, rounded to ~100 m</small>
        </div>
        {shareLoc ? (
          <button className="btn btn-ghost sm" onClick={disableLocation}>
            Turn off
          </button>
        ) : (
          <button className="btn btn-primary sm" onClick={() => enableLocation()}>
            Turn on
          </button>
        )}
      </div>
      <div className="perm-row">
        <span>💾</span>
        <div className="grow">
          <b>Saved forever</b>
          <small>
            {acts.length} records on this phone{persisted ? " · protected from clean-up" : ""} · also kept in your shared universe
          </small>
        </div>
      </div>
      <div className="row gap">
        <button className="btn btn-ghost sm" onClick={backup}>
          ⬇ Download backup
        </button>
        <button className="btn btn-ghost sm" onClick={() => file.current?.click()}>
          ⬆ Restore backup
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const j = JSON.parse(await f.text()) as { activities?: Activity[] };
              const n = importActivities(Array.isArray(j.activities) ? j.activities : []);
              toast({ icon: "💾", text: n ? `Restored ${n} records` : "Nothing new in that backup" });
            } catch {
              toast({ icon: "⚠️", text: "That file isn't an A×D backup" });
            }
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
