"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Container, Notice, PageHeader } from "@/components/ui";
import { MEDICINES } from "@/lib/content/medicines";

export default function MedicinesPage() {
  const [q, setQ] = useState("");
  const results = MEDICINES.filter((m) => `${m.generic} ${(m.brands ?? []).join(" ")}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <PageHeader title="Medicine information guide" intro="General, sourced information about medicines — never personal advice or doses." />
      <Container className="max-w-3xl space-y-6">
        <Notice tone="warn" title="No medicines published yet">
          The dataset is empty on purpose. Each entry will need a source link and review date before it appears. For
          doses, pregnancy, children, allergies, interactions or existing conditions, ask a doctor or pharmacist.
        </Notice>
        <div>
          <label htmlFor="med-q" className="label">Search by generic or brand name</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" aria-hidden />
            <input id="med-q" className="input pl-9" type="search" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {results.length === 0 ? (
          <p className="card text-sm text-muted">
            {MEDICINES.length === 0 ? "There are no verified medicine entries to search yet." : `No entries match “${q}”.`}
          </p>
        ) : (
          results.map((m) => (
            <article key={m.generic} className="card">
              <h2 className="text-xl font-semibold">{m.generic}</h2>
              <p className="text-sm">{m.purpose}</p>
              <p className="mt-2 text-xs text-muted">Reviewed {m.reviewed}</p>
            </article>
          ))
        )}
      </Container>
    </>
  );
}
