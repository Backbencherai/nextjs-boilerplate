import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Lock, ShieldCheck, Search, Layers, MousePointerClick } from "lucide-react";
import { HomeHero } from "@/components/HomeHero";
import { Reveal } from "@/components/Reveal";
import { Container, StatusPill } from "@/components/ui";
import AnatomyLabLoader from "@/components/anatomy/AnatomyLabLoader";
import { TOOLS } from "@/lib/tools";

const steps = [
  ["Explore", "Browse the body, first-aid topics and medicine information at your own pace."],
  ["Understand", "Paste values from your own report or describe a concern to get plain-language, general information."],
  ["Decide your next step", "See warning signs and questions to bring to a qualified professional."],
  ["Keep track", "Save notes and reminders on your device — or in your account — and delete them whenever you like."],
];

const faqs = [
  ["Does Swasth Setu diagnose conditions?", "No. It never diagnoses from text, photos or reports. It offers education and helps you prepare for a conversation with a professional."],
  ["Is the doctor directory real?", "Not yet. No provider directory is connected, so no doctors are listed. We will not show invented doctors or call anyone “verified” without a documented check."],
  ["Is my information uploaded?", "Notes and reminders stay in your browser unless you sign in. Care-intake photos are not uploaded or analysed. Report text is processed only on the server when you use the explainer, and is not stored."],
  ["Which languages are supported?", "English, Hindi, Marathi and Kannada for the interface. Translations are drafts without clinical review; untranslated text falls back to English with a notice."],
];

const bento = [
  { src: "/images/atlas/atlas-skeleton-organs.jpg", alt: "Rendered skeleton with lungs, liver and stomach visible inside the ribcage", w: 1000, h: 1250, title: "A body you can open up", body: "Skeleton, muscles, heart, lungs and digestive organs — layer by layer.", href: "/anatomy", span: "lg:row-span-2" },
  { src: "/images/atlas/atlas-heart.jpg", alt: "Rendered heart and lungs seen from the front", w: 1200, h: 900, title: "Organs in context", body: "See where structures sit and what they sit next to.", href: "/anatomy", span: "" },
  { src: "/images/atlas/atlas-skull.jpg", alt: "Rendered skull and cervical spine in three-quarter view", w: 1200, h: 900, title: "Searchable by name", body: "Over a thousand named structures, one search box away.", href: "/anatomy", span: "" },
];

export default function Home() {
  return (
    <>
      <HomeHero />

      {/* Live 3D lab */}
      <section className="on-dark bg-charcoal-2 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <p className="eyebrow">Interactive anatomy lab</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight">Explore the human body in real 3D</h2>
            <p className="mt-4 max-w-md text-white/70">
              Rotate, zoom and select. Switch body systems on and off, search for a structure by name, and read plain-language
              notes where they have been reviewed.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              {[[MousePointerClick, "Click any structure to select and focus it"], [Layers, "Skeleton, muscles, heart, lungs, digestive and more"], [Search, "Search over a thousand named structures"]].map(([I, t]) => {
                const Icon = I as typeof Search;
                return <li key={t as string} className="flex items-center gap-3"><Icon className="h-4 w-4 text-accent-bright" aria-hidden />{t as string}</li>;
              })}
            </ul>
            <Link href="/anatomy" className="btn btn-primary mt-8">Open the full lab <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            <p className="mt-4 text-xs text-white/50">Model adapted from Z-Anatomy (CC BY-SA 4.0). Simplified; some structures omitted. <Link className="underline" href="/credits">Credits</Link></p>
          </Reveal>
          <Reveal delay={0.1}>
            <AnatomyLabLoader compact />
          </Reveal>
        </div>
      </section>

      {/* Bento imagery */}
      <Container>
        <Reveal>
          <p className="eyebrow">Anatomy atlas</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight">Understanding starts with seeing</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:grid-rows-2">
          {bento.map((b, i) => (
            <Reveal key={b.src} delay={i * 0.06} className={b.span}>
              <Link href={b.href} className="group relative block h-full overflow-hidden rounded-3xl bg-charcoal">
                <Image src={b.src} alt={b.alt} width={b.w} height={b.h} sizes="(min-width: 1024px) 50vw, 100vw" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 pt-24 text-white">
                  <h3 className="display text-2xl font-semibold">{b.title}</h3>
                  <p className="mt-1 max-w-sm text-sm text-white/75">{b.body}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* Tools */}
      <section className="border-y border-line bg-surface">
        <Container>
          <Reveal>
            <p className="eyebrow">Tools</p>
            <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight">Everything labelled with what really works today</h2>
            <p className="mt-3 max-w-2xl text-muted">No filler features. Each tool says plainly whether it is live, partly working, or waiting for verified sources.</p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((t, i) => (
              <Reveal key={t.href} delay={i * 0.03}>
                <Link href={t.href} className="card card-hover flex h-full flex-col">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><t.icon className="h-5 w-5" aria-hidden /></span>
                  <h3 className="mt-4 text-lg font-semibold">{t.title}</h3>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{t.body}</p>
                  <div className="mt-4"><StatusPill kind={t.kind}>{t.status}</StatusPill></div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* How it works */}
      <Container>
        <Reveal><p className="eyebrow">How it works</p><h2 className="mt-3 text-4xl font-semibold">Four calm steps</h2></Reveal>
        <ol className="mt-10 grid gap-8 md:grid-cols-4">
          {steps.map(([t, b], i) => (
            <Reveal key={t} delay={i * 0.06}>
              <li className="relative border-t border-line pt-6">
                <span className="display absolute -top-5 left-0 bg-background pr-3 text-4xl font-semibold text-accent/80">{i + 1}</span>
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{b}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>

      {/* Trust */}
      <section className="on-dark bg-charcoal text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-20 sm:px-6 md:grid-cols-2">
          <Reveal>
            <div className="panel-dark h-full p-8">
              <ShieldCheck className="h-7 w-7 text-accent-bright" aria-hidden />
              <h2 className="mt-4 text-2xl font-semibold">Education and safety first</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Clinical content is published only with a visible source and review date. Where a source has not been verified, the page says so and shows no instructions.
              </p>
              <Link className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent-bright hover:underline" href="/safety">Safety &amp; limitations <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="panel-dark h-full p-8">
              <Lock className="h-7 w-7 text-accent-bright" aria-hidden />
              <h2 className="mt-4 text-2xl font-semibold">Privacy by default</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                We collect only what a feature needs, keep personal notes on your device unless you sign in, and never place API keys in the browser.
              </p>
              <Link className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent-bright hover:underline" href="/privacy">Privacy policy <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <Container className="max-w-4xl">
        <h2 className="text-4xl font-semibold">Frequently asked questions</h2>
        <div className="mt-8 divide-y divide-line rounded-3xl border border-line bg-white">
          {faqs.map(([q, a]) => (
            <details key={q} className="group p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}<span className="text-xl text-accent transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </Container>
    </>
  );
}
