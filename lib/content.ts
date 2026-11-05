// All personal content for the portfolio lives in this one file.
// LinkedIn could not be read automatically, so the entries below marked
// "EDIT" are placeholders — replace them with Dewanshi's real details.

export const profile = {
  firstName: "Dewanshi",
  lastName: "Chawaldhal",
  initials: "DC",
  role: "Designer & Creative Technologist", // EDIT: LinkedIn headline
  location: "India", // EDIT: city, country
  timezone: "Asia/Kolkata",
  email: "hello@dewanshi.com", // EDIT: real email
  linkedin:
    "https://www.linkedin.com/in/dewanshi-chawaldhal-23b3813b2",
  // Put her photo in /public (e.g. /public/dewanshi.jpg) and set photo: "/dewanshi.jpg"
  photo: "" as string,
  intro:
    "I design and build thoughtful digital experiences — where clear thinking, bold visuals and motion meet to tell a story.", // EDIT
  about:
    "I'm Dewanshi, a curious mind who loves turning ideas into experiences people remember. I care about the details — the rhythm of type, the timing of a transition, the feeling a page leaves behind. Every project is a chance to learn something new and make something better than the last.", // EDIT: LinkedIn "About"
};

// Big hero headline (3 lines) and the black pills floating over it
export const heroLines = ["Designing", "Ridiculously", "Good Work"]; // EDIT
export const heroPills = ["Portfolio ©2026", "Design & Development", "Based in India"]; // EDIT

// Short centered "about" statement + orange pills that drop on top of it
export const aboutStatement =
  "I believe good work comes from curiosity. That's why I dig deep into every idea, sweat the small details and keep learning, so every project feels thoughtful, bold and a little bit unexpected."; // EDIT
export const aboutPills = ["Detail obsessed", "Always learning", "Powered by chai"]; // EDIT

// Words in the curved scrolling banner
export const bannerWords = ["Good ideas only", "Design with heart", "Let's make magic", "Detail obsessed"]; // EDIT

export const roles = [
  "Design",
  "Development",
  "Motion",
  "Branding",
  "Strategy",
  "Research",
]; // EDIT: skills / focus areas

export type Project = {
  title: string;
  category: string;
  year: string;
  description: string;
  colors: [string, string];
  image?: string; // optional: put a file in /public and set e.g. "/work/project-1.jpg"
};

// EDIT: replace with real projects
export const projects: Project[] = [
  {
    title: "Project One",
    category: "Brand Identity",
    year: "2026",
    description: "A complete visual identity system from logo to motion.",
    colors: ["#ff5b2e", "#ffb199"],
  },
  {
    title: "Project Two",
    category: "Web Experience",
    year: "2026",
    description: "An immersive, scroll-driven website for a product launch.",
    colors: ["#2e5bff", "#9fb4ff"],
  },
  {
    title: "Project Three",
    category: "Product Design",
    year: "2025",
    description: "Designing a calmer mobile experience for everyday tasks.",
    colors: ["#1f8a5b", "#a6e3c6"],
  },
  {
    title: "Project Four",
    category: "Campaign",
    year: "2025",
    description: "A social-first campaign with bold type and motion.",
    colors: ["#9b2eff", "#d8b0ff"],
  },
];

export type Experience = {
  company: string;
  role: string;
  period: string;
};

// EDIT: replace with LinkedIn "Experience" and "Education"
export const experience: Experience[] = [
  { company: "Company Name", role: "Current Role", period: "2025 — Now" },
  { company: "Company Name", role: "Previous Role", period: "2024 — 2025" },
  { company: "Company Name", role: "Internship", period: "2023 — 2024" },
  { company: "University Name", role: "Degree, Field of Study", period: "2021 — 2025" },
];

export const services = [
  {
    title: "Design",
    text: "Interfaces, identities and visual systems built with intention.",
  },
  {
    title: "Development",
    text: "Fast, accessible websites brought to life with code and motion.",
  },
  {
    title: "Strategy",
    text: "Research and thinking that gives every decision a reason.",
  },
]; // EDIT

export const stats = [
  { value: 20, suffix: "+", label: "Projects" }, // EDIT
  { value: 3, suffix: "+", label: "Years learning" },
  { value: 100, suffix: "%", label: "Curiosity" },
];
