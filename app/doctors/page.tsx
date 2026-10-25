"use client";

import { useState } from "react";
import { Container, Notice, PageHeader } from "@/components/ui";

type Result = { configured: boolean; results: { id: string; name: string; specialty: string; facility?: string; address?: string; source: string }[]; message?: string; error?: string };

export default function DoctorsPage() {
  const [form, setForm] = useState({ specialty: "", location: "", facility: "", format: "" });
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const p = new URLSearchParams(Object.entries(form).filter(([, v]) => v));
    try {
      const r = await fetch(`/api/doctors?${p}`);
      setRes(await r.json());
    } catch {
      setRes({ configured: false, results: [], error: "Could not reach the server." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Find doctors and facilities" intro="Search is wired to a provider-directory layer. Results appear only from a real, connected source." />
      <Container className="max-w-3xl space-y-6">
        <Notice title="No directory connected">
          Swasth Setu does not invent doctors, registrations, reviews or availability. Integration with India&apos;s
          ABDM / Unified Health Interface requires onboarding we have not completed — see{" "}
          <a className="underline" href="https://abdm.gov.in/" target="_blank" rel="noopener noreferrer">abdm.gov.in</a> and{" "}
          <a className="underline" href="https://abdm.gov.in/UHI" target="_blank" rel="noopener noreferrer">UHI</a>.
        </Notice>
        <form onSubmit={search} className="card grid gap-4 sm:grid-cols-2">
          {(["specialty", "location", "facility"] as const).map((k) => (
            <div key={k}>
              <label className="label capitalize" htmlFor={k}>{k}</label>
              <input id={k} className="input" maxLength={120} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="label" htmlFor="format">Consultation format</label>
            <select id="format" className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
              <option value="">Any</option>
              <option value="in-person">In person</option>
              <option value="teleconsult">Teleconsultation</option>
            </select>
          </div>
          <button className="btn btn-primary sm:col-span-2" disabled={busy}>{busy ? "Searching…" : "Search"}</button>
        </form>
        {res && (
          <div aria-live="polite" className="card text-sm">
            {res.error && <p>{res.error}</p>}
            {!res.error && res.results.length === 0 && <p>{res.message ?? "No results."}</p>}
            {res.results.map((d) => (
              <div key={d.id} className="border-b border-line py-2 last:border-0">
                <p className="font-semibold">{d.name} — {d.specialty}</p>
                <p className="text-muted">{[d.facility, d.address].filter(Boolean).join(", ")}</p>
                <p className="text-xs text-muted">Source: {d.source}</p>
              </div>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
