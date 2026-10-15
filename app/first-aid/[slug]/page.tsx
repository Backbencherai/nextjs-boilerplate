import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, EmergencyBox, Notice, PageHeader } from "@/components/ui";
import { FIRST_AID } from "@/lib/content/firstAid";

export function generateStaticParams() {
  return FIRST_AID.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = FIRST_AID.find((x) => x.slug === slug);
  return { title: m?.title ?? "First aid" };
}

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = FIRST_AID.find((x) => x.slug === slug);
  if (!m) notFound();
  const published = m.status === "published" && m.reviewed;

  return (
    <>
      <PageHeader title={m.title} intro={m.intro} />
      <Container className="max-w-3xl space-y-6">
        <EmergencyBox />
        {!published ? (
          <Notice tone="warn" title="Instructions not published yet">
            This module has no steps because they have not been verified against the sources below. Please use the
            sources directly, or call a doctor or emergency services if unsure.
          </Notice>
        ) : (
          <>
            <section>
              <h2 className="text-xl font-semibold">Steps</h2>
              <ol className="mt-2 list-decimal space-y-2 pl-5">{m.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </section>
            <section>
              <h2 className="text-xl font-semibold">Warnings</h2>
              <ul className="mt-2 list-disc pl-5">{m.warnings.map((s) => <li key={s}>{s}</li>)}</ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold">Get professional help if</h2>
              <ul className="mt-2 list-disc pl-5">{m.seekHelp.map((s) => <li key={s}>{s}</li>)}</ul>
            </section>
          </>
        )}
        <section className="text-sm">
          <h2 className="font-semibold">Sources</h2>
          <ul className="mt-1 list-disc pl-5">
            {m.sources.map((s) => (
              <li key={s.url}><a className="underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
            ))}
          </ul>
          <p className="mt-2 text-muted">Review date: {m.reviewed ?? "not yet reviewed"}. Educational only; not a substitute for professional care.</p>
        </section>
      </Container>
    </>
  );
}
