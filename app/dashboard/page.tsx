"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Pencil, Trash2 } from "lucide-react";
import { Container, DemoBadge, Notice, PageHeader } from "@/components/ui";
import { useCareStore } from "@/lib/useCareStore";

const KINDS = ["Doctor appointment", "Follow-up visit", "Wellness task", "Advised by my clinician"];

export default function DashboardPage() {
  const s = useCareStore();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState(KINDS[0]);
  const [due, setDue] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function saveReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (editing) { await s.updateReminder(editing, { title: title.trim(), kind, due }); setEditing(null); }
    else await s.addReminder({ title: title.trim(), kind, due });
    setTitle(""); setDue("");
  }

  async function wipe() {
    const where = s.mode === "account" ? "your account" : "this device";
    if (confirm(`Delete all reminders and notes saved on ${where}?`)) await s.wipe();
  }

  return (
    <>
      <PageHeader title="Dashboard & care companion" intro={s.mode === "account" ? "Your reminders and notes, saved to your account." : "Your reminders and notes — stored only in this browser."} />
      <Container className="space-y-8">
        {s.mode === "account" ? (
          <Notice title="Saved to your account">
            Only you can read or change these items (enforced by database row-level security). This app does not send
            notifications — reminders are a written list, not alarms.
          </Notice>
        ) : (
          <Notice tone="warn" title="Local mode">
            <span className="mr-2 inline-block"><DemoBadge>Not an account</DemoBadge></span>
            Items are saved only in this browser; clearing browser data or switching device removes them.{" "}
            <Link className="underline" href="/auth?next=/dashboard">Sign in</Link> (if enabled) to keep them in an account. This app does not send notifications.
          </Notice>
        )}
        {s.error && <p role="alert" className="text-sm text-red-700">{s.error}</p>}
        {s.mode === "account" && s.hasLocalItems && (
          <Notice title="Items on this device are not shown">
            You have reminders or notes saved locally from before you signed in. They stay on this device and are not
            copied to your account automatically.
          </Notice>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card space-y-4" aria-labelledby="rem">
            <h2 id="rem" className="text-xl font-semibold">Care reminders</h2>
            <form onSubmit={saveReminder} className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="rt">Reminder</label>
                <input id="rt" className="input" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="rk">Type</label>
                <select id="rk" className="input" value={kind} onChange={(e) => setKind(e.target.value)}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select>
              </div>
              <div>
                <label className="label" htmlFor="rd">Date (optional)</label>
                <input id="rd" type="date" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
              </div>
              <button className="btn btn-primary sm:col-span-2" disabled={!s.ready}>{editing ? "Update reminder" : "Add reminder"}</button>
            </form>
            {s.ready && s.reminders.length === 0 && <p className="text-sm text-muted">No reminders yet. Add one above.</p>}
            <ul className="space-y-2">
              {s.reminders.map((r) => (
                <li key={r.id} className="flex items-center gap-2 rounded-xl border border-line p-3">
                  <button aria-label={r.done ? "Mark not done" : "Mark done"} className="flex h-10 w-10 items-center justify-center rounded-lg border border-line" onClick={() => s.updateReminder(r.id, { done: !r.done })}>
                    {r.done && <Check className="h-4 w-4 text-accent" />}
                  </button>
                  <div className={`flex-1 text-sm ${r.done ? "text-muted line-through" : ""}`}>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted">{r.kind}{r.due && ` · ${r.due}`}</p>
                  </div>
                  <button aria-label="Edit" className="h-10 w-10" onClick={() => { setEditing(r.id); setTitle(r.title); setKind(r.kind); setDue(r.due); }}><Pencil className="mx-auto h-4 w-4" /></button>
                  <button aria-label="Delete" className="h-10 w-10" onClick={() => s.removeReminder(r.id)}><Trash2 className="mx-auto h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card space-y-4" aria-labelledby="nt">
            <h2 id="nt" className="text-xl font-semibold">Personal notes</h2>
            <form onSubmit={async (e) => { e.preventDefault(); if (!note.trim()) return; await s.addNote(note.trim()); setNote(""); }} className="space-y-2">
              <label className="label" htmlFor="nn">New note</label>
              <textarea id="nn" className="input min-h-[80px]" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn btn-primary" disabled={!s.ready}>Save note</button>
            </form>
            {s.ready && s.notes.length === 0 && <p className="text-sm text-muted">No notes yet.</p>}
            <ul className="space-y-2">
              {s.notes.map((n) => (
                <li key={n.id} className="flex gap-2 rounded-xl border border-line p-3 text-sm">
                  <div className="flex-1"><p>{n.text}</p><p className="text-xs text-muted">{n.at}</p></div>
                  <button aria-label="Delete note" className="h-10 w-10" onClick={() => s.removeNote(n.id)}><Trash2 className="mx-auto h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="card">
          <h2 className="text-xl font-semibold">Privacy settings</h2>
          <p className="mt-1 text-sm text-muted">Saved reports, medicines and appointments are not available yet. Deleting here removes the reminders and notes in the store you are using ({s.mode === "account" ? "your account" : "this device"}). Full account deletion is not built yet — contact the site operator.</p>
          <button className="btn btn-secondary mt-3" onClick={wipe}><Trash2 className="h-4 w-4" aria-hidden /> Delete all my saved data</button>
        </section>
      </Container>
    </>
  );
}
