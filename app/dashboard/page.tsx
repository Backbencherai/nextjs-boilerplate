"use client";
import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useLocal } from "@/lib/useLocal";
import { type Company, type Revenue, type Run, type TaskItem, uid } from "@/components/dash/types";
import Overview from "@/components/dash/Overview";
import Agents from "@/components/dash/Agents";
import Tasks from "@/components/dash/Tasks";
import Billing from "@/components/dash/Billing";
import Court from "@/components/dash/Court";
import Master from "@/components/dash/Master";
import Settings from "@/components/dash/Settings";

const TABS = ["Overview", "Master", "Agents", "Court", "Tasks", "Billing", "Settings"] as const;

export default function Dashboard() {
  const [companies, setCompanies] = useLocal<Company[]>("orvia.companies", []);
  const [activeId, setActiveId] = useLocal<string>("orvia.active", "");
  const [runs, setRuns] = useLocal<Run[]>("orvia.runs", []);
  const [tasks, setTasks] = useLocal<TaskItem[]>("orvia.tasks", []);
  const [revenue, setRevenue] = useLocal<Revenue[]>("orvia.revenue", []);
  const [repo, setRepo] = useLocal<string>("orvia.repo", "");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [trialText, setTrialText] = useState("");
  const [name, setName] = useState(""); const [goal, setGoal] = useState("");

  const company = companies.find((c) => c.id === activeId) ?? companies[0];

  if (!company) {
    return (
      <div className="mx-auto max-w-md px-6 py-24">
        <div className="mb-6 flex justify-center"><Logo size={64} /></div>
        <form className="panel space-y-3 p-6" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; const c = { id: uid(), name: name.trim().slice(0, 60), goal: goal.trim().slice(0, 200) }; setCompanies([c]); setActiveId(c.id); }}>
          <h1 className="text-xl font-semibold">Create your first company</h1>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" className="w-full rounded-lg border border-[var(--line)] bg-transparent p-2 text-sm" />
          <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What should it achieve?" className="w-full rounded-lg border border-[var(--line)] bg-transparent p-2 text-sm" />
          <button className="btn w-full">Launch</button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row">
      <aside className="md:w-56 md:shrink-0">
        <Link href="/"><Logo /></Link>
        <select value={company.id} onChange={(e) => setActiveId(e.target.value)} className="mt-6 w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] p-2 text-sm">
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="mt-2 text-xs text-[var(--muted)] hover:text-white" onClick={() => { const n = prompt("New company name")?.trim().slice(0, 60); if (n) { const c = { id: uid(), name: n, goal: "" }; setCompanies((a) => [...a, c]); setActiveId(c.id); } }}>+ New company</button>
        <nav className="mt-6 flex gap-1 overflow-x-auto md:flex-col">
          {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-2 text-left text-sm ${tab === t ? "bg-[#7c5cff]/15 text-white" : "text-[var(--muted)] hover:text-white"}`}>{t}</button>)}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        <h1 className="mb-6 text-2xl font-bold">{company.name}<span className="ml-3 text-sm font-normal text-[var(--muted)]">{company.goal}</span></h1>
        {tab === "Overview" && <Overview companyId={company.id} runs={runs} tasks={tasks} revenue={revenue} setRevenue={setRevenue} />}
        {tab === "Master" && <Master company={company} onTrial={(t) => { setTrialText(t); setTab("Court"); }} />}
        {tab === "Court" && <Court key={trialText} prefill={trialText} />}
        {tab === "Agents" && <Agents company={company} runs={runs} setRuns={setRuns} repo={repo} />}
        {tab === "Tasks" && <Tasks companyId={company.id} tasks={tasks} setTasks={setTasks} />}
        {tab === "Billing" && <Billing />}
        {tab === "Settings" && <Settings repo={repo} setRepo={setRepo} />}
      </main>
    </div>
  );
}
