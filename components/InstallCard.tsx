"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** "Add to home screen" — Android/desktop get a real install button, iPhone gets the two-tap instructions. */
export function InstallCard() {
  const [canPrompt, setCanPrompt] = useState(false);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem("adxd:installDismissed") === "1";
    } catch {}
    if (standalone || dismissed) return;
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setHidden(false);
    const w = window as unknown as { __axdInstall?: BIP };
    if (w.__axdInstall) setCanPrompt(true);
    const on = () => setCanPrompt(true);
    window.addEventListener("axd-installable", on);
    return () => window.removeEventListener("axd-installable", on);
  }, []);
  if (hidden) return null;
  const dismiss = () => {
    try {
      localStorage.setItem("adxd:installDismissed", "1");
    } catch {}
    setHidden(true);
  };
  return (
    <section className="card install-card">
      <div className="card-head">
        <h3>📲 Install the app</h3>
        <button className="icon-btn sm" onClick={dismiss} aria-label="Dismiss">
          ✕
        </button>
      </div>
      <Link href="/install" className="link-btn small">
        all devices & share with your partner →
      </Link>
      {canPrompt ? (
        <>
          <p className="small">Put A×D on your home screen. It opens full-screen like a real app and works offline.</p>
          <button
            className="btn btn-primary"
            onClick={async () => {
              const e = (window as unknown as { __axdInstall?: BIP }).__axdInstall;
              if (!e) return;
              await e.prompt();
              await e.userChoice;
              setHidden(true);
            }}
          >
            Install
          </button>
        </>
      ) : ios ? (
        <p className="small">
          On iPhone: tap <b>Share</b> <span aria-hidden>⎋</span> in Safari, then <b>Add to Home Screen</b>. It opens full-screen like a real app.
        </p>
      ) : (
        <p className="small">Put A×D on your home screen or desktop. It opens in its own window like a real app and works offline.</p>
      )}
    </section>
  );
}
