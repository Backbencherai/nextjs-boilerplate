/** Only allow same-site relative paths as post-login redirects (blocks open redirects like //evil.com or /\evil.com). */
export function safeNext(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\r\n]/.test(value)) return fallback;
  return value;
}
