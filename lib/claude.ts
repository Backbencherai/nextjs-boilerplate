const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

export const hasKey = () => Boolean(process.env.ANTHROPIC_API_KEY);

/** Single Messages API call. Throws on any failure; callers decide how to degrade. */
export async function callClaude(system: string, user: string, maxTokens = 700): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  const data = await res.json();
  return (data.content ?? []).map((b: { text?: string }) => b.text ?? "").join("").trim();
}
