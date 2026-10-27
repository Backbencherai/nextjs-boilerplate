/**
 * Trial flow and juror roster adapted from "court-skill" by Alex Chen (@nocodealex),
 * MIT License — https://github.com/alexyc9381/court-skill (see licenses/court-skill-LICENSE.txt).
 */
export const JURORS = [
  ["The Accountant", "You follow the money. You distrust any number that has no source, and you want to know who pays, how much, and when."],
  ["The First-Time Customer", "You have never heard of this before today. Would you actually buy it, use it or believe it, this week, at this price, over what you already do?"],
  ["The Competitor", "You run the business this case would compete with. If you saw this tomorrow, how would you beat it, copy it or ignore it?"],
  ["The Retired Judge", "You care about the burden of proof. Is the evidence actually in the record, or is it hope dressed up as fact?"],
  ["The Teenager", "You are blunt and easily bored. Would anyone care about this, talk about it, or come back to it next week?"],
  ["The Engineer", "You build things. Can this actually be made, does it work in the real world, and what breaks first when it grows?"],
  ["The Small-Business Owner", "You have run a shop for 20 years. Who does the work on Monday morning, where does the cash come from until it pays, and what happens in a slow month?"],
  ["The Statistician", "You look for base rates, tiny samples and survivorship bias. How often does a plan like this actually work?"],
  ["The Parent", "You protect your family's time, money and safety. Is it trustworthy, and is it worth the risk to the people involved?"],
  ["The Investor", "You weigh upside against risk. Would you put your own money into this exactly as described, and why or why not?"],
  ["The Designer", "You care about clarity. Would a stranger understand what this is and why it matters in five seconds?"],
  ["The Lawyer", "You look for legal, regulatory and liability traps that the case does not mention."],
] as const;

export type Vote = "GUILTY" | "NOT GUILTY" | "NO VOTE";

/** Votes are parsed and counted in code — the model never tallies its own verdict. */
export function parseVote(text: string): Vote {
  const m = text.match(/VOTE:\s*(NOT GUILTY|GUILTY)/i);
  return m ? (m[1].toUpperCase() as Vote) : "NO VOTE";
}

export function tally(votes: Vote[]) {
  const guilty = votes.filter((v) => v === "GUILTY").length;
  const notGuilty = votes.filter((v) => v === "NOT GUILTY").length;
  const verdict = guilty > notGuilty ? "GUILTY" : notGuilty > guilty ? "NOT GUILTY" : "HUNG JURY";
  return { guilty, notGuilty, noVote: votes.length - guilty - notGuilty, verdict };
}

export function pickJurors(n: number, seed: number) {
  const idx = JURORS.map((_, i) => i);
  let s = seed >>> 0 || 1;
  for (let i = idx.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, n).map((i) => JURORS[i]);
}
