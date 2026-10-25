"use client";
import { useState } from "react";
import { AGENTS } from "@/lib/agents";
import type { Company } from "./types";

type Out = { agentId: string; reason: string; highStakes: boolean; needsApproval: boolean; output: string };

export default function Master({ company, onTrial }: { company: Company; onTrial: (idea: string) => void }) {
  const [task, setTask] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [out, setOut] = useState<Out | null>(null);
  async function go() {
    setBusy(true); setErr(""); setOut(null);
    try {
      const r = await fetch("/api/master", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task, company: `${company.name}: ${company.goal}` }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Failed"); setOut(d);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-4">
      <div className="panel space-y-3 p-5">
        <p className="text-sm text-[var(--muted)]">Describe any goal. The Master model picks the right agent, runs it, and flags risky work for a Court trial.</p>
        <textarea value={task} onChange={(e) => setTask(e.target.value)} maxLength={2000} rows={4} placeholder="e.g. Launch a Diwali sale for our candles" className="w-full rounded-lg border border-[var(--line)] bg-transparent p-3 text-sm" />
        <button disabled={busy || !task.trim()} onClick={go} className="btn disabled:opacity-50">{busy ? "Thinking…" : "Ask Master"}</button>
        {err && <p className="text-sm text-red-400">{err}</p>}
      </div>
      {out && (
        <div className="panel space-y-3 p-5 text-sm">
          <div>Routed to <b>{AGENTS.find((a) => a.id === out.agentId)?.name}</b> — {out.reason}</div>
          <pre className="whitespace-pre-wrap font-sans">{out.output}</pre>
          {(out.highStakes || out.needsApproval) && (
            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-3">
              <span className="text-amber-400">High-stakes: review before acting.</span>
              <button className="btn-ghost !py-1" onClick={() => onTrial(`${task}\n\nProposed plan:\n${out.output}`.slice(0, 3000))}>Put it on trial</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
