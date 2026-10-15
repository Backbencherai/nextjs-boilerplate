import type { Metadata } from "next";
import { Container, EmergencyBox, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Safety & limitations" };

export default function SafetyPage() {
  return (
    <>
      <PageHeader title="Medical safety and limitations" intro="What Swasth Setu is, what it is not, and what to do in an emergency." />
      <Container className="max-w-3xl space-y-6">
        <EmergencyBox />
        <section>
          <h2 className="text-xl font-semibold">What Swasth Setu does not do</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>It does not diagnose conditions, including from photos or reports.</li>
            <li>It does not prescribe medicines, antibiotics, creams or doses.</li>
            <li>It does not replace a doctor, emergency services or your own clinician&apos;s advice.</li>
            <li>It does not verify doctors. No provider directory is connected yet.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Emergency numbers — verification status</h2>
          <p className="mt-2 text-sm">
            112 is widely published as India&apos;s single emergency number, but this site has not been able to
            re-verify it against an official source during this build. Before public launch, verify 112 and any
            state-specific numbers (ambulance, women/child helplines, poison information) against official government
            sources and record the check date here. Until then, we do not list other numbers.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Content review</h2>
          <p className="mt-2 text-sm">
            Anatomy descriptions and translations are drafts and have not been reviewed by Indian clinicians. First-aid
            and medicine modules are intentionally unpublished until each statement is checked against its cited
            source. See <code>docs/CONTENT_REVIEW.md</code>.
          </p>
        </section>
      </Container>
    </>
  );
}
