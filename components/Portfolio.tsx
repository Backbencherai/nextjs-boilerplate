"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  profile,
  heroLines,
  heroPills,
  aboutStatement,
  aboutPills,
  bannerWords,
  projects,
  experience,
  services,
  stats,
  type Project,
} from "@/lib/content";

gsap.registerPlugin(ScrollTrigger);

/* ---------- small pieces ---------- */

function Letters({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`letters ${className ?? ""}`} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span key={i} className="letter-mask" aria-hidden>
          <span className="letter">{ch === " " ? " " : ch}</span>
        </span>
      ))}
    </span>
  );
}

/** Hand-drawn "dc" monogram — a single stroked path that can be drawn on. */
function Monogram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 110" fill="none" aria-hidden>
      <path
        className="mono-path"
        pathLength={1}
        d="M62 14 V88 C62 96 70 98 74 90 M62 58 C58 44 26 42 22 66 C19 86 44 98 62 80 M126 54 C114 40 86 44 86 66 C86 90 112 96 128 80"
        stroke="currentColor"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Art({ p, big }: { p: Project; big?: boolean }) {
  return (
    <div
      className={`art ${big ? "art--big" : ""}`}
      style={{
        backgroundImage: p.image
          ? `url(${p.image})`
          : `radial-gradient(circle at 30% 30%, ${p.colors[1]}, ${p.colors[0]} 70%)`,
      }}
    >
      {!p.image && (
        <>
          <span className="art-shape art-shape--1" />
          <span className="art-shape art-shape--2" />
          <span className="art-title">{p.title}</span>
        </>
      )}
    </div>
  );
}

/** Thick orange ribbon with text running along a curve, driven by scroll. */
function CurvedBanner({ id, flip }: { id: string; flip?: boolean }) {
  const text = Array(8)
    .fill(bannerWords.map((w) => `${w}  •  `).join(""))
    .join("");
  return (
    <div className={`banner ${flip ? "banner--flip" : ""}`} aria-hidden>
      <svg viewBox="0 0 1440 260" preserveAspectRatio="none">
        <path id={id} d="M-200 230 C 300 60, 1000 20, 1640 120" fill="none" />
        <path className="banner-band" d="M-200 230 C 300 60, 1000 20, 1640 120" />
        <text className="banner-text" dy="16">
          <textPath href={`#${id}`} startOffset="0" data-banner>
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

/* ---------- page ---------- */

export default function Portfolio() {
  const root = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (target: string | number) => {
    setMenuOpen(false);
    lenisRef.current?.scrollTo(target, { duration: 1.6 });
  };

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = new Lenis({ duration: 1.15, smoothWheel: !reduce });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    window.scrollTo(0, 0);

    /* curved banners: always drifting, faster while scrolling */
    let offset = 0;
    let velocity = 0;
    lenis.on("scroll", (l: Lenis) => {
      velocity = l.velocity;
    });
    const banners = Array.from(document.querySelectorAll<SVGTextPathElement>("[data-banner]"));
    const unitLen = banners.map((tp) => {
      try {
        return tp.getComputedTextLength() / 8;
      } catch {
        return 1500;
      }
    });
    const bannerTick = () => {
      offset += reduce ? 0 : 1.1 + Math.min(Math.abs(velocity), 60) * 0.5;
      banners.forEach((tp, i) => {
        const len = unitLen[i] || 1500;
        const o = offset % len;
        tp.setAttribute("startOffset", String(i % 2 ? -len + o : -o));
      });
    };
    gsap.ticker.add(bannerTick);

    const ctx = gsap.context(() => {
      /* ===== PRELOADER: monogram draws, name pops, curtain lifts ===== */
      const intro = gsap.timeline({
        onComplete: () => {
          lenis.start();
          document.documentElement.classList.remove("is-loading");
          ScrollTrigger.refresh();
        },
      });
      intro
        .fromTo(
          ".preloader .mono-path",
          { strokeDasharray: 1, strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: reduce ? 0.2 : 1.6, ease: "power2.inOut" }
        )
        .to(".preloader .mono", { scale: 0.6, duration: 0.7, ease: "expo.inOut" })
        .from(
          ".pre-name .letter",
          { yPercent: 110, stagger: 0.035, duration: 0.8, ease: "expo.out" },
          "-=0.35"
        )
        .to({}, { duration: 0.45 })
        .to(".pre-inner", { scale: 0.9, autoAlpha: 0, duration: 0.6, ease: "expo.in" })
        .to(".preloader", { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.15")
        .from(".nav", { yPercent: -120, duration: 1, ease: "expo.out" }, "-=0.5")
        .from(
          ".hero-line .letter",
          { yPercent: 110, stagger: 0.025, duration: 1.1, ease: "expo.out" },
          "-=0.9"
        )
        .from(
          ".hero-pill",
          {
            y: -260,
            rotate: (i: number) => [-25, 30, -20][i % 3],
            autoAlpha: 0,
            stagger: 0.12,
            duration: 1.3,
            ease: "bounce.out",
          },
          "-=0.6"
        );

      /* ===== HERO scroll ===== */
      gsap.to(".hero-title", {
        yPercent: -20,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
      gsap.utils.toArray<SVGPathElement>(".loops path").forEach((p) => {
        gsap.fromTo(
          p,
          { strokeDasharray: 1, strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: { trigger: ".hero-visual", start: "top 95%", end: "bottom 40%", scrub: true },
          }
        );
      });
      gsap.to(".badge-ring", { rotate: 360, duration: 14, repeat: -1, ease: "none", transformOrigin: "50% 50%" });
      gsap.utils.toArray<HTMLElement>(".hero-card").forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 120, rotate: i ? 14 : -14 },
          {
            y: 0,
            rotate: i ? 5 : -5,
            ease: "none",
            scrollTrigger: { trigger: ".hero-visual", start: "top bottom", end: "center 60%", scrub: true },
          }
        );
      });

      /* ===== WORK STRIP: horizontal drift with scroll ===== */
      gsap.fromTo(
        ".strip-track",
        { xPercent: 0 },
        {
          xPercent: -30,
          ease: "none",
          scrollTrigger: { trigger: ".strip", start: "top bottom", end: "bottom top", scrub: true },
        }
      );

      /* ===== ABOUT: letters go peach -> orange -> black ===== */
      gsap.to(".about-text .ch", {
        keyframes: [{ color: "#ff5a00" }, { color: "#111010" }],
        stagger: 0.04,
        ease: "none",
        scrollTrigger: { trigger: ".about-text", start: "top 75%", end: "bottom 45%", scrub: true },
      });
      gsap.from(".about-pill", {
        y: -300,
        rotate: (i: number) => [-30, 25, -15][i % 3],
        autoAlpha: 0,
        stagger: 0.18,
        duration: 1.3,
        ease: "bounce.out",
        scrollTrigger: { trigger: ".about-text", start: "bottom 70%" },
      });

      /* ===== split headings & reveals ===== */
      gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
        gsap.from(el.querySelectorAll(".letter"), {
          yPercent: 110,
          stagger: 0.03,
          duration: 1.1,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 50,
          autoAlpha: 0,
          duration: 1.1,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 92%" },
        });
      });

      /* ===== WORK cards: grow in + inner parallax ===== */
      gsap.utils.toArray<HTMLElement>(".work-card").forEach((card) => {
        gsap.fromTo(
          card,
          { scale: 0.85, borderRadius: 48 },
          {
            scale: 1,
            borderRadius: 14,
            ease: "none",
            scrollTrigger: { trigger: card, start: "top bottom", end: "top 30%", scrub: true },
          }
        );
        const art = card.querySelector(".art");
        if (art)
          gsap.fromTo(
            art,
            { yPercent: -8 },
            {
              yPercent: 8,
              ease: "none",
              scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
            }
          );
      });

      /* ===== JOURNEY rows ===== */
      gsap.utils.toArray<HTMLElement>(".exp-row").forEach((row) => {
        gsap.from(row, {
          y: 60,
          autoAlpha: 0,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: row, start: "top 92%" },
        });
      });

      /* ===== SERVICES stacked cards ===== */
      const cards = gsap.utils.toArray<HTMLElement>(".service-card");
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        gsap.to(card, {
          scale: 0.92,
          rotate: i % 2 ? 2 : -2,
          ease: "none",
          scrollTrigger: { trigger: cards[i + 1], start: "top bottom", end: "top 20%", scrub: true },
        });
      });

      /* ===== STATS ===== */
      gsap.utils.toArray<HTMLElement>(".stat-num").forEach((el) => {
        const o = { v: 0 };
        gsap.to(o, {
          v: Number(el.dataset.value),
          duration: 2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
          onUpdate: () => {
            el.textContent = String(Math.round(o.v));
          },
        });
      });

      /* ===== CONTACT ===== */
      gsap.from(".contact-title .letter", {
        yPercent: 110,
        stagger: 0.04,
        duration: 1.1,
        ease: "expo.out",
        scrollTrigger: { trigger: ".contact-title", start: "top 85%" },
      });
    }, root);

    /* magnetic buttons */
    const magnets = Array.from(document.querySelectorAll<HTMLElement>("[data-magnetic]"));
    const handlers = magnets.map((el) => {
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * 0.3,
          y: (e.clientY - r.top - r.height / 2) * 0.3,
          duration: 0.5,
          ease: "power3.out",
        });
      };
      const leave = () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.35)" });
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      return { el, move, leave };
    });

    return () => {
      ctx.revert();
      gsap.ticker.remove(raf);
      gsap.ticker.remove(bannerTick);
      lenis.destroy();
      handlers.forEach(({ el, move, leave }) => {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      });
    };
  }, []);

  useEffect(() => {
    const l = lenisRef.current;
    if (!l) return;
    if (menuOpen) l.stop();
    else if (!document.documentElement.classList.contains("is-loading")) l.start();
  }, [menuOpen]);

  const navLinks = [
    { label: "Home", href: "#top" },
    { label: "About", href: "#about" },
    { label: "Work", href: "#work" },
    { label: "Journey", href: "#experience" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <div ref={root}>
      {/* ===== preloader ===== */}
      <div className="preloader" aria-hidden>
        <div className="pre-inner">
          <Monogram className="mono" />
          <div className="pre-name">
            <Letters text={profile.firstName} />
            <Letters text={profile.lastName} />
          </div>
        </div>
      </div>

      {/* ===== nav ===== */}
      <header className="nav">
        <a
          href="#top"
          className="logo"
          onClick={(e) => {
            e.preventDefault();
            scrollTo(0);
          }}
        >
          <Monogram className="logo-mono" />
          <span>{profile.firstName}</span>
        </a>
        <button
          className={`menu-btn ${menuOpen ? "is-open" : ""}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
        </button>
      </header>

      <div className={`menu ${menuOpen ? "is-open" : ""}`}>
        <ul>
          {navLinks.map((l, i) => (
            <li key={l.href} style={{ transitionDelay: menuOpen ? `${0.2 + i * 0.06}s` : "0s" }}>
              <a
                href={l.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(l.href === "#top" ? 0 : l.href);
                }}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="menu-foot">
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
          <a href={profile.linkedin} target="_blank" rel="noreferrer">
            LinkedIn ↗
          </a>
        </div>
      </div>

      <main id="top">
        {/* ===== hero ===== */}
        <section className="hero">
          <h1 className="hero-title">
            {heroLines.map((line) => (
              <span className="hero-line" key={line}>
                <Letters text={line} />
              </span>
            ))}
            {heroPills.map((p, i) => (
              <span className={`hero-pill hero-pill--${i}`} key={p}>
                {p}
              </span>
            ))}
          </h1>

          <div className="hero-visual">
            <svg className="loops" viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden>
              <path pathLength={1} d="M-40 80 C 120 40, 160 260, 60 300 C -40 340, -20 160, 110 200 C 230 240, 160 480, 20 560" />
            </svg>
            <svg className="loops loops--r" viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden>
              <path pathLength={1} d="M440 60 C 260 60, 220 280, 330 320 C 440 360, 430 170, 300 200 C 170 230, 230 480, 420 560" />
            </svg>

            <div className="hero-card hero-card--l">
              <span className="hc-label">Hello, I&apos;m</span>
              <span className="hc-name">{profile.firstName}</span>
            </div>
            <div className="badge">
              <svg className="badge-ring" viewBox="0 0 200 200" aria-hidden>
                <path id="badgeCircle" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0" fill="none" />
                <text>
                  <textPath href="#badgeCircle">SCROLL DOWN • SCROLL DOWN • SCROLL DOWN •</textPath>
                </text>
              </svg>
              <span className="badge-arrow">↓</span>
            </div>
            <div className="hero-card hero-card--r">
              <span className="hc-label">{profile.role}</span>
              <span className="hc-name">{profile.lastName}</span>
            </div>
          </div>

          <CurvedBanner id="curve-1" />
        </section>

        {/* ===== work strip ===== */}
        <section className="strip" aria-label="Project previews">
          <div className="strip-track">
            {[...projects, ...projects].map((p, i) => (
              <div className="strip-card" key={i}>
                <Art p={p} />
              </div>
            ))}
          </div>
        </section>

        {/* ===== about ===== */}
        <section className="about" id="about">
          <p className="eyebrow" data-reveal>
            A bit about me
          </p>
          <div className="about-wrap">
            <p className="about-text">
              {aboutStatement.split(" ").map((w, wi) => (
                <span key={wi}>
                  <span className="w">
                    {w.split("").map((c, ci) => (
                      <span className="ch" key={ci}>
                        {c}
                      </span>
                    ))}
                  </span>{" "}
                </span>
              ))}
            </p>
            {aboutPills.map((p, i) => (
              <span className={`about-pill about-pill--${i}`} key={p}>
                {p}
              </span>
            ))}
          </div>
          <p className="about-sub" data-reveal>
            {profile.about}
          </p>
        </section>

        {/* ===== selected works ===== */}
        <section className="works" id="work">
          <h2 className="big-title" data-split>
            <Letters text="Selected" />
            <Letters text="Works" />
          </h2>
          <div className="work-list">
            {projects.map((p) => (
              <article className="work-item" key={p.title}>
                <div className="work-card">
                  <Art p={p} big />
                </div>
                <div className="work-meta" data-reveal>
                  <h3>{p.title}</h3>
                  <span className="work-tag">{p.category}</span>
                  <span className="work-tag">{p.year}</span>
                </div>
                <p className="work-desc" data-reveal>
                  {p.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ===== journey ===== */}
        <section className="journey" id="experience">
          <h2 className="big-title" data-split>
            <Letters text="The" />
            <Letters text="Journey" />
          </h2>
          <div className="exp-list">
            {experience.map((e, i) => (
              <div className="exp-row" key={i}>
                <span className="exp-period">{e.period}</span>
                <span className="exp-company">{e.company}</span>
                <span className="exp-role">{e.role}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ===== services ===== */}
        <section className="services">
          <h2 className="big-title" data-split>
            <Letters text="What" />
            <Letters text="I Do" />
          </h2>
          <div className="service-stack">
            {services.map((s, i) => (
              <div className="service-card" key={s.title} style={{ top: `${14 + i * 4}vh` }}>
                <span className="service-num">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== stats ===== */}
        <section className="stats">
          {stats.map((s) => (
            <div className="stat" key={s.label} data-reveal>
              <div className="stat-value">
                <span className="stat-num" data-value={s.value}>
                  0
                </span>
                {s.suffix}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </section>
      </main>

      {/* ===== contact ===== */}
      <footer className="contact" id="contact">
        <CurvedBanner id="curve-2" flip />
        <div className="contact-inner">
          <p className="eyebrow eyebrow--light">Got an idea?</p>
          <h2 className="contact-title">
            <Letters text="Let's" />
            <Letters text="Talk" />
          </h2>
          <div className="contact-actions">
            <a href={`mailto:${profile.email}`} className="btn btn--dark" data-magnetic>
              Say hello →
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="btn btn--line" data-magnetic>
              LinkedIn ↗
            </a>
          </div>
          <div className="footer">
            <span>
              © {new Date().getFullYear()} {profile.firstName} {profile.lastName}
            </span>
            <button onClick={() => scrollTo(0)}>Back to top ↑</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
