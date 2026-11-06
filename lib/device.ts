"use client";
/** Device features: notifications, location, persistent storage. All opt-in and fail-safe. */

export const notifySupported = () => typeof window !== "undefined" && "Notification" in window;
export const notifyGranted = () => notifySupported() && Notification.permission === "granted";

export async function askNotifications(): Promise<boolean> {
  if (!notifySupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

/** Shows a system notification when the app isn't on screen (no point notifying the screen you're looking at). */
export async function notify(title: string, body: string, tag?: string, force = false) {
  if (!notifyGranted()) return;
  if (!force && document.visibilityState === "visible") return;
  const opts: NotificationOptions = { body, icon: "/icon-192.png", badge: "/icon-192.png", tag, data: { url: "/" } };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, opts);
    else new Notification(title, opts);
  } catch {
    /* some browsers only allow notifications from an installed app */
  }
}

export const geoSupported = () => typeof navigator !== "undefined" && "geolocation" in navigator;

export async function geoPermission(): Promise<"granted" | "denied" | "prompt" | "unsupported"> {
  if (!geoSupported()) return "unsupported";
  try {
    const p = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
    return (p?.state as "granted" | "denied" | "prompt") ?? "prompt";
  } catch {
    return "prompt";
  }
}

export function askLocation(): Promise<GeolocationPosition | null> {
  return new Promise((res) => {
    if (!geoSupported()) return res(null);
    navigator.geolocation.getCurrentPosition(res, () => res(null), { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
  });
}

/** ~100 m precision is plenty for "how far apart are we" and keeps exact addresses private. */
export const roundCoord = (x: number) => Math.round(x * 1000) / 1000;

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat);
  const dLon = toR(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function fmtDistance(km: number) {
  if (km < 0.2) return "together";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString()} km`;
}

/** Ask the browser never to evict our saved data (Safari/Chrome honour this for installed apps). */
export async function persistStorage() {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
