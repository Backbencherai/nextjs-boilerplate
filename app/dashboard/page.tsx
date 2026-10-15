"use client";

import { useState } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { Container, DemoBadge, Notice, PageHeader } from "@/components/ui";
import { useLocalState } from "@/lib/useLocalState";

type Reminder = { id: string; title: string; kind: string; due: string; done: boolean };
type Note = { id: string; text: string; at: string };

const KINDS = ["Doctor appointment", "Follow-up visit", "Wellness task", "Advised by my clinician"];
const uid = () => Math.random().toString(36).slice(2);

export default function DashboardPage() {
  const [reminders, setReminders] = useLocalState<Reminder[]>("ss-reminders", []);
  const [notes, setNotes] = useLocalState<Note[]>("ss-notes", []);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState(KINDS[0]);
  const [due, setDue] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState("");

  function saveReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (editing) {
      setReminders(reminders.map((r) => (r.id === editing ? { ...r, title: title.trim(), kind, due } : r)));
      setEditing(null);
    } else setReminders([...reminders, { id: uid(), title: title.trim(), kind, due, done: false }]);
    setTitle(""); setDue("");
  }

  function wipe() {
    if (!confirm("Delete all reminders and notes saved on this device?")) return;
    setReminders([]); setNotes([]);
    try { localStorage.removeItem("ss-reminders"); localStorage.removeItem("ss-notes"); } catch {}
  }

  return (
    <>
      <PageHeader title="Dashboard & care companion" intro="Your reminders and notes — stored only in this browser." />
      <Container className="space-y-8">
        <Notice tone="warn" title="Local demo mode">
          <span className="mr-2 inline-block"><DemoBadge>Not an account</DemoBadge></span>
          Sign-in is not configured, so nothing is saved to a server or account. Clearing browser data or switching
          device removes these items. Reminders are written down here only — this app does not send notifications.
        </Notice>

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
              <button className="btn btn-primary sm:col-span-2">{editing ? "Update reminder" : "Add reminder"}</button>
            </form>
            {reminders.length === 0 && <p className="text-sm text-muted">No reminders yet. Add one above.</p>}
            <ul className="space-y-2">
              {reminders.map((r) => (
                <li key={r.id} className="flex items-center gap-2 rounded-xl border border-line p-3">
                  <button aria-label={r.done ? "Mark not done" : "Mark done"} className="flex h-10 w-10 items-center justify-center rounded-lg border border-line" onClick={() => setReminders(reminders.map((x) => (x.id === r.id ? { ...x, done: !x.done } : x)))}>
                    {r.done && <Check className="h-4 w-4 text-accent" />}
                  </button>
                  <div className={`flex-1 text-sm ${r.done ? "text-muted line-through" : ""}`}>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted">{r.kind}{r.due && ` · ${r.due}`}</p>
                  </div>
                  <button aria-label="Edit" className="h-10 w-10" onClick={() => { setEditing(r.id); setTitle(r.title); setKind(r.kind); setDue(r.due); }}><Pencil className="mx-auto h-4 w-4" /></button>
                  <button aria-label="Delete" className="h-10 w-10" onClick={() => setReminders(reminders.filter((x) => x.id !== r.id))}><Trash2 className="mx-auto h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card space-y-4" aria-labelledby="nt">
            <h2 id="nt" className="text-xl font-semibold">Personal notes</h2>
            <form onSubmit={(e) => { e.preventDefault(); if (!note.trim()) return; setNotes([{ id: uid(), text: note.trim(), at: new Date().toLocaleString() }, ...notes]); setNote(""); }} className="space-y-2">
              <label className="label" htmlFor="nn">New note</label>
              <textarea id="nn" className="input min-h-[80px]" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn btn-primary">Save note</button>
            </form>
            {notes.length === 0 && <p className="text-sm text-muted">No notes yet.</p>}
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="flex gap-2 rounded-xl border border-line p-3 text-sm">
                  <div className="flex-1"><p>{n.text}</p><p className="text-xs text-muted">{n.at}</p></div>
                  <button aria-label="Delete note" className="h-10 w-10" onClick={() => setNotes(notes.filter((x) => x.id !== n.id))}><Trash2 className="mx-auto h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="card">
          <h2 className="text-xl font-semibold">Privacy settings</h2>
          <p className="mt-1 text-sm text-muted">Saved reports, medicines and appointments are not available yet. Everything shown above lives only on this device.</p>
          <button className="btn btn-secondary mt-3" onClick={wipe}><Trash2 className="h-4 w-4" aria-hidden /> Delete all my saved data</button>
        </section>
      </Container>
    </>
  );
}
