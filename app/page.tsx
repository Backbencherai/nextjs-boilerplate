import Link from "next/link";
import Logo from "@/components/Logo";
import { PLANS, formatInr } from "@/lib/plans";
import { AGENTS } from "@/lib/agents";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6">
      <nav className="flex items-center justify-between py-6">
        <Logo />
        <div className="flex items-center gap-3 text-sm">
          <a href="#pricing" className="text-[var(--muted)] hover:text-white">Pricing</a>
          <Link href="/dashboard" className="btn">Open dashboard</Link>
        </div>
      </nav>

      <section className="py-24 text-center">
        <div className="mb-8 flex justify-center"><Logo size={96} word={false} /></div>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">AI that runs your company,<br />while you sleep.</h1>
        <p className="mx-auto mt-6 max-w-xl text-[var(--muted)]">
          Orvia gives you a team of autonomous agents for strategy, engineering, marketing and support — with human approval before anything goes live.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/dashboard" className="btn">Start free</Link>
          <a href="#pricing" className="btn-ghost">See plans</a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AGENTS.map((a) => (
          <div key={a.id} className="panel p-5">
            <div className="text-sm text-[var(--muted)]">{a.role}</div>
            <div className="mt-1 text-lg font-semibold">{a.name}</div>
            <p className="mt-2 text-sm text-[var(--muted)]">{a.needsApproval ? "Actions wait for your approval." : "Runs freely, read-only."}</p>
          </div>
        ))}
      </section>

      <section id="pricing" className="py-24">
        <h2 className="text-center text-3xl font-bold">Simple pricing in ₹</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.id} className={`panel p-6 ${p.highlight ? "ring-2 ring-[#7c5cff]" : ""}`}>
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{p.blurb}</p>
              <div className="mt-5 text-4xl font-bold">{formatInr(p.priceInr)}<span className="text-sm font-normal text-[var(--muted)]"> /month</span></div>
              <ul className="mt-5 space-y-2 text-sm">
                {p.features.map((f) => <li key={f}>✓ {f}</li>)}
              </ul>
              <Link href="/dashboard" className={`mt-6 block text-center ${p.highlight ? "btn" : "btn-ghost"}`}>Choose {p.name}</Link>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-[var(--muted)]">Prices exclude 18% GST.</p>
      </section>
    </main>
  );
}
