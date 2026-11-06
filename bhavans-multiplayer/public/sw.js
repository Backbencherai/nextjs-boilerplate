/* Bhavan's Multiplayer service worker: installable + offline. */
const VERSION = "bhv-v2";
const CORE = ["/", "/city/", "/world/", "/war/", "/bank/", "/ranks/", "/me/", "/install/", "/manifest.webmanifest", "/icon-192.png", "/models/world.glb"];
self.addEventListener("install", (e) => e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  const asset = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/models/") || /\.(png|svg|ico|woff2?)$/.test(url.pathname);
  if (asset) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then((x) => x.put(req, c)); } return res; })));
    return;
  }
  e.respondWith(fetch(req).then((res) => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then((x) => x.put(req, c)); } return res; }).catch(() => caches.match(req).then((h) => h || caches.match("/"))));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((l) => { for (const c of l) if ("focus" in c) return c.focus(); return self.clients.openWindow("/"); }));
});
