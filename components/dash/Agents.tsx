"use client";
import { useState } from "react";
import { AGENTS, type AgentId } from "@/lib/agents";
import { type Company, type Run, uid } from "./types";

export default function Agents({ company, runs, setRuns, repo }: { company: Company; runs: Run[]; setRuns: (f: (r: Run[]) => Run[]) => void; repo: string }) {
  const [agentId, setAgentId] = useState<AgentId>("strategy");
  const [task, setTask] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function run() {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/agent", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId, task: `Company: ${company.name}. Goal: ${company.goal}.\nTask: ${task}`.slice(0, 2000), repo: repo || undefined }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Failed");
      setRuns((r) => [{ id: uid(), companyId: company.id, agentId, task, output: data.output, status: (data.needsApproval ? "pending" : "done") as Run["status"], at: new Date().toISOString() }, ...r].slice(0, 200));
      setTask("");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  const decide = (id: string, status: "approved" | "rejected") => setRuns((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
  const mine = runs.filter((r) => r.companyId === company.id);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <section className="panel space-y-4 p-5">
        <h3 className="font-semibold">Assign a task</h3>
        <div className="grid grid-cols-2 gap-2">
          {AGENTS.map((a) => (
            <button key={a.id} onClick={() => setAgentId(a.id)} className={`rounded-lg border p-3 text-left text-sm ${agentId === a.id ? "border-[#7c5cff] bg-[#7c5cff]/10" : "border-[var(--line)]"}`}>
              <div className="font-medium">{a.name}</div><div className="text-[var(--muted)]">{a.role}{a.needsApproval ? " · approval" : ""}</div>
            </button>
          ))}
        </div>
        <textarea value={task} onChange={(e) => setTask(e.target.value)} maxLength={1500} rows={5} placeholder="e.g. Plan our first 30 days of launch" className="w-full rounded-lg border border-[var(--line)] bg-transparent p-3 text-sm" />
        <button disabled={busy || !task.trim()} onClick={run} className="btn w-full disabled:opacity-50">{busy ? "Running…" : "Run agent"}</button>
        {err && <p className="text-sm text-red-400">{err}</p>}
      </section>
      <section className="panel p-5">
        <h3 className="mb-3 font-semibold">Activity</h3>
        {mine.length === 0 && <p className="text-sm text-[var(--muted)]">No runs yet.</p>}
        <ul className="space-y-3">
          {mine.map((r) => (
            <li key={r.id} className="rounded-lg border border-[var(--line)] p-3 text-sm">
              <div className="flex justify-between"><b>{AGENTS.find((a) => a.id === r.agentId)?.name}</b><span className="text-[var(--muted)]">{r.status}</span></div>
              <div className="text-[var(--muted)]">{r.task}</div>
              <pre className="mt-2 whitespace-pre-wrap font-sans">{r.output}</pre>
              {r.status === "pending" && <div className="mt-2 flex gap-2"><button className="btn !py-1" onClick={() => decide(r.id, "approved")}>Approve</button><button className="btn-ghost !py-1" onClick={() => decide(r.id, "rejected")}>Reject</button></div>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
