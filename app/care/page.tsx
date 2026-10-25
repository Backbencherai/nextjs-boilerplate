"use client";

import { useState } from "react";
import { Container, EmergencyBox, Notice, PageHeader } from "@/components/ui";
import { BODY_AREAS, type CareInput } from "@/lib/care/schema";

const MAX_IMG = 5 * 1024 * 1024;
type Out = { urgent: boolean; summary: CareInput };

export default function CarePage() {
  const [f, setF] = useState({ concern: "", bodyArea: "Skin (general)", duration: "", severity: "mild", symptoms: "", context: "" });
  const [img, setImg] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [out, setOut] = useState<Out | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setMsg("");
    if (file && !/^image\/(jpeg|png|webp)$/.test(file.type)) { setMsg("Please choose a JPEG, PNG or WebP image."); return; }
    if (file && file.size > MAX_IMG) { setMsg("Image is larger than 5 MB."); return; }
    setImg(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErrors({}); setOut(null);
    try {
      const r = await fetch("/api/care", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j = await r.json();
      if (!r.ok) setErrors(j.issues ?? { form: [j.error ?? "Something went wrong"] });
      else setOut(j);
    } catch { setErrors({ form: ["Could not reach the server."] }); }
    finally { setBusy(false); }
  }

  const err = (k: string) => errors[k]?.[0] && <p role="alert" className="mt-1 text-sm text-red-700">{errors[k][0]}</p>;

  return (
    <>
      <PageHeader title="Health concern intake" intro="Describe what is worrying you and get safe, general information about next steps." />
      <Container className="max-w-3xl space-y-6">
        <EmergencyBox />
        <form onSubmit={submit} className="card space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="concern">What is the concern?</label>
            <textarea id="concern" className="input min-h-[100px]" maxLength={2000} value={f.concern} onChange={(e) => setF({ ...f, concern: e.target.value })} />
            {err("concern")}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="area">Body area</label>
              <select id="area" className="input" value={f.bodyArea} onChange={(e) => setF({ ...f, bodyArea: e.target.value })}>{BODY_AREAS.map((a) => <option key={a}>{a}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="dur">How long?</label>
              <input id="dur" className="input" placeholder="e.g. 3 days" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} />
              {err("duration")}
            </div>
            <div>
              <label className="label" htmlFor="sev">Severity (your view)</label>
              <select id="sev" className="input" value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })}>
                <option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="sym">Other symptoms (optional)</label>
            <input id="sym" className="input" maxLength={500} value={f.symptoms} onChange={(e) => setF({ ...f, symptoms: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="ctx">Anything else we should know (optional)</label>
            <input id="ctx" className="input" maxLength={1000} value={f.context} onChange={(e) => setF({ ...f, context: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="img">Photo (optional)</label>
            <input id="img" type="file" accept="image/jpeg,image/png,image/webp" onChange={onImage} className="text-sm" />
            <p className="mt-1 text-xs text-muted">Kept in your browser only. It is not uploaded and not analysed — photos cannot reliably diagnose conditions.{img && ` Selected: ${img.name}`}</p>
            {msg && <p role="alert" className="text-sm text-red-700">{msg}</p>}
          </div>
          {errors.form && <p role="alert" className="text-sm text-red-700">{errors.form[0]}</p>}
          <button className="btn btn-primary" disabled={busy}>{busy ? "Working…" : "Get guidance"}</button>
        </form>

        {out && (
          <section aria-live="polite" className="space-y-4">
            {out.urgent && <Notice tone="danger" title="This may need urgent care">You described something severe or a possible warning sign. Call 112 or your local emergency number, or go to the nearest hospital now.</Notice>}
            <Notice tone="warn" title="Automated analysis is unavailable">No AI service is configured, so no automated analysis was run and none is implied below.</Notice>
            <div className="card text-sm">
              <h2 className="text-lg font-semibold">Your summary</h2>
              <p className="mt-1">{out.summary.concern}</p>
              <p className="mt-1 text-muted">Area: {out.summary.bodyArea} · Duration: {out.summary.duration} · Severity: {out.summary.severity}</p>
            </div>
            <div className="card text-sm">
              <h2 className="text-lg font-semibold">General next steps</h2>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Consider speaking to a doctor or pharmacist, especially if the concern is getting worse, lasting, or worrying you.</li>
                <li>Seek urgent care for trouble breathing, chest pain, heavy bleeding that will not stop, confusion, fainting, or signs of a severe allergic reaction.</li>
                <li>Do not start antibiotics or other prescription medicines without a clinician&apos;s advice.</li>
              </ul>
              <p className="mt-2 text-xs text-muted">Specific self-care guidance is not shown until it is sourced and clinically reviewed — see <a className="underline" href="/first-aid">First aid</a>.</p>
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
