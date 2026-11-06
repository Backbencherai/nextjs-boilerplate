import { getDB } from "@/lib/server/db";
import { newId, newSalt, pinHash, sha, sign, verifyGoogle } from "@/lib/server/auth";
import { myNation } from "@/lib/server/game";

export const dynamic = "force-dynamic";

/** Sign in or sign up. Email + PIN (salted hash), Google (verified with Google), or guest. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const d = getDB();
  let id: string;
  let name = String(b.name ?? "").trim().slice(0, 24);
  if (b.mode === "email") {
    const email = String(b.email ?? "").trim().toLowerCase();
    const pin = String(b.pin ?? "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ ok: false, err: "Enter a valid email." });
    if (!/^\d{4,8}$/.test(pin)) return Response.json({ ok: false, err: "PIN must be 4–8 digits." });
    const key = `acct:${sha(email)}`;
    const acct = await d.get<{ id: string; salt: string; hash: string; name: string; fails?: number; lockUntil?: number }>(key);
    if (acct) {
      if (acct.lockUntil && acct.lockUntil > Date.now()) return Response.json({ ok: false, err: "Too many wrong PINs. Try again in 10 minutes." });
      if (pinHash(pin, acct.salt) !== acct.hash) {
        const fails = (acct.fails ?? 0) + 1;
        await d.set(key, { ...acct, fails, lockUntil: fails >= 5 ? Date.now() + 600_000 : undefined });
        return Response.json({ ok: false, err: "Wrong PIN for this email." });
      }
      if (acct.fails) await d.set(key, { ...acct, fails: 0, lockUntil: undefined });
      id = acct.id;
      name = acct.name;
    } else {
      const salt = newSalt();
      id = newId();
      name = name || email.split("@")[0];
      await d.set(key, { id, salt, hash: pinHash(pin, salt), name });
    }
  } else if (b.mode === "google") {
    const g = await verifyGoogle(String(b.credential ?? ""));
    if (!g) return Response.json({ ok: false, err: "Google sign-in isn't set up on this server (GOOGLE_CLIENT_ID)." });
    const key = `gacct:${g.sub}`;
    const acct = await d.get<{ id: string; name: string }>(key);
    id = acct?.id ?? newId();
    name = acct?.name ?? g.name;
    if (!acct) await d.set(key, { id, name, email: g.email });
  } else {
    if (!name) return Response.json({ ok: false, err: "Enter your name." });
    id = "g" + newId();
  }
  await d.set(`uname:${id}`, name);
  return Response.json({ ok: true, token: sign(id), id, name, hasNation: !!(await myNation(id)) });
}

export async function GET() {
  return Response.json({ ok: true, google: !!process.env.GOOGLE_CLIENT_ID, googleClientId: process.env.GOOGLE_CLIENT_ID ?? "", db: getDB().kind });
}
