export type Plan = {
  id: "starter" | "pro" | "scale";
  name: string;
  priceInr: number;
  blurb: string;
  features: string[];
  highlight?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceInr: 0,
    blurb: "Try your first autonomous company.",
    features: ["1 company", "2 agents", "20 agent runs / month", "Community support"],
  },
  {
    id: "pro",
    name: "Pro",
    priceInr: 3999,
    blurb: "Full autonomous operation for a growing business.",
    features: [
      "3 companies",
      "All 4 agents",
      "1,000 agent runs / month",
      "Repository connector",
      "Human approval gates",
      "Priority support",
    ],
    highlight: true,
  },
  {
    id: "scale",
    name: "Scale",
    priceInr: 11999,
    blurb: "For teams running many companies at once.",
    features: [
      "Unlimited companies",
      "Unlimited agent runs",
      "Audit log export",
      "Custom agents",
      "SSO & role-based access",
      "Dedicated support",
    ],
  },
];

export const formatInr = (n: number) =>
  n === 0 ? "₹0" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
