/**
 * First-aid modules.
 *
 * `steps`, `warnings` and `seekHelp` are intentionally EMPTY. The build environment could not reach the
 * Red Cross sources, and the brief forbids inventing medical guidance. A module may only be marked
 * `status: "published"` after every statement has been checked against `sources` and `reviewed` is set.
 */
export type FirstAidModule = {
  slug: string;
  title: string;
  intro: string;
  status: "pending-verification" | "published";
  steps: string[];
  warnings: string[];
  seekHelp: string[];
  sources: { label: string; url: string }[];
  reviewed: string | null; // ISO date of source check + clinical review
};

const ARC = { label: "American Red Cross — Learn first aid: wounds", url: "https://www.redcross.org/take-a-class/resources/learn-first-aid/wounds" };
const BRC = { label: "British Red Cross — First aid", url: "https://www.redcross.org.uk/first-aid" };

const mk = (slug: string, title: string, intro: string): FirstAidModule => ({
  slug, title, intro, status: "pending-verification", steps: [], warnings: [], seekHelp: [], sources: [ARC, BRC], reviewed: null,
});

export const FIRST_AID: FirstAidModule[] = [
  mk("minor-cuts-scrapes", "Minor cuts and scrapes", "Everyday small wounds and how to look after them."),
  mk("burns-scalds", "Burns and scalds", "Recognising and responding to burns from heat, hot liquids and steam."),
  mk("bleeding", "Bleeding", "Controlling bleeding and recognising when it is serious."),
  mk("sprains", "Sprains", "Joint injuries from twisting or overstretching."),
  mk("nosebleeds", "Nosebleeds", "What to do for a nosebleed and when it needs attention."),
  mk("emergency-recognition", "Recognising an emergency", "Signs that mean you should call emergency services without delay."),
  mk("when-to-seek-help", "When to seek urgent help", "Situations where professional medical care is needed."),
];
