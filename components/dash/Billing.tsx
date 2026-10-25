import { PLANS, formatInr } from "@/lib/plans";

export default function Billing() {
  return (
    <div>
      <p className="mb-4 text-sm text-[var(--muted)]">You're on <b className="text-white">Starter</b>. Online payments (Razorpay) are not connected yet, so upgrade buttons are disabled.</p>
      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.id} className={`panel p-6 ${p.highlight ? "ring-2 ring-[#7c5cff]" : ""}`}>
            <h3 className="font-semibold">{p.name}</h3>
            <div className="mt-3 text-3xl font-bold">{formatInr(p.priceInr)}<span className="text-sm font-normal text-[var(--muted)]"> /mo</span></div>
            <ul className="mt-4 space-y-1.5 text-sm">{p.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
            <button disabled className="btn-ghost mt-5 w-full opacity-60">{p.id === "starter" ? "Current plan" : "Coming soon"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
