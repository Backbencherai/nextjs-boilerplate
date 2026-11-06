export const dynamic = "force-dynamic";

/**
 * ICE servers for voice/video calls. STUN works on most networks; TURN relays calls through strict NATs
 * (mobile data, school/office Wi-Fi) so calls connect everywhere. Set TURN_URLS / TURN_USERNAME / TURN_CREDENTIAL
 * (e.g. from metered.ca, Twilio or Cloudflare) — or METERED_API_KEY + METERED_DOMAIN to fetch fresh credentials.
 */
export async function GET() {
  const servers: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:global.stun.twilio.com:3478"] }];
  if (process.env.METERED_API_KEY && process.env.METERED_DOMAIN) {
    try {
      const r = await fetch(`https://${process.env.METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`);
      if (r.ok) servers.push(...((await r.json()) as RTCIceServer[]));
    } catch {}
  } else if (process.env.TURN_URLS) {
    servers.push({ urls: process.env.TURN_URLS.split(",").map((s) => s.trim()), username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL });
  } else {
    // free public relay (best effort) so calls still connect behind strict NATs
    servers.push({ urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443", "turn:openrelay.metered.ca:443?transport=tcp"], username: "openrelayproject", credential: "openrelayproject" });
  }
  return Response.json({ iceServers: servers });
}
