/* A×D Universe service worker — makes the app installable and usable offline.
   Pages: network first (fresh), fall back to cache. Static assets & 3D models: cache first. */
const VERSION = "axd-v3";
const CORE = ["/", "/world/", "/quests/", "/fame/", "/stats/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/models/axd.glb", "/models/adarsh.glb", "/models/dewanshi.glb"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(CORE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // relays, fonts CDN etc. go straight to the network
  if (url.pathname === "/sync-config.json") return; // always fresh
  const isAsset = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/models/") || /\.(png|svg|ico|woff2?)$/.test(url.pathname);
  if (isAsset) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/")))
  );
});
