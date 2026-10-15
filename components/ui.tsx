import { FlaskConical, Info } from "lucide-react";

export function PageHeader({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-lg text-muted">{intro}</p>
        {children}
      </div>
    </section>
  );
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-7xl px-4 py-10 sm:px-6 ${className}`}>{children}</div>;
}

export function DemoBadge({ children = "Demo data" }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
      <FlaskConical className="h-3.5 w-3.5" aria-hidden /> {children}
    </span>
  );
}

export function Notice({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "info" | "warn" | "danger";
}) {
  const tones = {
    info: "border-blue/30 bg-blue-50/60",
    warn: "border-amber-300 bg-amber-50",
    danger: "border-red-300 bg-red-50",
  } as const;
  return (
    <div role="note" className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="flex items-center gap-2 font-semibold">
        <Info className="h-4 w-4" aria-hidden /> {title}
      </p>
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
