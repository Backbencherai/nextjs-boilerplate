import { idFrom } from "@/lib/server/auth";
import { act } from "@/lib/server/game";

export const dynamic = "force-dynamic";

/** Every game action goes through here; the server validates it with the game engine. */
export async function POST(req: Request) {
  const id = idFrom(req);
  if (!id) return Response.json({ ok: false, err: "Please sign in again." }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.a !== "string") return Response.json({ ok: false, err: "Bad request." }, { status: 400 });
  try {
    return Response.json(await act(id, body));
  } catch (e) {
    return Response.json({ ok: false, err: (e as Error).message === "busy" ? "Server busy, try again." : "Something went wrong." }, { status: 503 });
  }
}
