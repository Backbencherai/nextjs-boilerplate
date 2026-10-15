import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(72, "Use at most 72 characters.");

export const signInSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password.").max(72) });
export const signUpSchema = z.object({ email: emailSchema, password: passwordSchema, consent: z.literal(true, { error: "Please accept the privacy policy." }) });
export const magicLinkSchema = z.object({ email: emailSchema });
