"use client";
import { useState } from "react";

type Result = { verdict: string; guilty: number; notGuilty: number; noVote: number; judge: string; calls: number; jurors: { name: string; vote: string; reason: string }[] };

export default function Court({ prefill = "" }: { prefill?: string }) {
  const [idea, setIdea] = useState(prefill); const [jury, setJury] = useState(6);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [res, setRes] = useState<Result | null>(null);
  async function go() {
    setBusy(true); setErr(""); setRes(null);
    try {
      const r = await fetch("/api/court", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idea, jury }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Failed"); setRes(d);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-4">
      <div className="panel space-y-3 p-5">
        <p className="text-sm text-[var(--muted)]">Put an idea on trial: a prosecutor, a defense and a jury of different personas. Uses {jury + 5} model calls.</p>
        <textarea value={idea} onChange={(e) => setIdea(e.target.value)} maxLength={3000} rows={5} placeholder="Describe the plan with numbers: budget, audience, timeline, what you've tried." className="w-full rounded-lg border border-[var(--line)] bg-transparent p-3 text-sm" />
        <div className="flex items-center gap-3 text-sm">
          <label>Jurors <select value={jury} onChange={(e) => setJury(Number(e.target.value))} className="ml-1 rounded border border-[var(--line)] bg-[var(--panel)] p-1">{[3, 6, 9, 12].map((n) => <option key={n}>{n}</option>)}</select></label>
          <button disabled={busy || idea.trim().length < 10} onClick={go} className="btn ml-auto disabled:opacity-50">{busy ? "Trial in progress…" : "Start trial"}</button>
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
      </div>
      {res && (
        <div className="panel space-y-4 p-5">
          <h3 className="text-xl font-bold">{res.verdict} <span className="text-sm font-normal text-[var(--muted)]">{res.guilty} guilty · {res.notGuilty} not guilty{res.noVote ? ` · ${res.noVote} abstained` : ""}</span></h3>
          <ul className="space-y-1.5 text-sm">{res.jurors.map((j) => <li key={j.name}><b>{j.name}</b> <span className={j.vote === "GUILTY" ? "text-red-400" : "text-emerald-400"}>{j.vote}</span> — {j.reason}</li>)}</ul>
          <pre className="whitespace-pre-wrap border-t border-[var(--line)] pt-4 font-sans text-sm">{res.judge}</pre>
          <p className="text-xs text-[var(--muted)]">AI jury = a structured second opinion, not legal, financial or professional advice. Trial flow adapted from <a className="underline" href="https://github.com/alexyc9381/court-skill">court-skill</a> by Alex Chen (MIT).</p>
        </div>
      )}
    </div>
  );
}
