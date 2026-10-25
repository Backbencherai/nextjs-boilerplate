import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader, StatusPill } from "@/components/ui";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = { title: "Explore" };

export default function ExplorePage() {
  return (
    <>
      <PageHeader
        eyebrow="Explore"
        title="Explore your health"
        intro="Every tool below is labelled with what actually works today, so you always know what you are using."
      />
      <Container>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="card card-hover block">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><t.icon className="h-5 w-5" aria-hidden /></span>
              <h2 className="mt-3 font-semibold">{t.title}</h2>
              <p className="mt-1 text-sm text-muted">{t.body}</p>
              <div className="mt-4"><StatusPill kind={t.kind}>{t.status}</StatusPill></div>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
