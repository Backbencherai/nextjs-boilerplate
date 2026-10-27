"use client";
import { useState } from "react";
import { formatInr } from "@/lib/plans";
import { type Revenue, type Run, type TaskItem, uid } from "./types";

export default function Overview({ companyId, runs, tasks, revenue, setRevenue }: {
  companyId: string; runs: Run[]; tasks: TaskItem[]; revenue: Revenue[]; setRevenue: (f: (r: Revenue[]) => Revenue[]) => void;
}) {
  const [amt, setAmt] = useState(""); const [note, setNote] = useState("");
  const mine = revenue.filter((r) => r.companyId === companyId);
  const total = mine.reduce((s, r) => s + r.amountInr, 0);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10);
    return { d, v: mine.filter((r) => r.at.slice(0, 10) === d).reduce((s, r) => s + r.amountInr, 0) };
  });
  const max = Math.max(1, ...days.map((x) => x.v));
  const kpis: [string, string][] = [
    ["Revenue logged", formatInr(total)],
    ["Agent runs", String(runs.filter((r) => r.companyId === companyId).length)],
    ["Open tasks", String(tasks.filter((t) => t.companyId === companyId && t.col !== "done").length)],
    ["Needs approval", String(runs.filter((r) => r.companyId === companyId && r.status === "pending").length)],
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(([l, v]) => <div key={l} className="panel p-5"><div className="text-sm text-[var(--muted)]">{l}</div><div className="mt-1 text-2xl font-bold">{v}</div></div>)}
      </div>
      <div className="panel p-5">
        <h3 className="font-semibold">Revenue — last 14 days</h3>
        <svg viewBox="0 0 280 100" className="mt-4 w-full" role="img" aria-label="Revenue bar chart">
          {days.map((x, i) => {
            const h = (x.v / max) * 80;
            return <rect key={x.d} x={i * 20 + 3} y={90 - h} width="14" height={Math.max(h, 1.5)} rx="3" fill="url(#bar)"><title>{x.d}: {formatInr(x.v)}</title></rect>;
          })}
          <defs><linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#22d3ee" /><stop offset="1" stopColor="#7c5cff" /></linearGradient></defs>
        </svg>
        <form className="mt-4 flex flex-wrap gap-2" onSubmit={(e) => {
          e.preventDefault(); const n = Number(amt);
          if (!Number.isFinite(n) || n <= 0 || n > 1e9) return;
          setRevenue((r) => [{ id: uid(), companyId, amountInr: n, note: note.slice(0, 80), at: new Date().toISOString() }, ...r]); setAmt(""); setNote("");
        }}>
          <input value={amt} onChange={(e) => setAmt(e.target.value)} inputMode="numeric" placeholder="Amount ₹" className="w-32 rounded-lg border border-[var(--line)] bg-transparent p-2 text-sm" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="min-w-40 flex-1 rounded-lg border border-[var(--line)] bg-transparent p-2 text-sm" />
          <button className="btn !py-2">Log revenue</button>
        </form>
      </div>
    </div>
  );
}
