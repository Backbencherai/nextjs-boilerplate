import { Box, ClipboardList, FileText, Pill, Stethoscope, Cross, MessageCircle, LayoutDashboard } from "lucide-react";

export const TOOLS = [
  { href: "/anatomy", title: "Anatomy lab", icon: Box, status: "Working (schematic model)", body: "Rotate and explore a 3D body, toggle systems, search structures." },
  { href: "/care", title: "Care guidance", icon: ClipboardList, status: "Working form · no automated analysis", body: "Describe a concern and get safe, general next-step information and warning signs." },
  { href: "/first-aid", title: "First aid", icon: Cross, status: "Pending source verification", body: "Learning modules built from Red Cross sources once each step is checked." },
  { href: "/reports", title: "Report explainer", icon: FileText, status: "Working (values you paste) · AI off", body: "Compare your values with the reference range printed on your own report." },
  { href: "/medicines", title: "Medicine guide", icon: Pill, status: "Empty — awaiting verified data", body: "Searchable guide that only lists medicines with documented sources." },
  { href: "/doctors", title: "Find doctors", icon: Stethoscope, status: "No provider connected", body: "Search interface ready for a legitimate provider directory." },
  { href: "/assistant", title: "Health education assistant", icon: MessageCircle, status: "Needs AI credentials", body: "Plain-language explanations and doctor-visit question lists." },
  { href: "/dashboard", title: "Dashboard & care companion", icon: LayoutDashboard, status: "Working (stored on this device)", body: "Reminders, notes and saved items — kept in your browser, deletable anytime." },
] as const;
