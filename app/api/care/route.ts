import { NextResponse } from "next/server";
import { careSchema, hasRedFlag } from "@/lib/care/schema";
import { clientKey, rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (!rateLimit(`care:${clientKey(req)}`)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const parsed = careSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Content is not logged or stored. No AI analysis is configured: say so rather than fabricate one.
  return NextResponse.json({
    analysis: "unavailable",
    urgent: hasRedFlag(parsed.data),
    summary: parsed.data,
  });
}
