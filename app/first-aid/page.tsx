import type { Metadata } from "next";
import Link from "next/link";
import { Container, EmergencyBox, Notice, PageHeader } from "@/components/ui";
import { FIRST_AID } from "@/lib/content/firstAid";

export const metadata: Metadata = { title: "First-aid learning centre" };

export default function FirstAidPage() {
  return (
    <>
      <PageHeader title="First-aid learning centre" intro="Step-by-step modules, each with a visible source and review date." />
      <Container className="space-y-6">
        <EmergencyBox />
        <Notice tone="warn" title="Modules are awaiting source verification">
          We could not check the Red Cross sources while building this app, and we will not invent medical guidance.
          Each module below shows its sources and stays empty until a reviewer verifies every step.
        </Notice>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIRST_AID.map((m) => (
            <Link key={m.slug} href={`/first-aid/${m.slug}`} className="card block hover:shadow-md">
              <h2 className="font-semibold">{m.title}</h2>
              <p className="mt-1 text-sm text-muted">{m.intro}</p>
              <p className="mt-3 text-xs font-semibold text-amber-800">
                {m.status === "published" ? `Reviewed ${m.reviewed}` : "Pending source verification"}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
