import Link from "next/link";
import { HomeHero } from "@/components/HomeHero";
import { Reveal } from "@/components/Reveal";
import { Container } from "@/components/ui";
import { TOOLS } from "@/lib/tools";
import { Lock, ShieldCheck } from "lucide-react";

const steps = [
  ["Explore", "Browse the body, first-aid topics and medicine information at your own pace."],
  ["Understand", "Paste values from your own report or describe a concern to get plain-language, general information."],
  ["Decide your next step", "See warning signs and questions to bring to a qualified professional."],
  ["Keep track", "Save notes and reminders on your device and delete them whenever you like."],
];

const faqs = [
  ["Does Swasth Setu diagnose conditions?", "No. It never diagnoses from text, photos or reports. It offers education and helps you prepare for a conversation with a professional."],
  ["Is the doctor directory real?", "Not yet. No provider directory is connected, so no doctors are listed. We will not show invented doctors or call anyone “verified” without a documented check."],
  ["Is my information uploaded?", "Notes and reminders stay in your browser. Care-intake photos are not uploaded or analysed. Report text is processed only on the server when you use the explainer, and is not stored."],
  ["Which languages are supported?", "English, Hindi, Marathi and Kannada for the interface. Translations are drafts without clinical review; untranslated text falls back to English with a notice."],
];

export default function Home() {
  return (
    <>
      <HomeHero />

      <Container>
        <Reveal>
          <h2 className="text-2xl font-semibold">What is Swasth Setu?</h2>
          <p className="mt-3 max-w-3xl text-muted">
            “Setu” means bridge. Swasth Setu bridges the gap between medical information and the people it is meant
            for: it explains, it teaches, and it points you toward the right professional — it does not replace one.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t, i) => (
            <Reveal key={t.href} delay={i * 0.04}>
              <Link href={t.href} className="card block h-full transition-shadow hover:shadow-md">
                <t.icon className="h-6 w-6 text-accent" aria-hidden />
                <h3 className="mt-3 font-semibold">{t.title}</h3>
                <p className="mt-1 text-sm text-muted">{t.body}</p>
                <p className="mt-3 text-xs font-semibold text-accent-strong">{t.status}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>

      <section className="bg-charcoal text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-4">
            {steps.map(([t, b], i) => (
              <li key={t}>
                <span className="text-sm font-semibold text-emerald-400">Step {i + 1}</span>
                <h3 className="mt-1 font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-white/70">{b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Container className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <ShieldCheck className="h-6 w-6 text-accent" aria-hidden />
          <h2 className="mt-2 text-xl font-semibold">Education and safety first</h2>
          <p className="mt-2 text-sm text-muted">
            Clinical content is only published with a visible source and review date. Where we have not yet verified a
            source, the page says so and shows no instructions. Read our <Link className="underline" href="/safety">safety and limitations</Link>.
          </p>
        </div>
        <div className="card">
          <Lock className="h-6 w-6 text-accent" aria-hidden />
          <h2 className="mt-2 text-xl font-semibold">Privacy by default</h2>
          <p className="mt-2 text-sm text-muted">
            We collect only what a feature needs, keep personal notes on your device, and never place API keys in the
            browser. See the <Link className="underline" href="/privacy">privacy policy</Link>.
          </p>
        </div>
      </Container>

      <Container>
        <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
        <div className="mt-4 divide-y divide-line rounded-2xl border border-line">
          {faqs.map(([q, a]) => (
            <details key={q} className="group p-4">
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="mt-2 text-sm text-muted">{a}</p>
            </details>
          ))}
        </div>
      </Container>
    </>
  );
}
