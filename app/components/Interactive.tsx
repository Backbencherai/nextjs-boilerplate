"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { flagship, profile, projects, type Category } from "../data";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Ambient Noir & Crimson canvas: drifting red orbs + expanding op-art rings,
      eased mouse parallax, paused when the hero is off-screen or the tab is hidden. */
export function AuroraCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = false;
    let frame = 0;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const orbs = [
      { x: 0.35, y: 0.4, r: 0.5, vx: 0.0003, vy: 0.0002, c: "rgba(239, 68, 68, 0.14)" },
      { x: 0.7, y: 0.45, r: 0.42, vx: -0.0002, vy: 0.0003, c: "rgba(185, 28, 28, 0.10)" },
      { x: 0.5, y: 0.8, r: 0.48, vx: 0.0002, vy: -0.0002, c: "rgba(255, 255, 255, 0.03)" },
    ];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    const onMove = (e: MouseEvent) => {
      mouse.tx = e.clientX / width;
      mouse.ty = e.clientY / height;
    };

    const render = () => {
      if (!running) return;
      frame++;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      ctx.clearRect(0, 0, width, height);

      for (const o of orbs) {
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < 0.1 || o.x > 0.9) o.vx *= -1;
        if (o.y < 0.1 || o.y > 0.9) o.vy *= -1;
        const px = (o.x + (mouse.x - 0.5) * 0.06) * width;
        const py = (o.y + (mouse.y - 0.5) * 0.06) * height;
        const r = o.r * Math.min(width, height);
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, o.c);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      const cx = width * 0.5 + (mouse.x - 0.5) * 20;
      const cy = height * 0.45 + (mouse.y - 0.5) * 20;
      const base = (frame * 0.4) % 120;
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const rr = base + i * 140;
        const a = Math.max(0, 0.04 - (rr / (Math.max(width, height) * 0.7)) * 0.04);
        if (a > 0.005) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(render);
    };

    const start = () => {
      if (!running) {
        running = true;
        render();
      }
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const onVis = () => (document.hidden ? stop() : start());

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);

    let io: IntersectionObserver | undefined;
    if (reducedMotion()) {
      running = true;
      render();
      stop();
    } else {
      start();
      const hero = document.getElementById("hero");
      if (hero) {
        io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop())), {
          threshold: 0.02,
        });
        io.observe(hero);
      }
    }

    return () => {
      stop();
      io?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas id="aurora-canvas" ref={ref} aria-hidden="true" />;
}

/* ── Hero "build" entrance + scroll reveals for section blocks ─────── */
export function MotionReveals() {
  useEffect(() => {
    const hero = document.querySelectorAll<HTMLElement>(".hero-flank, .hero-center-col");
    const items = document.querySelectorAll<HTMLElement>(".reveal-item");
    if (reducedMotion() || !("IntersectionObserver" in window)) {
      hero.forEach((el) => el.classList.add("is-built"));
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => hero.forEach((el) => el.classList.add("is-built"))));
    const io = new IntersectionObserver(
      (es, obs) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

/* ── Floating glass nav dock with active-section highlight ─────────── */
const navLinks = [
  { href: "#about", label: "About" },
  { href: "#flagships", label: "Work" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
];

export function NavDock() {
  const [active, setActive] = useState("");
  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { threshold: 0.3 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <header className="dock-container">
      <nav className="nav-dock" aria-label="Main navigation">
        <a href="#hero" className="nav-brand" aria-label={`${profile.name} home`}>
          <span className="brand-monogram">{profile.initials}</span>
          <span className="brand-label">
            {profile.name.toUpperCase()}
            <span className="brand-dot">.</span>
          </span>
        </a>
        <div className="nav-links">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className={`nav-item${active === l.href.slice(1) ? " active" : ""}`}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="dock-right">
          {profile.available && (
            <div className="dock-status" title="Currently open for new projects">
              <span className="status-dot" />
              <span className="status-text">Available</span>
            </div>
          )}
          <a href="#contact" className="dock-cta">
            HIRE ME →
          </a>
        </div>
      </nav>
    </header>
  );
}

/* ── Featured project tab explorer (fade/slide content swap) ───────── */
export function LayerExplorer() {
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const [fading, setFading] = useState(false);

  const pick = (i: number) => {
    if (i === active) return;
    setActive(i);
    setFading(true);
    setTimeout(() => {
      setShown(i);
      setFading(false);
    }, 180);
  };
  const layer = flagship.layers[shown];

  return (
    <div className="saai-architecture-explorer">
      <div className="explorer-header">
        <div className="explorer-title">{flagship.explorerTitle}</div>
        <div className="explorer-sub">{flagship.explorerSub}</div>
      </div>
      <div className="layer-tabs" role="tablist">
        {flagship.layers.map((l, i) => (
          <button
            key={l.tab}
            role="tab"
            aria-selected={i === active}
            className={`layer-tab${i === active ? " active" : ""}`}
            onClick={() => pick(i)}
          >
            {l.tab}
          </button>
        ))}
      </div>
      <div className="layer-inspector-pane">
        <div className={`layer-content${fading ? " is-fading" : ""}`}>
          <div className="layer-inspect-badge">{layer.badge}</div>
          <h4 className="layer-inspect-title">{layer.title}</h4>
          <p className="layer-inspect-desc">{layer.desc}</p>
          <div className="tech-tags-group">
            {layer.tags.map((t) => (
              <span key={t} className="tech-tag">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Filterable bento grid ─────────────────────────────────────────── */
const filters: { key: "all" | Category; label: string }[] = [
  { key: "all", label: `All Projects (${projects.length})` },
  { key: "web", label: "Web" },
  { key: "design", label: "Design" },
  { key: "tools", label: "Tools" },
];

export function ProjectFilters() {
  const [filter, setFilter] = useState<"all" | Category>("all");
  useEffect(() => {
    document.querySelectorAll<HTMLElement>(".bento-card").forEach((c) => {
      c.classList.toggle("hidden", filter !== "all" && c.dataset.category !== filter);
    });
  }, [filter]);
  return (
    <div className="bento-controls">
      {filters.map((f) => (
        <button key={f.key} className={`filter-btn${filter === f.key ? " active" : ""}`} onClick={() => setFilter(f.key)}>
          {f.label}
        </button>
      ))}
    </div>
  );
}

/* ── Copy email + floating toast ───────────────────────────────────── */
export function CopyEmail() {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toast = (m: string) => {
    setMsg(m);
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 3200);
  };

  const copy = async () => {
    const text = profile.email;
    try {
      await navigator.clipboard.writeText(text);
      toast(`Copied to clipboard: ${text}`);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast(`Copied to clipboard: ${text}`);
      } catch {
        toast(`Direct email: ${text}`);
      }
      ta.remove();
    }
  };

  return (
    <>
      <div className="email-action-box">
        <span className="email-address">{profile.email}</span>
        <button className="btn btn-primary copy-btn" onClick={copy} aria-label="Copy email address">
          <Icon name="copy" size={16} />
          <span>Copy Email Address</span>
        </button>
      </div>
      <div className={`toast-notification${show ? " show" : ""}`} aria-live="polite">
        <span className="toast-icon">✓</span>
        <span className="toast-text">{msg}</span>
      </div>
    </>
  );
}
