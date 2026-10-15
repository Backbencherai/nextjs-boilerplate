import { z } from "zod";

export const BODY_AREAS = ["Head or face", "Neck", "Chest", "Abdomen", "Back", "Arm or hand", "Leg or foot", "Skin (general)", "Other"] as const;

export const careSchema = z.object({
  concern: z.string().trim().min(5, "Please describe the concern in a few words.").max(2000),
  bodyArea: z.enum(BODY_AREAS),
  duration: z.string().trim().min(1, "Please say how long.").max(100),
  severity: z.enum(["mild", "moderate", "severe"]),
  symptoms: z.string().max(500).optional().default(""),
  context: z.string().max(1000).optional().default(""),
});
export type CareInput = z.infer<typeof careSchema>;

/**
 * Conservative keyword screen for possible emergencies. NOT exhaustive and NOT a triage tool:
 * its only job is to show the emergency box more readily. Absence of a match means nothing.
 */
const RED_FLAGS = [
  "chest pain", "can't breathe", "cannot breathe", "difficulty breathing", "short of breath", "unconscious", "not breathing",
  "heavy bleeding", "won't stop bleeding", "severe bleeding", "seizure", "stroke", "face drooping", "suicid", "poison", "overdose", "anaphylaxis", "throat swelling",
];

export function hasRedFlag(input: Pick<CareInput, "concern" | "symptoms" | "context" | "severity">): boolean {
  const t = `${input.concern} ${input.symptoms} ${input.context}`.toLowerCase();
  return input.severity === "severe" || RED_FLAGS.some((f) => t.includes(f));
}
