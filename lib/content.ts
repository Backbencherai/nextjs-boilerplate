// ─────────────────────────────────────────────────────────────
// ALL of Dewanshi's content lives in this one file.
// Source: her LinkedIn profile (headline, About, Education, Skills, Activity).
// Images live in /public/images.
// ─────────────────────────────────────────────────────────────

export const profile = {
  firstName: "Dewanshi",
  lastName: "Chawaldhal",
  role: "Commerce Student · IPMAT Aspirant",
  headline: "Commerce Student | IPMAT Aspirant | Interested in Business, Management & Leadership",
  location: "Nagpur, India",
  locationLong: "Nagpur, Maharashtra, India",
  timezone: "Asia/Kolkata",
  availability: "IPMAT Aspirant",
  email: "dewanshi.c06@gmail.com",
  linkedin: "https://www.linkedin.com/in/dewanshi-chawaldhal-23b3813b2",
  instagram: "",
  behance: "",
  photo: "/images/dewanshi-avatar.png",
  avatar: "/images/dewanshi-avatar.png",
  resume: "/resume/Dewanshi-Chawaldhal-Resume.pdf",
  resumeImage: "/resume/Dewanshi-Chawaldhal-Resume.jpg",
  // her own words, from the LinkedIn "About" section
  about:
    "I'm a 12th-grade Commerce student at Bhavan's BP Vidyamandir Civil Lines preparing for the IPMAT exam with the goal of getting into an IIM. I'm interested in business management and leadership, and I enjoy working with people and taking initiative. My strengths include communication, team management, and event coordination, and I'm focused on improving myself and growing every day.",
};

/** where "Let's Talk" buttons go */
export const contactHref = profile.email ? `mailto:${profile.email}` : profile.linkedin;

/* ---------- HERO ---------- */
export const heroLines = ["Future", "Business", "Leader"];
export const heroPills = ["Commerce Student", "IPMAT Aspirant", "Nagpur, India"];
export const bannerWords = ["Communication", "Team Leadership", "Public Speaking", "Growing every day", "Business & Management"];

/* ---------- ABOUT ---------- */
export const aboutStatement =
  "I'm a Commerce student from Nagpur preparing for IPMAT, with my sights set on an IIM. I love working with people, taking initiative and growing a little every single day.";
export const aboutPills = ["Aiming for an IIM", "People person", "Always growing"];

/* ---------- BEYOND THE CLASSROOM (cards) ---------- */
export type Project = {
  title: string;
  category: string;
  tag: string;
  description: string;
  colors: [string, string]; // [accent, background] for cards without an image
  image?: string;
  link?: string;
};

export const projects: Project[] = [
  {
    title: "Model United Nations",
    category: "Debate & Diplomacy",
    tag: "MUN",
    description: "Researching global issues, speaking up and negotiating with other delegates.",
    colors: ["#ff5a00", "#ffd9c7"],
  },
  {
    title: "Event Committee",
    category: "Event Coordination",
    tag: "School",
    description: "Planning and running school events — coordinating people, timelines and details.",
    colors: ["#d62839", "#ffd3d8"],
  },
  {
    title: "The Consistent Academy",
    category: "Team Member",
    tag: "2026",
    description: "Welcomed to the team at The Consistent Academy.",
    colors: ["#5b3fd6", "#e3dcff"],
    image: "/images/consistent-academy-welcome.jpg",
    link: "https://www.linkedin.com/in/dewanshi-chawaldhal-23b3813b2/recent-activity/all/",
  },
  {
    title: "Basketball",
    category: "School Sports Team",
    tag: "Team sport",
    description: "Teamwork, quick decisions and staying calm under pressure.",
    colors: ["#ff7a1a", "#fde3cb"],
  },
  {
    title: "Golf",
    category: "School Sports Team",
    tag: "Focus",
    description: "Patience, focus and always competing with my last best.",
    colors: ["#1f7a4c", "#d3eedd"],
  },
  {
    title: "Volunteering",
    category: "Community",
    tag: "Giving back",
    description: "Giving my time to causes and the community around me.",
    colors: ["#c2185b", "#fbd3e4"],
  },
];

/* ---------- JOURNEY (Education & experience) ---------- */
export type Experience = { company: string; role: string; period: string };
export const experience: Experience[] = [
  { company: "IPMAT Preparation", role: "Goal: a seat at an IIM", period: "Next" },
  { company: "Bhavan's BP Vidyamandir", role: "Grade 12 · Commerce · Civil Lines, Nagpur", period: "Now" },
  { company: "Bhavans College", role: "Business / Commerce, General", period: "Grade 11 – 12" },
  { company: "The Consistent Academy", role: "Team Member", period: "2026" },
];

/* ---------- SKILLS (drawn along the winding line) — from her 14 LinkedIn skills ---------- */
export const services = [
  { title: "Communication", text: "Communication and public speaking — saying things clearly, and listening even better." },
  { title: "Team Leadership", text: "Leading with energy and taking initiative when it counts." },
  { title: "Coordination", text: "Team, project and event coordination — keeping people and plans in sync." },
  { title: "Problem Solving", text: "Getting to the root cause, and solving problems together as a team." },
  { title: "Networking", text: "Meeting new people and building genuine connections." },
  { title: "Adaptability", text: "Easily adaptable — comfortable with change and quick to find my feet." },
];

/* ---------- HIGHLIGHTS (shuffling card deck) ---------- */
export const highlights = [
  {
    headline: "Welcome to the team!",
    text: "Joined The Consistent Academy, whose founder welcomed every member as “a voice, a vision, and a valued part” of the community.",
    name: "The Consistent Academy",
    role: "Team member · 2026",
    avatar: "/images/consistent-academy-welcome.jpg",
  },
  {
    headline: "Finding my voice at MUN",
    text: "Taking part in Model United Nations — researching global issues, debating and negotiating as a delegate.",
    name: "Model United Nations",
    role: "Bharatiya Vidya Bhavan's",
    avatar: "",
  },
  {
    headline: "Team player, on and off the court",
    text: "Part of the school basketball and golf teams, a member of the event committee, and a volunteer.",
    name: "Sports, Events & Volunteering",
    role: "Bharatiya Vidya Bhavan's",
    avatar: "",
  },
];

/* ---------- FAQ (chat-style) ---------- */
export const faqs = [
  { q: "Who are you?", a: "I'm Dewanshi — a 12th-grade Commerce student at Bhavan's BP Vidyamandir, Civil Lines, in Nagpur." },
  { q: "What are you working towards?", a: "I'm preparing for the IPMAT exam, with the goal of getting into an IIM." },
  { q: "What interests you?", a: "Business, management and leadership — and working with people to make things happen." },
  { q: "What are your strengths?", a: "Communication, team management and event coordination. I like taking initiative." },
  { q: "What do you do outside class?", a: "Model United Nations, the event committee, basketball and golf, and volunteering." },
  { q: "How can I reach you?", a: "Send me a message on LinkedIn — I'd love to connect!" },
];

/* ---------- SECTION HEADINGS ---------- */
export const sections = {
  about: "A bit about me",
  workEyebrow: "Beyond the classroom",
  work: ["What I", "get up to"],
  more: ["More chapters", "on the way"],
  morePills: ["Aiming for an IIM", "Always learning", "Growing every day"],
  moreButton: "Follow my journey on LinkedIn",
  journeyEyebrow: "Education & journey",
  journey: ["My", "journey"],
  skillsEyebrow: "Skills",
  skills: ["What I", "bring"],
  highlightsEyebrow: "Highlights",
  highlights: ["Moments I'm", "proud of"],
  resumeEyebrow: "Résumé",
  resume: ["My", "résumé"],
  faqEyebrow: "Frequently asked questions",
  faq: ["Things you", "might ask"],
};

export const footerLine = ["Okay, that's", "enough about", "me"];
