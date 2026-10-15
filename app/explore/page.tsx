import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/ui";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = { title: "Explore" };

export default function ExplorePage() {
  return (
    <>
      <PageHeader
        title="Explore your health"
        intro="Every tool below is labelled with what actually works today, so you always know what you are using."
      />
      <Container>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="card block transition-shadow hover:shadow-md">
              <t.icon className="h-6 w-6 text-accent" aria-hidden />
              <h2 className="mt-3 font-semibold">{t.title}</h2>
              <p className="mt-1 text-sm text-muted">{t.body}</p>
              <p className="mt-3 text-xs font-semibold text-accent-strong">{t.status}</p>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
