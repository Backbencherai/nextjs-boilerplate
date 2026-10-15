import type { Metadata } from "next";
import { Container, DemoBadge, Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Doctor portal (demo)" };

const demoRequests = [
  { id: "SYN-001", patient: "Synthetic Patient A", reason: "Follow-up visit (synthetic)", when: "Sample slot" },
  { id: "SYN-002", patient: "Synthetic Patient B", reason: "New consultation (synthetic)", when: "Sample slot" },
];

export default function DoctorPortalPage() {
  return (
    <>
      <PageHeader title="Doctor portal" intro="Interface for healthcare professionals." />
      <Container className="max-w-3xl space-y-6">
        <Notice tone="danger" title="Demonstration only — no real authentication or data">
          There is no login, no role-based access control and no backend here. This page shows layout with synthetic
          data. It must not be used with real patient information. Real access control has to be enforced on the
          server (verified identity, role, and per-record authorization) before launch.
        </Notice>
        <section className="card">
          <h2 className="flex items-center gap-2 text-lg font-semibold">Profile <DemoBadge /></h2>
          <p className="mt-2 text-sm">Verification status: <strong>Not verified</strong> (no verification process exists yet).</p>
        </section>
        <section className="card">
          <h2 className="flex items-center gap-2 text-lg font-semibold">Appointment requests <DemoBadge>Synthetic</DemoBadge></h2>
          <ul className="mt-2 divide-y divide-line text-sm">
            {demoRequests.map((r) => (
              <li key={r.id} className="py-2">{r.id} — {r.patient} · {r.reason} · {r.when}</li>
            ))}
          </ul>
        </section>
      </Container>
    </>
  );
}
