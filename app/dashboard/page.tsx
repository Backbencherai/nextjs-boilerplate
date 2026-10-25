"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { AGENTS, type AgentId } from "@/lib/agents";
import { PLANS, formatInr } from "@/lib/plans";

type Run = { id: string; agentId: AgentId; task: string; output: string; status: "done" | "pending" | "approved" | "rejected"; at: string };

const load = <T,>(k: string, d: T): T => {
  try { return JSON.parse(localStorage.getItem(k) || "") as T; } catch { return d; }
};

export default function Dashboard() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [repo, setRepo] = useState("");
  const [agentId, setAgentId] = useState<AgentId>("strategy");
  const [task, setTask] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => { setRuns(load("orvia.runs", [])); setRepo(load("orvia.repo", "")); setReady(true); }, []);
  useEffect(() => { if (ready) { localStorage.setItem("orvia.runs", JSON.stringify(runs.slice(0, 100))); localStorage.setItem("orvia.repo", JSON.stringify(repo)); } }, [runs, repo, ready]);

  async function run() {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/agent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ agentId, task, repo: repo || undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setRuns((r) => [{ id: crypto.randomUUID(), agentId, task, output: data.output, status: data.needsApproval ? "pending" : "done", at: new Date().toISOString() }, ...r]);
      setTask("");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  const decide = (id: string, status: "approved" | "rejected") => setRuns((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
  const pending = runs.filter((r) => r.status === "pending");

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="flex items-center justify-between"><Link href="/"><Logo /></Link><span className="text-sm text-[var(--muted)]">Plan: {PLANS[0].name} · {formatInr(PLANS[0].priceInr)}</span></header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[["Agent runs", runs.length], ["Awaiting approval", pending.length], ["Agents active", AGENTS.length]].map(([l, v]) => (
          <div key={l as string} className="panel p-5"><div className="text-sm text-[var(--muted)]">{l}</div><div className="mt-1 text-3xl font-bold">{v}</div></div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="panel space-y-4 p-5">
          <h2 className="font-semibold">Assign a task</h2>
          <div className="grid grid-cols-2 gap-2">
            {AGENTS.map((a) => (
              <button key={a.id} onClick={() => setAgentId(a.id)} className={`rounded-lg border p-3 text-left text-sm ${agentId === a.id ? "border-[#7c5cff] bg-[#7c5cff]/10" : "border-[var(--line)]"}`}>
                <div className="font-medium">{a.name}</div><div className="text-[var(--muted)]">{a.role}</div>
              </button>
            ))}
          </div>
          <textarea value={task} onChange={(e) => setTask(e.target.value)} maxLength={2000} rows={4} placeholder="e.g. Plan our first 30 days of launch" className="w-full rounded-lg border border-[var(--line)] bg-transparent p-3 text-sm" />
          <button disabled={busy || !task.trim()} onClick={run} className="btn w-full disabled:opacity-50">{busy ? "Running…" : "Run agent"}</button>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <div className="border-t border-[var(--line)] pt-4">
            <label className="text-sm text-[var(--muted)]">Connected repository (owner/name)</label>
            <input value={repo} onChange={(e) => setRepo(e.target.value.trim())} placeholder="your-org/automaton" className="mt-1 w-full rounded-lg border border-[var(--line)] bg-transparent p-2 text-sm" />
            <p className="mt-1 text-xs text-[var(--muted)]">Read-only context. Agents never push code without your approval.</p>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="mb-3 font-semibold">Activity</h2>
          {runs.length === 0 && <p className="text-sm text-[var(--muted)]">No runs yet.</p>}
          <ul className="space-y-3">
            {runs.map((r) => (
              <li key={r.id} className="rounded-lg border border-[var(--line)] p-3 text-sm">
                <div className="flex justify-between"><b>{AGENTS.find((a) => a.id === r.agentId)?.name}</b><span className="text-[var(--muted)]">{r.status}</span></div>
                <div className="text-[var(--muted)]">{r.task}</div>
                <pre className="mt-2 whitespace-pre-wrap font-sans">{r.output}</pre>
                {r.status === "pending" && (
                  <div className="mt-2 flex gap-2"><button className="btn !py-1" onClick={() => decide(r.id, "approved")}>Approve</button><button className="btn-ghost !py-1" onClick={() => decide(r.id, "rejected")}>Reject</button></div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
