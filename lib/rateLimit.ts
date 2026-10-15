/** Simple in-memory fixed-window limiter. Per-instance only; use a shared store (Redis/Upstash) in production. */
const hits = new Map<string, { n: number; reset: number }>();

export function rateLimit(key: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  h.n += 1;
  return h.n <= max;
}

export function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
