"use client";

import { useState } from "react";
import { Container, DemoBadge, Notice, PageHeader } from "@/components/ui";
import { SAMPLE_REPORT, type ParsedResult } from "@/lib/reports/parse";

const MAX_BYTES = 200_000;
const FLAG: Record<ParsedResult["flag"], string> = {
  "below-range": "Below the range printed on your report",
  "above-range": "Above the range printed on your report",
  "within-range": "Within the range printed on your report",
  "cannot-interpret": "Cannot interpret",
};

export default function ReportsPage() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<ParsedResult[] | null>(null);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    const ok = /\.(txt|csv)$/i.test(f.name) || f.type === "text/plain" || f.type === "text/csv";
    if (!ok) return setError("Unsupported file. PDFs and images cannot be read yet — please paste the values as text, or upload a .txt/.csv file.");
    if (f.size > MAX_BYTES) return setError("File is larger than 200 KB. Please paste only the relevant lines.");
    setText(await f.text());
    setDemo(false);
  }

  async function explain(sample = false) {
    const body = sample ? SAMPLE_REPORT : text;
    setError("");
    setDemo(sample);
    if (sample) setText(SAMPLE_REPORT);
    const r = await fetch("/api/reports/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: body }) });
    const j = await r.json();
    if (!r.ok) return setError(j.error ?? "Something went wrong.");
    setResults(j.results);
  }

  return (
    <>
      <PageHeader title="Report explainer" intro="Paste values from your own report. Swasth Setu compares each value only with the range printed on your report." />
      <Container className="max-w-3xl space-y-6">
        <Notice title="What this does — and does not do">
          It does not diagnose, and does not use its own reference ranges: laboratories differ. AI explanations are
          not enabled, so plain-language test descriptions are not shown. Your text is processed on the server for
          this comparison only and is not stored.
        </Notice>
        <div className="card space-y-3">
          <label htmlFor="rep" className="label">Report text, one result per line (e.g. “Haemoglobin 11.2 g/dL (12.0 - 15.5)”)</label>
          <textarea id="rep" className="input min-h-[160px] font-mono text-sm" maxLength={20000} value={text} onChange={(e) => { setText(e.target.value); setDemo(false); }} />
          <div className="flex flex-wrap items-center gap-3">
            <input type="file" accept=".txt,.csv,text/plain,text/csv" onChange={onFile} aria-label="Upload text report" className="text-sm" />
            <button className="btn btn-primary" disabled={!text.trim()} onClick={() => explain(false)}>Compare with printed ranges</button>
            <button className="btn btn-secondary" onClick={() => explain(true)}>Try a sample report</button>
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>

        {results && (
          <section aria-live="polite" className="space-y-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold">Results {demo && <DemoBadge>Sample report</DemoBadge>}</h2>
            {results.map((r, i) => (
              <article key={i} className="card text-sm">
                <p className="font-semibold">{r.test}{r.value !== null && <> — {r.value} {r.unit}</>}</p>
                {r.rangeLow !== null && <p className="text-muted">Printed range: {r.rangeLow} – {r.rangeHigh}</p>}
                <p className={r.flag === "cannot-interpret" ? "text-amber-800" : ""}>{FLAG[r.flag]}</p>
                {r.reason && <p className="text-muted">{r.reason}</p>}
              </article>
            ))}
            <Notice title="Questions you could ask your clinician">
              <ul className="list-disc pl-5">
                <li>What does each flagged result mean for me specifically?</li>
                <li>Could medicines, food, time of day or other factors have affected these values?</li>
                <li>Do any of these need repeating, and when?</li>
              </ul>
            </Notice>
          </section>
        )}
      </Container>
    </>
  );
}
