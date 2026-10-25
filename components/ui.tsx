import { FlaskConical, Info, ShieldAlert, TriangleAlert } from "lucide-react";

export function PageHeader({ title, intro, eyebrow, children }: { title: string; intro: string; eyebrow?: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      <div className="grid-pattern-light pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{intro}</p>
        {children}
      </div>
    </section>
  );
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-7xl px-4 py-12 sm:px-6 ${className}`}>{children}</div>;
}

export function DemoBadge({ children = "Demo data" }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
      <FlaskConical className="h-3.5 w-3.5" aria-hidden /> {children}
    </span>
  );
}

export function StatusPill({ kind, children }: { kind: "live" | "partial" | "pending"; children: React.ReactNode }) {
  return <span className={`status-pill status-${kind}`}><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />{children}</span>;
}

export function Notice({ title, children, tone = "info" }: { title: string; children: React.ReactNode; tone?: "info" | "warn" | "danger" }) {
  const tones = {
    info: { box: "border-[#c9dcec] bg-[#f1f6fb]", icon: "text-blue", Icon: Info },
    warn: { box: "border-amber-300 bg-amber-50", icon: "text-amber-700", Icon: TriangleAlert },
    danger: { box: "border-red-300 bg-red-50", icon: "text-red-700", Icon: ShieldAlert },
  } as const;
  const t = tones[tone];
  return (
    <div role="note" className={`rounded-2xl border p-4 ${t.box}`}>
      <p className="flex items-center gap-2 font-semibold"><t.Icon className={`h-4 w-4 ${t.icon}`} aria-hidden /> {title}</p>
      <div className="mt-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

/** Emergency block. 112 is India's single emergency number (ERSS); confirm per state before launch. */
export function EmergencyBox() {
  return (
    <Notice tone="danger" title="Emergency? Do not wait for this website.">
      Call <strong>112</strong> (India&apos;s unified emergency number) or your local emergency number, or go to the
      nearest hospital. Availability and extra numbers (for example ambulance numbers) differ by state and are{" "}
      <em>not yet verified by Swasth Setu</em> — see <a className="underline" href="/safety">Safety</a>.
    </Notice>
  );
}
