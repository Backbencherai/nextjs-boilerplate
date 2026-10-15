import { NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/doctors/provider";

const schema = z.object({
  specialty: z.string().max(80).optional(),
  location: z.string().max(120).optional(),
  facility: z.string().max(120).optional(),
  format: z.enum(["in-person", "teleconsult"]).optional(),
});

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = schema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "Invalid search" }, { status: 400 });

  const provider = getProvider();
  if (!provider) {
    return NextResponse.json({ configured: false, results: [], message: "No provider directory is connected, so no doctors can be listed." });
  }
  try {
    return NextResponse.json({ configured: true, results: await provider.search(parsed.data) });
  } catch {
    return NextResponse.json({ error: "Directory unavailable" }, { status: 502 });
  }
}
