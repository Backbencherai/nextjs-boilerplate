"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { flagship, gallery, projects, profile, type Category } from "../data";

/* ── Preloader (SAVO-style full-screen fade out) ───────────────── */
export function Preloader() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 700);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`preloader${done ? " is-done" : ""}`} aria-hidden="true">
      <div className="preloader-ring" />
    </div>
  );
}

/* ── Scroll reveal: data-reveal="top|left|right|bottom" data-delay="0.25"
      Mirrors scrollReveal.js: "wait Xs, then enter <dir> and move 40px over 1s" */
export function ScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("revealed"));
      return;
    }
    els.forEach((el) => {
      const d = el.dataset.delay;
      if (d) el.style.transitionDelay = `${d}s`;
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

/* ── Header: transparent → solid on scroll, mobile toggle ───────── */
const navLinks = [
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#flagships", label: "Work" },
  { href: "#projects", label: "Projects" },
  { href: "#gallery", label: "Gallery" },
  { href: "#contact", label: "Contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`header${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}`}>
      <div className="container header-inner">
        <a href="#hero" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mono">{profile.initials}</span>
          <span className="brand-label">
            {profile.name.toUpperCase()}
            <span className="accent">.</span>
          </span>
        </a>
        <button
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className="nav" aria-label="Main navigation">
          <ul className="menu">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          {profile.available && (
            <span className="status" title="Open to new projects">
              <span className="status-dot" /> Available
            </span>
          )}
          <a href="#contact" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>
            Hire Me
          </a>
        </nav>
      </div>
    </header>
  );
}

/* ── Featured-project layer explorer (tabs) ─────────────────────── */
export function LayerExplorer() {
  const [active, setActive] = useState(0);
  const layer = flagship.layers[active];
  return (
    <div className="explorer">
      <div className="explorer-head">
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
            onClick={() => setActive(i)}
          >
            {l.tab}
          </button>
        ))}
      </div>
      <div className="layer-pane" key={active}>
        <div className="layer-badge">{layer.badge}</div>
        <h4 className="layer-title">{layer.title}</h4>
        <p className="layer-desc">{layer.desc}</p>
        <div className="tags">
          {layer.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Filterable project grid ───────────────────────────────────── */
const filters: { key: "all" | Category; label: string }[] = [
  { key: "all", label: `All (${projects.length})` },
  { key: "web", label: "Web" },
  { key: "design", label: "Design" },
  { key: "tools", label: "Tools" },
];

export function ProjectMatrix() {
  const [filter, setFilter] = useState<"all" | Category>("all");
  return (
    <>
      <div className="filters" data-reveal="top" data-delay="0.35">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`filter-btn${filter === f.key ? " active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="bento">
        {projects.map((p, i) => {
          const hidden = filter !== "all" && p.category !== filter;
          return (
            <article
              key={p.title}
              className={`card bento-card${hidden ? " is-hidden" : ""}`}
              data-reveal={i % 2 ? "right" : "left"}
              data-delay="0.25"
            >
              <div className="bento-top">
                <span className="chip">{p.chip}</span>
                {p.href ? (
                  <a href={p.href} target="_blank" rel="noopener noreferrer" className="bento-link" aria-label={`${p.title} link`}>
                    <Icon name="external" size={16} />
                  </a>
                ) : (
                  <span className="bento-id">#{String(i + 1).padStart(2, "0")}</span>
                )}
              </div>
              <h3 className="bento-title">{p.title}</h3>
              <p className="bento-desc">{p.desc}</p>
              <div className="tags">
                {p.tags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

/* ── Gallery tile ───────────────────────────────────────────────── */
function Tile({ g }: { g: (typeof gallery)[number] }) {
  return (
    <div
      className="tile"
      style={
        g.src
          ? { backgroundImage: `url(${g.src})` }
          : {
              backgroundImage: `linear-gradient(135deg, hsl(${g.hue} 80% 55%), hsl(${g.hue + 30} 70% 30%))`,
            }
      }
    >
      <span className="tile-label">{g.title}</span>
    </div>
  );
}

export function GalleryGrid() {
  return (
    <div className="gallery-grid">
      {gallery.map((g, i) => (
        <div key={g.title} data-reveal="left" data-delay={(0.1 + (i % 4) * 0.1).toFixed(2)}>
          <Tile g={g} />
        </div>
      ))}
    </div>
  );
}

/* ── Carousel (owl-carousel style: auto-advance, dots, arrows) ──── */
export function Carousel() {
  const track = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const paused = useRef(false);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => {
      setPages(Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth - 0.05)));
      setPage(Math.round(el.scrollLeft / el.clientWidth));
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const go = (p: number) => {
    const el = track.current;
    if (!el) return;
    const n = (p + pages) % pages;
    el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (!paused.current) go(page + 1);
    }, 4000);
    return () => clearInterval(id);
  });

  return (
    <div
      className="carousel"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div className="carousel-track" ref={track}>
        {[...gallery].reverse().map((g) => (
          <div className="carousel-item" key={g.title}>
            <Tile g={g} />
          </div>
        ))}
      </div>
      <button className="carousel-arrow prev" aria-label="Previous" onClick={() => go(page - 1)}>
        ‹
      </button>
      <button className="carousel-arrow next" aria-label="Next" onClick={() => go(page + 1)}>
        ›
      </button>
      <div className="carousel-dots">
        {Array.from({ length: pages }).map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            className={`dot${i === page ? " active" : ""}`}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Copy email + toast ─────────────────────────────────────────── */
export function CopyEmail() {
  const [toast, setToast] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
    } catch {
      /* clipboard may be unavailable; still show feedback */
    }
    setToast(true);
    setTimeout(() => setToast(false), 2400);
  };
  return (
    <>
      <div className="email-box">
        <a className="email" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
        <button className="btn btn-primary btn-rocket" onClick={copy}>
          <Icon name="copy" size={16} />
          <span>Copy Email</span>
        </button>
      </div>
      <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">
        ✓ Email copied: {profile.email}
      </div>
    </>
  );
}

/* ── Newsletter / message form (front-end only) ─────────────────── */
export function Subscribe() {
  const [sent, setSent] = useState(false);
  return (
    <form
      className="subscribe"
      onSubmit={(e) => {
        e.preventDefault();
        const email = new FormData(e.currentTarget).get("email");
        window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(
          "Hello from your portfolio",
        )}&body=${encodeURIComponent(`Reply to: ${email}`)}`;
        setSent(true);
      }}
    >
      <input type="email" name="email" required placeholder="Enter your e-mail address..." aria-label="Email address" />
      <button type="submit" className="subscribe-btn">
        {sent ? "Sent ✓" : "Notify Me"}
      </button>
    </form>
  );
}
