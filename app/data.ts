// ─────────────────────────────────────────────────────────────
//  Edit everything about the portfolio here.
//  All text below is placeholder copy — replace it with your own.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: "Adarsh",
  fullName: "Adarsh",
  initials: "AD",
  role: "Full-Stack Developer & Designer",
  /** Hero paragraph. Wrap words in **double asterisks** to make them bold. */
  tagline:
    "I design and build **fast, stylish web experiences** — from pixel-perfect landing pages to **production-grade full-stack apps**.",
  email: "hello@adarsh.dev",
  location: "India",
  available: true,
  /** Put your photo in /public (e.g. /me.png, transparent PNG works best) and set it here. */
  photo: "",
  statusBadge: "OPEN TO NEW PROJECTS",
  stats: [
    { value: "25+", label: "Projects" },
    { value: "3+ yrs", label: "Experience" },
    { value: "100%", label: "Responsive" },
  ],
  techTags: ["React", "Next.js", "TypeScript", "Node.js", "Tailwind", "Figma"],
  socials: [
    { label: "GitHub", handle: "github.com/adarsh", href: "https://github.com/", icon: "github" },
    { label: "LinkedIn", handle: "linkedin.com/in/adarsh", href: "https://linkedin.com/", icon: "linkedin" },
    { label: "Twitter / X", handle: "x.com/adarsh", href: "https://x.com/", icon: "twitter" },
    { label: "Instagram", handle: "@adarsh", href: "https://instagram.com/", icon: "instagram" },
  ],
} as const;

export const highlights = [
  {
    idx: "01.",
    tag: "FRONTEND",
    title: "Pixel-Perfect UI",
    desc: "Responsive interfaces with smooth motion that look great on any device.",
  },
  {
    idx: "02.",
    tag: "BACKEND",
    title: "Solid APIs",
    desc: "Clean, typed services and databases built to scale with the product.",
  },
  {
    idx: "03.",
    tag: "DESIGN",
    title: "Superb Animations",
    desc: "Scroll reveals, micro-interactions and polish that make pages feel alive.",
  },
];

export const about = {
  paragraphs: [
    "I'm Adarsh — a developer who loves turning ideas into clean, stylish and very simple products. I started out building landing pages and grew into shipping complete full-stack applications.",
    "I care about the details: performance, accessibility, and the small animations that make an interface feel effortless. I enjoy working end-to-end — from the first Figma frame to the final deploy.",
  ],
  quote:
    "Good design is invisible. Great design moves — it guides the eye, tells a story, and gets out of the way.",
  principles: [
    {
      num: "01",
      title: "Fully Responsive",
      desc: "Every layout is carefully thought-out to look great on phones, tablets and desktops.",
    },
    {
      num: "02",
      title: "Superb Design",
      desc: "Clean typography, considered spacing and a consistent visual system.",
    },
    {
      num: "03",
      title: "Built to Last",
      desc: "Typed, tested and maintainable code that's easy to extend.",
    },
  ],
};

/** The large featured project, with an interactive tab explorer. */
export const flagship = {
  badge: "FEATURED PROJECT",
  meta: "Next.js • TypeScript • PostgreSQL • Vercel",
  title: "SAVO — Stylish App Landing Platform",
  desc: "A landing-page builder that turns a few inputs into a polished, animated product page. Includes a theme engine, scroll-reveal motion presets and one-click deploys.",
  metrics: [
    { num: "12", desc: "Themes" },
    { num: "40+", desc: "Components" },
    { num: "98", desc: "Lighthouse" },
    { num: "1-click", desc: "Deploy" },
  ],
  explorerTitle: "BUILD STACK",
  explorerSub: "Click a layer to inspect implementation",
  layers: [
    {
      tab: "L1: UI",
      badge: "LAYER 01 // INTERFACE",
      title: "Component Library",
      desc: "Reusable, accessible React components styled with Tailwind and design tokens.",
      tags: ["React", "Tailwind"],
    },
    {
      tab: "L2: Motion",
      badge: "LAYER 02 // ANIMATION",
      title: "Scroll-Reveal Engine",
      desc: "IntersectionObserver-powered reveals: elements enter from top, left, right or bottom and move 40px over 1s.",
      tags: ["IntersectionObserver", "CSS Transitions"],
    },
    {
      tab: "L3: API",
      badge: "LAYER 03 // SERVER",
      title: "Typed Route Handlers",
      desc: "Next.js route handlers with schema validation and edge caching.",
      tags: ["Next.js", "Zod"],
    },
    {
      tab: "L4: Data",
      badge: "LAYER 04 // PERSISTENCE",
      title: "Relational Storage",
      desc: "PostgreSQL with a typed ORM, migrations and seed data.",
      tags: ["PostgreSQL", "Prisma"],
    },
    {
      tab: "L5: Deploy",
      badge: "LAYER 05 // DELIVERY",
      title: "CI/CD Pipeline",
      desc: "Preview deploys for every branch, automatic production releases on merge.",
      tags: ["GitHub Actions", "Vercel"],
    },
  ],
};

export const subProjects = [
  {
    badge: "WEB // E-COMMERCE",
    title: "ShopLite — Storefront",
    desc: "A headless storefront with a blazing-fast product grid, cart and checkout.",
    specs: ["Server components & streaming", "Stripe checkout", "Image CDN optimisation"],
    tags: ["Next.js", "Stripe"],
  },
  {
    badge: "MOBILE // PRODUCT",
    title: "TaskFlow — Productivity App",
    desc: "A cross-platform to-do and habit tracker with offline sync.",
    specs: ["Offline-first storage", "Push reminders", "Dark & light themes"],
    tags: ["React Native", "SQLite"],
  },
  {
    badge: "DESIGN // BRANDING",
    title: "Studio Kit — Design System",
    desc: "A Figma + code design system powering several marketing sites.",
    specs: ["Token-driven theming", "60+ components", "Docs site"],
    tags: ["Figma", "Storybook"],
  },
];

export type Category = "web" | "design" | "tools";

export const projects: {
  title: string;
  chip: string;
  category: Category;
  desc: string;
  tags: string[];
  href?: string;
}[] = [
  {
    title: "Portfolio Template",
    chip: "Web",
    category: "web",
    desc: "This site — a stylish, very simple portfolio with scroll-reveal motion.",
    tags: ["Next.js", "CSS"],
    href: "https://github.com/",
  },
  {
    title: "Weather Dashboard",
    chip: "Web",
    category: "web",
    desc: "Live forecasts with animated charts and location search.",
    tags: ["React", "Charts"],
  },
  {
    title: "Brand Identity — Café",
    chip: "Design",
    category: "design",
    desc: "Logo, palette and menu design for a local coffee shop.",
    tags: ["Illustrator", "Branding"],
  },
  {
    title: "CLI Scaffolder",
    chip: "Tools",
    category: "tools",
    desc: "A command-line tool that scaffolds projects from templates.",
    tags: ["Node.js", "CLI"],
    href: "https://github.com/",
  },
  {
    title: "Mobile App UI Kit",
    chip: "Design",
    category: "design",
    desc: "A 40-screen UI kit for fitness and wellness apps.",
    tags: ["Figma", "UI Kit"],
  },
  {
    title: "Blog Engine",
    chip: "Web",
    category: "web",
    desc: "MDX-powered blog with search, tags and RSS.",
    tags: ["MDX", "Next.js"],
  },
];

