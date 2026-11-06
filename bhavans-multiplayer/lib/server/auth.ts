/* Accounts + signed session tokens. PINs are salted and hashed; tokens are HMAC-signed. */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SECRET = process.env.AUTH_SECRET || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "bhavans-dev-secret-change-me";

export const sha = (s: string) => createHash("sha256").update(s).digest("hex");
export const pinHash = (pin: string, salt: string) => createHash("sha256").update(`${salt}:${pin}:${SECRET}`).digest("hex");
export const newSalt = () => randomBytes(12).toString("hex");
export const newId = () => randomBytes(9).toString("hex");

export function sign(id: string, days = 60) {
  const body = Buffer.from(JSON.stringify({ id, exp: Date.now() + days * 864e5 })).toString("base64url");
  const mac = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${mac}`;
}
export function verify(token: string | null | undefined): string | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const good = createHmac("sha256", SECRET).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(good);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p.exp > Date.now() ? (p.id as string) : null;
  } catch {
    return null;
  }
}
export function idFrom(req: Request) {
  const h = req.headers.get("authorization");
  return verify(h?.startsWith("Bearer ") ? h.slice(7) : null);
}

/** Verify a Google Sign-In credential with Google (checks the audience is our client id). */
export async function verifyGoogle(credential: string) {
  const aud = process.env.GOOGLE_CLIENT_ID;
  if (!aud) return null;
  const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!r.ok) return null;
  const j = (await r.json()) as { aud: string; sub: string; email: string; name?: string; email_verified?: string };
  if (j.aud !== aud) return null;
  return { sub: j.sub, email: j.email, name: j.name ?? j.email.split("@")[0] };
}
