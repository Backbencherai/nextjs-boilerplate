"use client";
import { TIER_COLORS, type Tier } from "./game/achievements";

export interface CertInput {
  recipient: string; // "Adarsh", "Devanshi" or "Adarsh & Devanshi"
  title: string; // achievement name
  description: string;
  date: string; // formatted date
  tier: Tier;
  icon: string;
  serial: string;
  accent: string;
}

/** Draws a print-quality (2000×1414, A-series ratio) certificate and triggers a PNG download. */
export async function downloadCertificate(c: CertInput) {
  const W = 2000,
    H = 1414;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  await document.fonts?.ready;
  const display = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "serif";
  const serif = getComputedStyle(document.documentElement).getPropertyValue("--font-serif").trim() || "serif";
  const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() || "monospace";

  // paper
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#fbf3e4");
  bg.addColorStop(1, "#f1e2c8");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // grain
  for (let i = 0; i < 14000; i++) {
    g.fillStyle = `rgba(90,60,30,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  // warm light beam (window-pane shadow)
  g.save();
  g.globalAlpha = 0.08;
  g.fillStyle = "#ff9d4d";
  g.beginPath();
  g.moveTo(W * 0.55, 0);
  g.lineTo(W * 0.85, 0);
  g.lineTo(W * 0.45, H);
  g.lineTo(W * 0.15, H);
  g.fill();
  g.restore();

  // frames
  g.strokeStyle = "#2a1a10";
  g.lineWidth = 6;
  g.strokeRect(60, 60, W - 120, H - 120);
  g.strokeStyle = c.accent;
  g.lineWidth = 3;
  g.strokeRect(84, 84, W - 168, H - 168);

  g.fillStyle = "#2a1a10";
  g.font = `500 30px ${mono}`;
  g.textAlign = "left";
  g.fillText("A×D UNIVERSE · CERTIFICATE OF ACHIEVEMENT", 140, 170);
  g.textAlign = "right";
  g.fillText(`No. ${c.serial}`, W - 140, 170);

  g.textAlign = "center";
  g.font = `italic 64px ${serif}`;
  g.fillStyle = "#6b4a33";
  g.fillText("This certifies that", W / 2, 370);

  g.font = `800 170px ${display}`;
  g.fillStyle = "#1b120c";
  g.fillText(c.recipient, W / 2, 560);

  g.font = `italic 58px ${serif}`;
  g.fillStyle = "#6b4a33";
  g.fillText("has earned", W / 2, 670);

  g.font = `800 120px ${display}`;
  g.fillStyle = c.accent;
  g.fillText(c.title.toUpperCase(), W / 2, 810);

  g.font = `400 44px ${display}`;
  g.fillStyle = "#3a281b";
  g.fillText(c.description, W / 2, 890);

  // medal seal
  const t = TIER_COLORS[c.tier];
  const cx = W / 2,
    cy = 1105;
  g.beginPath();
  for (let i = 0; i < 48; i++) {
    const r = i % 2 ? 118 : 132;
    const a = (i / 48) * Math.PI * 2;
    g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  g.closePath();
  const seal = g.createRadialGradient(cx - 30, cy - 30, 10, cx, cy, 130);
  seal.addColorStop(0, t.glow);
  seal.addColorStop(1, t.base);
  g.fillStyle = seal;
  g.fill();
  g.font = `110px serif`;
  g.fillText(c.icon, cx, cy + 38);
  g.font = `600 26px ${mono}`;
  g.fillStyle = "#2a1a10";
  g.fillText(t.label.toUpperCase(), cx, cy + 175);

  g.font = `500 34px ${mono}`;
  g.textAlign = "left";
  g.fillText(c.date, 160, 1200);
  g.fillRect(160, 1130, 420, 2);
  g.font = `400 26px ${mono}`;
  g.fillText("DATE UNLOCKED", 160, 1245);
  g.textAlign = "right";
  g.font = `italic 54px ${serif}`;
  g.fillText("Pip, Keeper of the Isles", W - 160, 1200);
  g.fillRect(W - 580, 1130, 420, 2);
  g.font = `400 26px ${mono}`;
  g.fillText("WITNESSED BY", W - 160, 1245);

  const url = cv.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `AxD-${c.recipient.replace(/\W+/g, "-")}-${c.title.replace(/\W+/g, "-")}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
