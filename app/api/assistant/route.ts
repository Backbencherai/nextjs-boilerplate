import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/rateLimit";

const schema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) })).min(1).max(20),
  consent: z.literal(true),
});

const SYSTEM = `You are the Swasth Setu health education assistant. You explain health terms and general concepts in simple language and help people prepare questions for clinicians. You are not a doctor: never diagnose, never prescribe or suggest doses, never recommend antibiotics or specific medicines for a person's situation. If a message suggests an emergency, tell the person to call 112 (India) or local emergency services immediately. Say when you are unsure. Keep answers short and plain.`;

export async function POST(req: Request) {
  if (!rateLimit(`assistant:${clientKey(req)}`, 10)) return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json(
      { configured: false, error: "The AI assistant is not configured on this deployment, so no answer can be given." },
      { status: 503 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request. Consent to data transfer is required." }, { status: 400 });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ASSISTANT_MODEL ?? "claude-sonnet-5-5",
        max_tokens: 700,
        system: SYSTEM,
        messages: parsed.data.messages,
      }),
      signal: ctrl.signal,
    });
    if (!r.ok) return NextResponse.json({ error: "The AI service returned an error." }, { status: 502 });
    const j = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = j.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n") ?? "";
    return NextResponse.json({ configured: true, reply: text });
  } catch {
    return NextResponse.json({ error: "The AI service timed out or is unreachable." }, { status: 504 });
  } finally {
    clearTimeout(timer);
  }
}
