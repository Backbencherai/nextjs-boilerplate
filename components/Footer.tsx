import Link from "next/link";
import { HeartPulse } from "lucide-react";

const cols = [
  {
    title: "Tools",
    links: [
      ["/anatomy", "Anatomy lab"],
      ["/care", "Care guidance"],
      ["/first-aid", "First aid"],
      ["/reports", "Report explainer"],
      ["/medicines", "Medicine guide"],
      ["/doctors", "Find doctors"],
    ],
  },
  {
    title: "Your space",
    links: [
      ["/dashboard", "Dashboard"],
      ["/assistant", "Assistant"],
      ["/auth", "Sign in"],
      ["/doctor-portal", "Doctor portal (demo)"],
      ["/admin", "Admin"],
    ],
  },
  {
    title: "Trust",
    links: [
      ["/safety", "Safety & limitations"],
      ["/privacy", "Privacy policy"],
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 bg-charcoal text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <HeartPulse className="h-6 w-6 text-emerald-400" aria-hidden /> Swasth Setu
          </div>
          <p className="mt-3 text-sm text-white/70">
            Health education and care navigation. Not a medical service.
          </p>
          <p className="mt-4 text-sm text-white/70">
            Contact: <span className="italic">[contact email — to be added]</span>
            <br />
            Address: <span className="italic">[registered address — to be added]</span>
          </p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">{c.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-white/85 hover:text-white hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Swasth Setu. In an emergency call 112 (India) or your local emergency number.
      </div>
    </footer>
  );
}
