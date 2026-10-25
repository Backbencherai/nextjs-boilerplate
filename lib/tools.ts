import { Box, ClipboardList, FileText, Pill, Stethoscope, Cross, MessageCircle, LayoutDashboard } from "lucide-react";

export type ToolStatus = "live" | "partial" | "pending";

export const TOOLS = [
  { href: "/anatomy", title: "Anatomy lab", icon: Box, kind: "live" as ToolStatus, status: "Working · real 3D atlas", body: "Rotate and explore a 3D body, toggle systems, search over a thousand structures." },
  { href: "/care", title: "Care guidance", icon: ClipboardList, kind: "partial" as ToolStatus, status: "Form works · no automated analysis", body: "Describe a concern and get safe, general next-step information and warning signs." },
  { href: "/first-aid", title: "First aid", icon: Cross, kind: "pending" as ToolStatus, status: "Awaiting source verification", body: "Learning modules built from Red Cross sources once each step is checked." },
  { href: "/reports", title: "Report explainer", icon: FileText, kind: "partial" as ToolStatus, status: "Value comparison works · AI off", body: "Compare your values with the reference range printed on your own report." },
  { href: "/medicines", title: "Medicine guide", icon: Pill, kind: "pending" as ToolStatus, status: "Empty — awaiting verified data", body: "Searchable guide that only lists medicines with documented sources." },
  { href: "/doctors", title: "Find doctors", icon: Stethoscope, kind: "pending" as ToolStatus, status: "No provider connected", body: "Search interface ready for a legitimate provider directory." },
  { href: "/assistant", title: "Health education assistant", icon: MessageCircle, kind: "partial" as ToolStatus, status: "Needs AI credentials", body: "Plain-language explanations and doctor-visit question lists." },
  { href: "/dashboard", title: "Dashboard & care companion", icon: LayoutDashboard, kind: "live" as ToolStatus, status: "Working · device or account", body: "Reminders and notes — in your browser, or in your account if you sign in." },
];
