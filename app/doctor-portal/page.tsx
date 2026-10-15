import type { Metadata } from "next";
import { Container, DemoBadge, Notice, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth/guards";

// Auth state is per-request: never prerender or cache this page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Doctor portal (demo)" };

const demoRequests = [
  { id: "SYN-001", patient: "Synthetic Patient A", reason: "Follow-up visit (synthetic)", when: "Sample slot" },
  { id: "SYN-002", patient: "Synthetic Patient B", reason: "New consultation (synthetic)", when: "Sample slot" },
];

export default async function DoctorPortalPage() {
  // Server-side gate: only accounts whose profiles.role is 'doctor' or 'admin' get past this line.
  const session = await requireRole(["doctor", "admin"], "/doctor-portal");
  return (
    <>
      <PageHeader title="Doctor portal" intro="Interface for healthcare professionals." />
      <Container className="max-w-3xl space-y-6">
        <Notice tone="danger" title="Demonstration only — synthetic data, no patient records">
          {session.status === "unconfigured"
            ? "Authentication is not configured on this deployment, so this page is open and shows layout only."
            : "Access to this page is restricted by a server-side role check. Doctor verification, patient data and appointments are not implemented: "}
          This page shows synthetic data and must not be used with real patient information. Verification of
          professional registration is a separate process that does not exist yet, so no one is shown as verified.
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
