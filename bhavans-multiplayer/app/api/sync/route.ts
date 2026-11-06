import { idFrom } from "@/lib/server/auth";
import { sync } from "@/lib/server/game";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = idFrom(req);
  if (!id) return Response.json({ ok: false, err: "auth" }, { status: 401 });
  const since = Number(new URL(req.url).searchParams.get("since")) || 0;
  try {
    return Response.json({ ok: true, ...(await sync(id, since)) });
  } catch (e) {
    return Response.json({ ok: false, err: String((e as Error).message) }, { status: 503 });
  }
}
