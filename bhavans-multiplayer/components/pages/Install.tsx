"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import qrcode from "qrcode-generator";

type Platform = "ios" | "ios-other" | "inapp" | "android" | "desktop-chrome" | "mac-safari" | "firefox" | "other";

function detect(): Platform {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const inApp = /FBAN|FBAV|Instagram|Line\/|WhatsApp|Snapchat|Twitter|LinkedInApp|GSA\//i.test(ua);
  if (inApp) return "inapp";
  if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua) ? "ios-other" : "ios";
  if (/Android/i.test(ua)) return /Firefox/i.test(ua) ? "firefox" : "android";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/Macintosh/i.test(ua) && /Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua)) return "mac-safari";
  if (/Chrome|Chromium|Edg/i.test(ua)) return "desktop-chrome";
  return "other";
}

const STEPS: Record<Platform, { title: string; steps: string[] }> = {
  ios: {
    title: "iPhone / iPad (Safari)",
    steps: ["Tap the Share button ⎋ at the bottom of Safari (top on iPad).", "Scroll down and tap “Add to Home Screen”.", "Tap “Add”. Open Bhavan's from your home screen, then sign in with your email + PIN."],
  },
  "ios-other": {
    title: "iPhone / iPad (Chrome, Edge or Firefox)",
    steps: ["Tap the Share button ⎋ (next to the address bar).", "Tap “Add to Home Screen”. On older iOS, open this page in Safari instead.", "Open Bhavan's from your home screen and sign in with your email + PIN."],
  },
  inapp: {
    title: "You're inside another app's browser",
    steps: ["Apps like WhatsApp or Instagram can't install apps.", "Tap ⋯ or the compass icon and choose “Open in Safari” (iPhone) or “Open in Chrome” (Android).", "Then come back to this page and follow the steps."],
  },
  android: {
    title: "Android (Chrome, Samsung Internet, Edge)",
    steps: ["Tap the Install button below — or the ⋮ menu → “Install app” / “Add to Home screen”.", "Confirm “Install”.", "Open Bhavan's from your home screen or app drawer and sign in."],
  },
  firefox: {
    title: "Firefox",
    steps: ["Android: tap ⋮ → “Install” (or “Add to Home screen”).", "Desktop Firefox can't install web apps. Use Chrome or Edge, or just bookmark this page.", "Sign in with your email + PIN."],
  },
  "desktop-chrome": {
    title: "Windows, Mac, Linux or ChromeOS (Chrome / Edge)",
    steps: ["Click the Install button below, or the install icon ⊕ in the address bar.", "Bhavan's opens in its own window and appears in your apps.", "Sign in with your email + PIN."],
  },
  "mac-safari": {
    title: "Mac (Safari 17+)",
    steps: ["In the menu bar choose File → “Add to Dock”.", "Click “Add”. Bhavan's opens like a normal Mac app.", "Sign in with your email + PIN."],
  },
  other: {
    title: "Your browser",
    steps: ["Look for “Install”, “Add to Home Screen” or “Add to Dock” in the browser menu.", "If there isn't one, open this page in Safari (iPhone/Mac) or Chrome (everything else).", "Sign in with your email + PIN."],
  },
};

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function Install() {
  const [platform, setPlatform] = useState<Platform>("other");
  const [url, setUrl] = useState("");
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPlatform(detect());
    setUrl(location.origin + "/");
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || !!(navigator as unknown as { standalone?: boolean }).standalone);
    const w = window as unknown as { __bhvInstall?: BIP };
    if (w.__bhvInstall) setCanPrompt(true);
    const on = () => setCanPrompt(true);
    window.addEventListener("bhv-installable", on);
    return () => window.removeEventListener("bhv-installable", on);
  }, []);

  const qr = useMemo(() => {
    if (!url) return "";
    const q = qrcode(0, "M");
    q.addData(url);
    q.make();
    return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  }, [url]);

  const s = STEPS[platform];
  const others = (Object.keys(STEPS) as Platform[]).filter((p) => p !== platform && p !== "inapp" && p !== "other");

  return (
    <main className="page">
      <header className="page-head">
        <p className="serif kicker">get the</p>
        <h1 className="display">App</h1>
        <p className="muted">One app for every phone and computer — iPhone, Android, iPad, Mac, Windows. No app store needed.</p>
      </header>

      {installed ? (
        <section className="card install-card">
          <h3 className="display">✓ Installed</h3>
          <p>You&apos;re using the installed app. Send the link below to your partner so they can install it too.</p>
        </section>
      ) : (
        <section className="card install-card">
          <div className="card-head">
            <h3>{s.title}</h3>
          </div>
          <ol className="steps">
            {s.steps.map((t, i) => (
              <li key={i}>
                <span className="step-n display">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
          {canPrompt && (
            <button
              className="btn btn-primary btn-lg"
              onClick={async () => {
                const e = (window as unknown as { __bhvInstall?: BIP }).__bhvInstall;
                if (!e) return;
                await e.prompt();
                const r = await e.userChoice;
                if (r.outcome === "accepted") setInstalled(true);
              }}
            >
              Install Bhavan's Multiplayer
            </button>
          )}
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h3>Send it to your partner</h3>
        </div>
        <p className="small muted">Scan this with the other phone&apos;s camera, or share the link.</p>
        <div className="qr" dangerouslySetInnerHTML={{ __html: qr }} />
        <div className="row gap center">
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button className="btn btn-primary" onClick={() => navigator.share({ title: "Bhavan's Multiplayer", text: "Build your country with me in Bhavan's Multiplayer 🌍", url }).catch(() => {})}>
              Share link
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={() => {
              navigator.clipboard?.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              });
            }}
          >
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </div>
      </section>

      <section className="card subtle">
        <h3 className="display small-h">Other devices</h3>
        {others.map((p) => (
          <details key={p} className="other-device">
            <summary>{STEPS[p].title}</summary>
            <ol>
              {STEPS[p].steps.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
          </details>
        ))}
      </section>

      <section className="card subtle">
        <p className="small">
          <b>Tip:</b> on iPhone the installed app keeps its own storage, separate from Safari. That&apos;s fine: open the app and sign in with the <b>same email + PIN</b>, and your country downloads automatically.
        </p>
        <Link href="/" className="link-btn">
          ← back
        </Link>
      </section>
    </main>
  );
}
