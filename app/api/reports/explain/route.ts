import { NextResponse } from "next/server";
import { z } from "zod";
import { parseReport } from "@/lib/reports/parse";
import { clientKey, rateLimit } from "@/lib/rateLimit";

const schema = z.object({ text: z.string().min(1).max(20_000) });

export async function POST(req: Request) {
  if (!rateLimit(`report:${clientKey(req)}`)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Please provide report text (up to 20,000 characters)." }, { status: 400 });
  // Deterministic only. No external AI service is called and nothing is stored or logged.
  return NextResponse.json({ mode: "deterministic", results: parseReport(body.data.text) });
}
