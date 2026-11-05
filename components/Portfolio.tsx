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
  testimonials,
  faqs,
  footerLine,
  type Project,
} from "@/lib/content";

gsap.registerPlugin(ScrollTrigger);
/* stroke-drawing animates fractional values (0 → 1); GSAP's pixel rounding would make them jump */
gsap.defaults({ autoRound: false });

/* ═════════════════════════ small building blocks ═════════════════════════ */

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

/** Hand-drawn "dc" monogram, written as a single continuous stroke so it can "write itself". */
function Monogram({ className }: { className?: string }) {
  const common = {
    stroke: "currentColor",
    strokeWidth: 9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    pathLength: 1,
  };
  return (
    <svg className={className} viewBox="0 0 140 110" fill="none" aria-hidden>
      {/* one continuous pen stroke: bowl of the d → up and down the stem → into the c */}
      <path
        className="mono-path"
        d="M60 60 C54 46 24 46 22 66 C20 88 50 96 60 80 L62 14 L62 84 C62 96 76 98 86 86 C90 76 88 54 102 48 C112 43 122 46 126 54 C122 46 112 43 102 48 C88 54 90 76 86 86 C84 96 116 100 128 80"
        {...common}
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden>
      <path d="M7 17 L17 7 M9 7 H17 V15" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LetsTalk({ className }: { className?: string }) {
  return (
    <a href={`mailto:${profile.email}`} className={`talk ${className ?? ""}`} data-magnetic>
      <span>Let&apos;s Talk</span>
      <i>
        <Arrow />
      </i>
    </a>
  );
}

function Art({ p }: { p: Project }) {
  /* real image when provided, otherwise a clean typographic placeholder card */
  if (p.image) return <div className="art" style={{ backgroundImage: `url(${p.image})` }} />;
  return (
    <div className="art art--ph" style={{ background: p.colors[1], color: p.colors[0] }}>
      <span className="art-cat">{p.category}</span>
      <span className="art-title">{p.title}</span>
      <span className="art-year">{p.year}</span>
    </div>
  );
}

/** Thick ribbon with text running along a curve; driven by time + scroll speed. */
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

function useClock(timezone: string) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: timezone });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [timezone]);
  return time;
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* ═════════════════════════════════ page ═════════════════════════════════ */

export default function Portfolio() {
  const root = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const nameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const time = useClock(profile.timezone);

  const scrollTo = (target: string | number) => {
    setMenuOpen(false);
    lenisRef.current?.scrollTo(target, { duration: 1.6 });
  };

  /* logo click: the dc redraws and the name slides out, then tucks away again */
  const toggleName = () => {
    if (nameTimer.current) clearTimeout(nameTimer.current);
    setNameOpen((open) => {
      if (!open) nameTimer.current = setTimeout(() => setNameOpen(false), 3500);
      return !open;
    });
    gsap.fromTo(
      ".logo .mono-path",
      { strokeDasharray: 1, strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1.1, ease: "power1.inOut" }
    );
  };
  useEffect(
    () => () => {
      if (nameTimer.current) clearTimeout(nameTimer.current);
    },
    []
  );

  /* FAQ open/close changes page height → let ScrollTrigger re-measure after the transition */
  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 520);
    return () => clearTimeout(id);
  }, [openFaq]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- smooth scroll ---------- */
    const lenis = new Lenis({ duration: 1.15, smoothWheel: !reduce });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    lenis.stop();
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    /* ---------- curved ribbons ---------- */
    let offset = 0;
    let velocity = 0;
    let lastY = 0;
    const nav = document.querySelector<HTMLElement>(".nav");
    lenis.on("scroll", (l: Lenis) => {
      velocity = l.velocity;
      const y = l.scroll;
      if (y > 160 && y > lastY + 2) nav?.classList.add("nav--hidden");
      else if (y < lastY - 2 || y <= 160) nav?.classList.remove("nav--hidden");
      lastY = y;
    });
    const banners = Array.from(document.querySelectorAll<SVGTextPathElement>("[data-banner]"));
    const unitLen = banners.map((tp) => {
      try {
        return tp.getComputedTextLength() / 8 || 1500;
      } catch {
        return 1500;
      }
    });
    const bannerTick = () => {
      offset += reduce ? 0 : 1.1 + Math.min(Math.abs(velocity), 60) * 0.5;
      banners.forEach((tp, i) => {
        const len = unitLen[i];
        const o = offset % len;
        tp.setAttribute("startOffset", String(i % 2 ? -len + o : -o));
      });
    };
    gsap.ticker.add(bannerTick);

    const ctx = gsap.context(() => {
      const d = reduce ? 0.25 : 1;

      /* ═════ INTRO: d draws → c joins → full name → dc flies into the header ═════ */
      const preMono = ".preloader .mono";
      const navMono = ".nav .logo-mono";
      gsap.set(navMono, { autoAlpha: 0 });
      gsap.set(".nav-side", { autoAlpha: 0, y: -20 });
      gsap.set(".menu-btn", { scale: 0, rotate: -90 });
      let fly = { dx: 0, dy: 0, s: 1 };

      /* while the intro plays, never skip frames after a hiccup (slow phones):
         pause instead, so every frame of the drawing is seen */
      gsap.ticker.lagSmoothing(250, 33);
      const intro = gsap.timeline({
        paused: true,
        onComplete: () => {
          gsap.ticker.lagSmoothing(0);
          lenis.start();
          document.documentElement.classList.remove("is-loading");
          ScrollTrigger.refresh();
        },
      });
      intro
        .set(".preloader .mono-path, .pre-loops path", { strokeDasharray: 1, strokeDashoffset: 1 })
        /* background loops sweep across while the mark draws */
        .set(".pre-name", { visibility: "visible" })
        .to(".pre-loops path", { strokeDashoffset: 0, duration: 2.2 * d, stagger: 0.25, ease: "power2.inOut" }, 0)
        .fromTo(preMono, { scale: 0.6, rotate: -12 }, { scale: 1, rotate: 0, duration: 1.4 * d, ease: "elastic.out(1, 0.5)" }, 0.1)
        .to(".preloader .mono-path", { strokeDashoffset: 0, duration: 1.6 * d, ease: "power1.inOut" }, 0.15)
        /* full name bounces in from the centre */
        .fromTo(
          ".pre-name .letter",
          { yPercent: 120, rotate: () => gsap.utils.random(-25, 25), scale: 0.6 },
          { yPercent: 0, rotate: 0, scale: 1, stagger: { each: 0.035, from: "center" }, duration: 1 * d, ease: "back.out(2.2)" },
          "-=0.6"
        )
        .fromTo(
          ".pre-role",
          { y: 40, scale: 0.6, rotate: -14, autoAlpha: 0 },
          { y: 0, scale: 1, rotate: -3, autoAlpha: 1, duration: 0.9 * d, ease: "back.out(2.5)" },
          "-=0.55"
        )
        /* short hold so the name can be read */
        .to(".pre-inner", { scale: 1.03, duration: 0.5 * d, ease: "sine.inOut" })
        /* exit: name jumps away, loops fade, the dc flies to the header */
        .to(".pre-role", { y: 30, autoAlpha: 0, rotate: 10, duration: 0.4 * d, ease: "power2.in" })
        .to(
          ".pre-name .letter",
          { yPercent: -120, rotate: () => gsap.utils.random(-20, 20), stagger: { each: 0.02, from: "edges" }, duration: 0.6 * d, ease: "back.in(1.6)" },
          "<"
        )
        .to(".pre-loops", { autoAlpha: 0, duration: 0.6 * d }, "<0.2")
        .add(() => {
          const from = document.querySelector(preMono)!.getBoundingClientRect();
          const to = document.querySelector(navMono)!.getBoundingClientRect();
          fly = {
            dx: to.left + to.width / 2 - (from.left + from.width / 2),
            dy: to.top + to.height / 2 - (from.top + from.height / 2),
            s: to.width / from.width,
          };
        })
        .to(preMono, { x: () => fly.dx, y: () => fly.dy, scale: () => fly.s, duration: 1 * d, ease: "expo.inOut" })
        .to(".preloader", { backgroundColor: "rgba(251,227,227,0)", duration: 0.7 * d, ease: "power2.out" }, "-=0.6")
        .set(navMono, { autoAlpha: 1 })
        .set(".preloader", { display: "none" })
        .to(".menu-btn", { scale: 1, rotate: 0, duration: 0.9, ease: "back.out(2)" }, "-=0.5")
        .to(".nav-side", { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.8, ease: "expo.out" }, "<")
        /* hero entrance */
        .from(
          ".hero-line .letter",
          { yPercent: 115, rotate: () => gsap.utils.random(-12, 12), stagger: 0.025, duration: 1.1, ease: "back.out(1.6)" },
          "-=1.1"
        )
        .from(
          ".hero-pill",
          { y: -260, rotate: (i: number) => [-25, 30, -20][i % 3], autoAlpha: 0, stagger: 0.12, duration: 1.3, ease: "bounce.out" },
          "-=0.6"
        )
        .from(".hero-card--l", { x: "-60vw", rotate: -25, duration: 1.4, ease: "expo.out" }, "-=1.2")
        .from(".hero-card--r", { x: "60vw", rotate: 25, duration: 1.4, ease: "expo.out" }, "<0.1")
        .from(".badge", { scale: 0, rotate: -200, duration: 1.2, ease: "back.out(1.8)" }, "<0.3")
        .from(".hero .banner", { yPercent: 80, autoAlpha: 0, duration: 1.2, ease: "expo.out" }, "<");

      /* start once the page has settled: fonts ready (or 1.5s max) + one clean frame */
      Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]).then(() =>
        requestAnimationFrame(() => requestAnimationFrame(() => intro.play()))
      );

      /* header dc: writes itself again every few seconds, and on hover */
      const rewrite = () => {
        if (gsap.isTweening(".logo .mono-path")) return;
        gsap.fromTo(".logo .mono-path", { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: "power1.inOut" });
        gsap.fromTo(".logo .logo-mono", { rotate: -10 }, { rotate: 0, duration: 1.2, ease: "elastic.out(1, 0.4)" });
      };
      intro.call(() => {
        gsap.delayedCall(6, function loop() {
          if (!document.hidden) rewrite();
          gsap.delayedCall(7, loop);
        });
      });
      document.querySelector(".logo")?.addEventListener("mouseenter", rewrite);

      /* headline letters jump when touched / hovered */
      gsap.utils.toArray<HTMLElement>(".hero-line .letter").forEach((el) => {
        const jump = () => {
          if (gsap.isTweening(el)) return;
          gsap.fromTo(el, { y: 0 }, { y: "-0.18em", rotate: gsap.utils.random(-10, 10), duration: 0.22, ease: "power2.out", yoyo: true, repeat: 1 });
        };
        el.addEventListener("pointerenter", jump);
        el.addEventListener("pointerdown", jump);
      });

      /* ═════ HERO ═════ */
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
      /* cards "walk": a constant sway, plus scroll lift */
      gsap.utils.toArray<HTMLElement>(".hero-card").forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 120 },
          { y: 0, ease: "none", scrollTrigger: { trigger: ".hero-visual", start: "top bottom", end: "center 60%", scrub: true } }
        );
        gsap.fromTo(
          card.querySelector(".hero-card-in"),
          { rotate: i ? 3 : -7, yPercent: 0 },
          { rotate: i ? 7 : -3, yPercent: -3, duration: 0.55, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.27 }
        );
      });

      /* ═════ SLIDER STRIP ═════ */
      gsap.fromTo(
        ".strip-track",
        { xPercent: 0 },
        { xPercent: -30, ease: "none", scrollTrigger: { trigger: ".strip", start: "top bottom", end: "bottom top", scrub: true } }
      );

      /* ═════ ABOUT: letters peach → orange → black ═════ */
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

      /* ═════ generic: split headings, reveals ═════ */
      gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
        gsap.from(el.querySelectorAll(".letter"), {
          yPercent: 110,
          stagger: 0.025,
          duration: 1.1,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, { y: 50, autoAlpha: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" } });
      });

      /* ═════ small labels slide in; slider cards pop in ═════ */
      gsap.utils.toArray<HTMLElement>(".eyebrow:not([data-reveal])").forEach((el) => {
        gsap.from(el, { x: -30, autoAlpha: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" } });
      });
      gsap.from(".strip-card", {
        scale: 0.7,
        rotate: (i: number) => (i % 2 ? 8 : -8),
        autoAlpha: 0,
        stagger: 0.07,
        duration: 1,
        ease: "back.out(1.6)",
        scrollTrigger: { trigger: ".strip", start: "top 90%" },
      });

      /* ═════ PROJECTS: cards rise, middle column runs faster ═════ */
      gsap.utils.toArray<HTMLElement>(".proj").forEach((card) => {
        gsap.from(card, {
          y: 120,
          rotate: 3,
          autoAlpha: 0,
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: { trigger: card, start: "top 95%" },
        });
      });
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        gsap.utils.toArray<HTMLElement>(".proj:nth-child(3n+2) .proj-media").forEach((media) => {
          gsap.fromTo(
            media,
            { y: 60 },
            { y: -60, ease: "none", scrollTrigger: { trigger: media, start: "top bottom", end: "bottom top", scrub: true } }
          );
        });
      });
      gsap.from(".more-pill", {
        y: -240,
        rotate: (i: number) => [20, -25, 15][i % 3],
        autoAlpha: 0,
        stagger: 0.15,
        duration: 1.2,
        ease: "bounce.out",
        scrollTrigger: { trigger: ".more", start: "top 70%" },
      });

      /* ═════ JOURNEY ═════ */
      gsap.utils.toArray<HTMLElement>(".exp-row").forEach((row) => {
        gsap.from(row, { y: 60, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: row, start: "top 92%" } });
      });

      /* ═════ SERVICES: a winding line draws itself, skills light up as it passes ═════ */
      const track = document.querySelector<HTMLElement>(".svc-track");
      const svg = document.querySelector<SVGSVGElement>(".svc-svg");
      const base = document.querySelector<SVGPathElement>(".svc-base");
      const line = document.querySelector<SVGPathElement>(".svc-line");
      const head = document.querySelector<HTMLElement>(".svc-head");
      const items = gsap.utils.toArray<HTMLElement>(".svc-item");
      if (track && svg && base && line && head && items.length) {
        let len = 0;
        let stops: number[] = [];
        const layout = () => {
          const W = track.clientWidth;
          const H = track.clientHeight;
          const pts = items.map((el) => [(parseFloat(el.dataset.x!) / 100) * W, (parseFloat(el.dataset.y!) / 100) * H]);
          const dy = H / (items.length + 1) / 1.6;
          let dStr = `M ${W * 1.05} ${-H * 0.02} C ${W * 0.9} ${pts[0][1] * 0.2}, ${pts[0][0] + W * 0.2} ${pts[0][1] - dy}, ${pts[0][0]} ${pts[0][1]}`;
          for (let i = 1; i < pts.length; i++) {
            const [ax, ay] = pts[i - 1];
            const [bx, by] = pts[i];
            dStr += ` C ${ax + (ax - bx) * 0.35} ${ay + dy}, ${bx + (bx - ax) * 0.35} ${by - dy}, ${bx} ${by}`;
          }
          const [lx, ly] = pts[pts.length - 1];
          dStr += ` C ${lx} ${ly + dy}, ${W * 0.5} ${H * 0.98}, ${W * 0.5} ${H}`;
          svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
          base.setAttribute("d", dStr);
          line.setAttribute("d", dStr);
          len = line.getTotalLength();
          line.style.strokeDasharray = `${len}`;
          /* where along the path each skill sits */
          stops = pts.map(([x, y]) => {
            let best = 0;
            let bestD = Infinity;
            for (let s = 0; s <= 400; s++) {
              const p = line.getPointAtLength((s / 400) * len);
              const dd = (p.x - x) ** 2 + (p.y - y) ** 2;
              if (dd < bestD) {
                bestD = dd;
                best = s / 400;
              }
            }
            return best;
          });
        };
        const draw = (prog: number) => {
          if (!len) return;
          line.style.strokeDashoffset = `${len * (1 - prog)}`;
          const p = line.getPointAtLength(len * prog);
          gsap.set(head, { x: p.x, y: p.y });
          items.forEach((el, i) => el.classList.toggle("is-on", prog >= stops[i] - 0.015));
        };
        layout();
        ScrollTrigger.create({
          trigger: track,
          start: "top 70%",
          end: "bottom 60%",
          onRefreshInit: layout,
          onRefresh: (self) => draw(self.progress),
          onUpdate: (self) => draw(self.progress),
        });
        draw(0);
      }

      /* ═════ RECOMMENDATIONS: pinned deck, top card flies off each step ═════ */
      const cards = gsap.utils.toArray<HTMLElement>(".t-card");
      if (cards.length > 1) {
        gsap.set(cards, { rotate: (i: number) => (i ? (i % 2 ? 4 : -4) : -1.5), zIndex: (i: number) => cards.length - i });
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".testimonials",
            start: "top top",
            end: () => `+=${(cards.length - 1) * 70}%`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        cards.slice(0, -1).forEach((card, i) => {
          tl.to(card, { yPercent: -150, xPercent: i % 2 ? 30 : -30, rotate: i % 2 ? 18 : -18, ease: "power2.in", duration: 1 }).to(
            cards[i + 1],
            { rotate: 0, duration: 0.6, ease: "power2.out" },
            "-=0.6"
          );
        });
      }

      /* ═════ FAQ doodle ═════ */
      gsap.fromTo(
        ".faq-doodle path",
        { strokeDasharray: 1, strokeDashoffset: 1 },
        { strokeDashoffset: 0, stagger: 0.2, duration: 1.6, ease: "power2.inOut", scrollTrigger: { trigger: ".faq", start: "top 70%" } }
      );

      /* ═════ FOOTER ═════ */
      gsap.from(".foot-title .letter", {
        yPercent: 110,
        stagger: 0.015,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: ".foot", start: "top 75%" },
      });
      gsap.fromTo(
        ".foot-mono .mono-path",
        { strokeDasharray: 1, strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: "none",
          stagger: 0.3,
          scrollTrigger: { trigger: ".foot-mono", start: "top bottom", end: "bottom bottom", scrub: true },
        }
      );
      gsap.fromTo(
        ".foot-loops path",
        { strokeDasharray: 1, strokeDashoffset: 1 },
        { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: true } }
      );
    }, root);

    /* ---------- magnetic buttons (mouse only) ---------- */
    const fine = window.matchMedia("(pointer: fine)").matches;
    const magnets = fine ? Array.from(document.querySelectorAll<HTMLElement>("[data-magnetic]")) : [];
    const handlers = magnets.map((el) => {
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.5, ease: "power3.out" });
      };
      const leave = () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.35)" });
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      return { el, move, leave };
    });

    /* fonts can change text sizes after load */
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

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
    { label: "Journey", href: "#journey" },
    { label: "Skills", href: "#skills" },
    { label: "Contact", href: "#contact" },
  ];
  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollTo(href === "#top" ? 0 : href);
  };

  /* zig-zag positions (in %) for skills along the winding line */
  const svcPos = services.map((_, i) => ({ x: i % 2 ? 31 : 69, y: ((i + 0.8) / (services.length + 0.4)) * 100 }));

  return (
    <div ref={root}>
      {/* ═════ intro ═════ */}
      <div className="preloader" aria-hidden>
        <svg className="pre-loops" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <path pathLength={1} d="M-80 640 C 160 380, 420 760, 560 560 C 700 360, 420 220, 330 380 C 240 540, 620 700, 860 520 C 1100 340, 1000 120, 1180 160 C 1360 200, 1380 420, 1520 380" />
          <path pathLength={1} d="M1520 760 C 1240 860, 1080 620, 1180 520 C 1280 420, 1420 560, 1300 680 C 1180 800, 860 820, 760 720" />
        </svg>
        <div className="pre-inner">
          <Monogram className="mono" />
          <div className="pre-name">
            <Letters text={profile.firstName} />
            <Letters text={profile.lastName} />
          </div>
          <span className="pre-role">{profile.role}</span>
        </div>
      </div>

      {/* ═════ header ═════ */}
      <header className="nav">
        <nav className="nav-side nav-links">
          <a href="#work" onClick={go("#work")}>
            Work
          </a>
          <a href="#about" onClick={go("#about")}>
            About me
          </a>
        </nav>

        <button
          className={`logo ${nameOpen ? "is-open" : ""}`}
          onClick={toggleName}
          aria-label={`${profile.firstName} ${profile.lastName}`}
          aria-expanded={nameOpen}
        >
          <Monogram className="logo-mono" />
          <span className="logo-name" aria-hidden>
            {profile.firstName.split("").map((c, i) => (
              <span key={i} style={{ transitionDelay: `${(nameOpen ? i : profile.firstName.length - i) * 0.035}s` }}>
                {c}
              </span>
            ))}
          </span>
        </button>

        <div className="nav-side nav-right">
          <span className="nav-avail">
            {profile.availability}
            <br />
            {profile.location}
            {time ? ` · ${time}` : ""}
          </span>
          <LetsTalk />
        </div>

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
            <li key={l.href} style={{ transitionDelay: menuOpen ? `${0.2 + i * 0.05}s` : "0s" }}>
              <a href={l.href} onClick={go(l.href)}>
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
        {/* ═════ hero ═════ */}
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
              <div
                className={`hero-card-in ${profile.photo ? "has-photo" : ""}`}
                style={profile.photo ? { backgroundImage: `url(${profile.photo})` } : undefined}
              >
                <span className="hc-label">Hello, I&apos;m</span>
                <span className="hc-name">{profile.firstName}</span>
              </div>
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
              <div className="hero-card-in">
                <span className="hc-label">{profile.role}</span>
                <span className="hc-name">{profile.lastName}</span>
              </div>
            </div>
          </div>

          <CurvedBanner id="curve-1" />
        </section>

        {/* ═════ about ═════ */}
        <section className="about" id="about">
          <p className="eyebrow eyebrow--center" data-reveal>
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
        </section>

        {/* ═════ slider showcase ═════ */}
        <section className="strip" aria-label="Project previews">
          <div className="strip-track">
            {[...projects, ...projects].map((p, i) => (
              <div className="strip-card" key={i}>
                <Art p={p} />
              </div>
            ))}
          </div>
        </section>

        {/* ═════ selected works ═════ */}
        <section className="works" id="work">
          <p className="eyebrow">Featured projects</p>
          <div className="works-stick">
          <h2 className="works-title big-title" data-split>
            <Letters text="Selected" />
            <Letters text="Works" />
          </h2>
          <div className="proj-grid">
            {projects.map((p) => {
              const inner = (
                <>
                  <div className="proj-media">
                    <Art p={p} />
                  </div>
                  <div className="proj-meta">
                    <span className="proj-icon" style={{ background: p.colors[0] }}>
                      {p.title[0]}
                    </span>
                    <div className="proj-text">
                      <h3>{p.title}</h3>
                      <span>
                        {p.category} · {p.year}
                      </span>
                    </div>
                    <span className="proj-go">
                      <Arrow />
                    </span>
                  </div>
                </>
              );
              return p.link ? (
                <a className="proj" key={p.title} href={p.link} target="_blank" rel="noreferrer">
                  {inner}
                </a>
              ) : (
                <div className="proj" key={p.title}>
                  {inner}
                </div>
              );
            })}
          </div>
          </div>

          <div className="more">
            <h3 className="more-title" data-split>
              <Letters text="More work" />
              <Letters text="on the way" />
            </h3>
            <div className="more-pills">
              <span className="more-pill">Always creating</span>
              <span className="more-pill">Stay tuned</span>
              <span className="more-pill">There&apos;s more</span>
            </div>
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="talk talk--line" data-magnetic>
              <span>See more on LinkedIn</span>
              <i>
                <Arrow />
              </i>
            </a>
          </div>
        </section>

        {/* ═════ journey ═════ */}
        <section className="journey" id="journey">
          <p className="eyebrow">Experience &amp; education</p>
          <h2 className="big-title big-title--left" data-split>
            <Letters text="Where" />
            <Letters text="I've been" />
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

        {/* ═════ services / skills ═════ */}
        <section className="services" id="skills">
          <p className="eyebrow">What I do</p>
          <h2 className="big-title big-title--left" data-split>
            <Letters text="This is" />
            <Letters text="my thing" />
          </h2>
          <div className="svc-track">
            <svg className="svc-svg" aria-hidden>
              <path className="svc-base" />
              <path className="svc-line" />
            </svg>
            <div className="svc-head" aria-hidden>
              <Monogram />
            </div>
            {services.map((s, i) => (
              <div
                className={`svc-item ${i % 2 ? "svc-item--l" : "svc-item--r"}`}
                key={s.title}
                data-x={svcPos[i].x}
                data-y={svcPos[i].y}
                style={{ left: `${svcPos[i].x}%`, top: `${svcPos[i].y}%` }}
              >
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═════ recommendations ═════ */}
        <section className="testimonials" id="kind-words">
          <p className="eyebrow">Recommendations</p>
          <h2 className="big-title" data-split>
            <Letters text="Apparently," />
            <Letters text="they like me" />
          </h2>
          <div className="t-panel">
            <div className="t-stage">
              {testimonials.map((t, i) => (
                <article className="t-card" key={i}>
                  <h3>{t.headline}</h3>
                  <div className="t-person">
                    <span className="t-avatar" style={t.avatar ? { backgroundImage: `url(${t.avatar})` } : undefined}>
                      {!t.avatar && initials(t.name)}
                    </span>
                    <span>
                      <strong>{t.name}</strong>
                      <small>{t.role}</small>
                    </span>
                  </div>
                  <p>{t.quote}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═════ faq ═════ */}
        <section className="faq" id="faq">
          <div className="faq-head">
            <p className="eyebrow">Frequently asked questions</p>
            <h2 className="big-title big-title--left" data-split>
              <Letters text="Things you" />
              <Letters text="might ask" />
            </h2>
            <svg className="faq-doodle" viewBox="0 0 220 160" fill="none" aria-hidden>
              <path pathLength={1} d="M30 40 C30 20 50 10 110 10 C170 10 195 20 195 50 C195 85 170 95 110 95 C95 95 80 95 70 94 L40 120 L48 90 C35 85 30 70 30 40 Z" />
              <path pathLength={1} d="M95 38 C95 26 125 24 126 40 C127 52 110 52 110 64" />
              <path pathLength={1} d="M110 78 L110 79" />
              <path pathLength={1} d="M150 120 C165 112 180 130 168 140 C156 150 140 140 150 120 Z" />
            </svg>
          </div>
          <div className="chat">
            {faqs.map((f, i) => (
              <div className={`chat-item ${openFaq === i ? "is-open" : ""}`} key={f.q} data-reveal>
                <button className="chat-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}>
                  {f.q}
                </button>
                <div className="chat-a">
                  <div className="chat-a-in">
                    <p>{f.a}</p>
                    <span className="chat-avatar">
                      <Monogram />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ═════ footer ═════ */}
      <footer className="foot" id="contact">
        <svg className="foot-loops" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <path pathLength={1} d="M-50 300 C 200 100, 420 420, 260 520 C 120 610, 80 380, 330 360 C 600 340, 520 760, 820 700 C 1060 650, 980 420, 1180 430 C 1380 440, 1300 760, 1500 820" />
        </svg>
        <div className="foot-grid">
          <div className="foot-main">
            <h2 className="foot-title">
              {footerLine.map((l) => (
                <Letters key={l} text={l} />
              ))}
            </h2>
            <LetsTalk className="talk--dark" />
            <div className="foot-mail">
              <small>Email me</small>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </div>
          </div>
          <div className="foot-cols">
            <div>
              <small>Main menu</small>
              <a href="#work" onClick={go("#work")}>
                Work
              </a>
              <a href="#about" onClick={go("#about")}>
                About me
              </a>
              <a href="#skills" onClick={go("#skills")}>
                Skills
              </a>
            </div>
            <div>
              <small>Socials</small>
              <a href={profile.linkedin} target="_blank" rel="noreferrer">
                LinkedIn ↗
              </a>
              {profile.instagram && (
                <a href={profile.instagram} target="_blank" rel="noreferrer">
                  Instagram ↗
                </a>
              )}
              {profile.behance && (
                <a href={profile.behance} target="_blank" rel="noreferrer">
                  Behance ↗
                </a>
              )}
            </div>
            <p>
              Made with curiosity.
              <br />
              Pixel by pixel.
            </p>
            <p>{profile.location}</p>
          </div>
        </div>
        <div className="foot-bottom">
          <span>
            © {new Date().getFullYear()} {profile.firstName} {profile.lastName}
          </span>
          <button onClick={() => scrollTo(0)}>Back to top ↑</button>
        </div>
        <Monogram className="foot-mono" />
      </footer>
    </div>
  );
}
