"use client";

import { useState } from "react";
import { Container, EmergencyBox, Notice, PageHeader } from "@/components/ui";

type Msg = { role: "user" | "assistant"; content: string };

export default function AssistantPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next); setInput(""); setError(""); setBusy(true);
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next, consent }) });
      const j = await r.json();
      if (!r.ok) setError(j.error ?? "Something went wrong.");
      else setMsgs([...next, { role: "assistant", content: j.reply }]);
    } catch { setError("Could not reach the server."); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Health education assistant" intro="Ask for plain-language explanations or help preparing questions for a doctor visit." />
      <Container className="max-w-3xl space-y-6">
        <EmergencyBox />
        <Notice title="How this works">
          The assistant is an AI, not a doctor. It does not diagnose or prescribe. If the site operator has not set
          up an AI provider, it will say so instead of replying. Your messages are sent to that provider only after
          you tick the box below.
        </Notice>
        <div className="card space-y-3" aria-live="polite">
          {msgs.length === 0 && <p className="text-sm text-muted">No messages yet.</p>}
          {msgs.map((m, i) => (
            <p key={i} className={`rounded-xl p-3 text-sm ${m.role === "user" ? "bg-surface" : "border border-line"}`}>
              <strong>{m.role === "user" ? "You" : "Assistant (AI)"}:</strong> {m.content}
            </p>
          ))}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
        <form onSubmit={send} className="space-y-3">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-[#0f766e]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            I understand my message will be sent to an external AI provider, and I will not include names, ID numbers or other identifying details.
          </label>
          <label htmlFor="ask" className="label">Your question</label>
          <textarea id="ask" className="input min-h-[80px]" maxLength={4000} value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="btn btn-primary" disabled={busy || !consent || !input.trim()}>{busy ? "Waiting…" : "Send"}</button>
        </form>
      </Container>
    </>
  );
}
