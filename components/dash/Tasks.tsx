"use client";
import { useState } from "react";
import { type TaskItem, uid } from "./types";

const COLS: { id: TaskItem["col"]; label: string }[] = [{ id: "todo", label: "To do" }, { id: "doing", label: "In progress" }, { id: "done", label: "Done" }];

export default function Tasks({ companyId, tasks, setTasks }: { companyId: string; tasks: TaskItem[]; setTasks: (f: (t: TaskItem[]) => TaskItem[]) => void }) {
  const [title, setTitle] = useState("");
  const move = (id: string, dir: 1 | -1) => setTasks((t) => t.map((x) => {
    if (x.id !== id) return x; const i = COLS.findIndex((c) => c.id === x.col);
    return { ...x, col: COLS[Math.min(2, Math.max(0, i + dir))].id };
  }));
  return (
    <div className="space-y-4">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; setTasks((t) => [{ id: uid(), companyId, title: title.trim().slice(0, 120), col: "todo" }, ...t]); setTitle(""); }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task" className="flex-1 rounded-lg border border-[var(--line)] bg-transparent p-2 text-sm" />
        <button className="btn !py-2">Add</button>
      </form>
      <div className="grid gap-4 md:grid-cols-3">
        {COLS.map((c) => (
          <div key={c.id} className="panel p-4">
            <h4 className="mb-3 text-sm font-semibold text-[var(--muted)]">{c.label}</h4>
            <ul className="space-y-2">
              {tasks.filter((t) => t.companyId === companyId && t.col === c.id).map((t) => (
                <li key={t.id} className="rounded-lg border border-[var(--line)] p-2 text-sm">
                  {t.title}
                  <div className="mt-1 flex gap-2 text-xs text-[var(--muted)]">
                    {c.id !== "todo" && <button onClick={() => move(t.id, -1)}>← back</button>}
                    {c.id !== "done" && <button onClick={() => move(t.id, 1)}>next →</button>}
                    <button className="ml-auto" onClick={() => setTasks((a) => a.filter((x) => x.id !== t.id))}>delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
