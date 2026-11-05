// ─────────────────────────────────────────────────────────────
// ALL of Dewanshi's content lives in this one file.
// Anything marked "EDIT" is a placeholder: LinkedIn could not be read
// automatically, so replace it with her real details.
// Images: drop files into /public and reference them as "/file.jpg".
// ─────────────────────────────────────────────────────────────

export const profile = {
  firstName: "Dewanshi",
  lastName: "Chawaldhal",
  role: "Designer & Creative Technologist", // EDIT: LinkedIn headline
  location: "India", // EDIT: city, country
  timezone: "Asia/Kolkata",
  availability: "Open to new projects", // EDIT
  email: "hello@dewanshi.com", // EDIT: real email
  linkedin: "https://www.linkedin.com/in/dewanshi-chawaldhal-23b3813b2",
  instagram: "", // EDIT (optional) full URL — hidden when empty
  behance: "", // EDIT (optional) full URL — hidden when empty
  photo: "" as string, // EDIT: e.g. "/dewanshi.jpg" (shown in the hero card)
  intro:
    "I design and build thoughtful digital experiences — where clear thinking, bold visuals and motion meet to tell a story.", // EDIT
};

/* ---------- HERO ---------- */
export const heroLines = ["Designing", "Ridiculously", "Good Work"]; // EDIT
export const heroPills = ["Portfolio ©2026", "Design & Development", "Based in India"]; // EDIT
export const bannerWords = ["Good ideas only", "Design with heart", "Let's make magic", "Detail obsessed"]; // EDIT

/* ---------- ABOUT ---------- */
export const aboutStatement =
  "I believe good work comes from curiosity. That's why I dig deep into every idea, sweat the small details and keep learning, so every project feels thoughtful, bold and a little bit unexpected."; // EDIT: from her LinkedIn "About"
export const aboutPills = ["Detail obsessed", "Always learning", "Powered by chai"]; // EDIT

/* ---------- PROJECTS ---------- */
export type Project = {
  title: string;
  category: string;
  year: string;
  description: string;
  colors: [string, string];
  image?: string; // e.g. "/work/project-1.jpg"
  link?: string; // optional URL (LinkedIn post, Behance, live site…)
};

// EDIT: replace with her real projects / LinkedIn posts
export const projects: Project[] = [
  { title: "Project One", category: "Brand Identity", year: "2026", description: "A complete visual identity system from logo to motion.", colors: ["#ff8a5c", "#ffd2bd"] },
  { title: "Project Two", category: "Web Experience", year: "2026", description: "An immersive, scroll-driven website for a product launch.", colors: ["#4f6bff", "#c3ceff"] },
  { title: "Project Three", category: "Product Design", year: "2025", description: "Designing a calmer mobile experience for everyday tasks.", colors: ["#2fa37a", "#bdf0d9"] },
  { title: "Project Four", category: "Campaign", year: "2025", description: "A social-first campaign with bold type and motion.", colors: ["#a34fff", "#e2c6ff"] },
  { title: "Project Five", category: "Illustration", year: "2025", description: "A set of playful illustrations for a young brand.", colors: ["#ffb800", "#fff0b3"] },
  { title: "Project Six", category: "UI / UX", year: "2024", description: "Research-led redesign of a busy dashboard.", colors: ["#ff4f8b", "#ffc9db"] },
];

/* ---------- EXPERIENCE (LinkedIn "Experience" + "Education") ---------- */
export type Experience = { company: string; role: string; period: string };
export const experience: Experience[] = [
  { company: "Company Name", role: "Current Role", period: "2025 — Now" }, // EDIT
  { company: "Company Name", role: "Previous Role", period: "2024 — 2025" }, // EDIT
  { company: "Company Name", role: "Internship", period: "2023 — 2024" }, // EDIT
  { company: "University Name", role: "Degree, Field of Study", period: "2021 — 2025" }, // EDIT
];

/* ---------- SERVICES / SKILLS (drawn along the winding line) ---------- */
export const services = [
  { title: "Visual Design", text: "Layouts, colour and type that make ideas impossible to ignore." },
  { title: "Brand Identity", text: "Logos and visual systems with a personality of their own." },
  { title: "UI / UX Design", text: "Interfaces that look great, feel right and are easy to use." },
  { title: "Web Development", text: "Fast, responsive websites brought to life with code." },
  { title: "Motion", text: "Because standing still just isn't enough." },
  { title: "Research", text: "Asking the right questions before drawing a single line." },
]; // EDIT: her LinkedIn skills

/* ---------- RECOMMENDATIONS (LinkedIn "Recommendations") ---------- */
// EDIT: paste real recommendations from her LinkedIn. These are placeholders.
export const testimonials = [
  {
    headline: "Add a short highlight from a LinkedIn recommendation here",
    quote: "Paste the full recommendation text from LinkedIn here. It will show on this card, and the cards shuffle as visitors scroll.",
    name: "Recommender Name",
    role: "Role, Company",
    avatar: "", // optional "/people/name.jpg"
  },
  {
    headline: "A second recommendation goes on this card",
    quote: "Replace this with another recommendation from a manager, teammate, teacher or client.",
    name: "Recommender Name",
    role: "Role, Company",
    avatar: "",
  },
  {
    headline: "And a third one goes here",
    quote: "Three to five recommendations work best. Remove this card if there are fewer.",
    name: "Recommender Name",
    role: "Role, Company",
    avatar: "",
  },
];

/* ---------- FAQ (chat-style) ---------- */
export const faqs = [
  { q: "What do you do?", a: "I design and build digital experiences — from brand visuals to websites — with a big focus on detail and motion." }, // EDIT
  { q: "Are you open to new opportunities?", a: "Yes! I'm open to full-time roles, internships and freelance projects. The best way to reach me is email or LinkedIn." }, // EDIT
  { q: "What tools do you use?", a: "Figma for design, plus code and motion tools to bring ideas to life." }, // EDIT
  { q: "Can you work with an existing brand?", a: "Absolutely — I enjoy building something new just as much as making something good even better." },
  { q: "Where are you based?", a: "I'm based in India and happy to work with people anywhere in the world." }, // EDIT
  { q: "How can we start?", a: "Send me a message with a bit about your idea, and we'll take it from there." },
];

export const footerLine = ["Alright, that's", "the whole", "portfolio"]; // EDIT
