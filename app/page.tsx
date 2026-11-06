import Icon from "./components/Icon";
import {
  Carousel,
  CopyEmail,
  GalleryGrid,
  Header,
  LayerExplorer,
  Preloader,
  ProjectMatrix,
  ScrollReveal,
  Subscribe,
} from "./components/Interactive";
import { about, features, flagship, highlights, profile, subProjects } from "./data";

function Divider({ code, index }: { code: string; index: string }) {
  return (
    <div className="container divider" aria-hidden="true">
      <span>{code}</span>
      <span className="divider-line" />
      <span>{index}</span>
    </div>
  );
}

function SectionHead({ tag, title, desc, dir = "top" }: { tag: string; title: React.ReactNode; desc?: string; dir?: string }) {
  return (
    <div className="section-head">
      <div className="section-tag" data-reveal={dir} data-delay="0.15">
        {tag}
      </div>
      <h2 className="section-title" data-reveal={dir} data-delay="0.25">
        {title}
      </h2>
      {desc && (
        <p className="lead" data-reveal="left" data-delay="0.35">
          {desc}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Preloader />
      <ScrollReveal />
      <div className="backgroundcover" aria-hidden="true" />
      <Header />

      <main>
        {/* ── HERO ─────────────────────────────────────────── */}
        <section id="hero" className="hero">
          <div className="hero-wordmark" aria-hidden="true">
            PORTFOLIO
          </div>
          <div className="container hero-grid">
            <div className="hero-left">
              <div className="hero-script" data-reveal="top" data-delay="0.25">
                Hello, I&apos;m
              </div>
              <h1 className="hero-name" data-reveal="top" data-delay="0.25">
                {profile.name.toUpperCase()}
                <span className="accent">.</span>
              </h1>
              <div className="role-pill" data-reveal="left" data-delay="0.35">
                <span className="pill-dot">●</span> {profile.role.toUpperCase()}
              </div>
              <div className="blackdiv" data-reveal="left" data-delay="0.35">
                <p>{profile.tagline}</p>
              </div>
              <div className="hero-actions">
                <a href="#contact" className="btn btn-primary btn-lg btn-rocket" data-reveal="top" data-delay="0.25">
                  <span>Get In Touch</span>
                  <Icon name="arrow" size={16} />
                </a>
                <a href="#flagships" className="btn btn-danger btn-lg" data-reveal="left" data-delay="0.25">
                  See My Work
                </a>
              </div>
              <div className="stats">
                {profile.stats.map((s, i) => (
                  <div key={s.label} className="stat" data-reveal="bottom" data-delay={(0.3 + i * 0.1).toFixed(2)}>
                    <span className="stat-val">{s.value}</span>
                    <span className="stat-lbl">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-center" data-reveal="bottom" data-delay="0.35">
              <div className="avatar">
                <div className="avatar-ring" />
                {/* Replace with <img src="/me.png" /> for a real photo */}
                <span className="avatar-initials">{profile.initials}</span>
                <div className="avatar-badge">
                  <span className="pulse">●</span> OPEN TO WORK
                </div>
              </div>
            </div>

            <div className="hero-right">
              {highlights.map((h, i) => (
                <div key={h.title} className="card hud-card" data-reveal="right" data-delay={(0.25 + i * 0.1).toFixed(2)}>
                  <div className="hud-head">
                    <span className="hud-idx">{h.idx}</span>
                    <span className="hud-tag">{h.tag}</span>
                  </div>
                  <div className="hud-title">{h.title}</div>
                  <div className="hud-desc">{h.desc}</div>
                </div>
              ))}
              <div className="tags" data-reveal="right" data-delay="0.55">
                {profile.techTags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Divider code="// 01.00 SEC_ABOUT" index="INDEX [01 / 06]" />

        {/* ── ABOUT ────────────────────────────────────────── */}
        <section id="about" className="section">
          <div className="container">
            <SectionHead tag="PROFILE" title={<><strong>Background</strong> &amp; Philosophy</>} />
            <div className="card about-grid">
              <div>
                {about.paragraphs.map((p, i) => (
                  <p key={i} className="about-text" data-reveal="left" data-delay="0.25">
                    {p}
                  </p>
                ))}
                <blockquote className="quote" data-reveal="left" data-delay="0.35">
                  &ldquo;{about.quote}&rdquo;
                </blockquote>
              </div>
              <ul className="principles">
                {about.principles.map((p, i) => (
                  <li key={p.num} className="principle" data-reveal="right" data-delay={(0.25 + i * 0.1).toFixed(2)}>
                    <span className="principle-num">{p.num}</span>
                    <div>
                      <div className="principle-title">{p.title}</div>
                      <div className="principle-desc">{p.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── FEATURES (SAVO block icons) ─────────────────── */}
        <section id="features" className="section section-light">
          <div className="container">
            <SectionHead
              tag="WHAT I DO"
              title={<><strong>{profile.name}</strong> builds stylish, very simple products</>}
              desc="A mix of engineering and design — everything I ship is fast, responsive and pleasant to use."
            />
            <div className="features-grid">
              {features.map((f) => (
                <div key={f.title} className="block-icon">
                  <span className="block-icon-circle" data-reveal="left" data-delay="0.25">
                    <Icon name={f.icon} size={34} />
                  </span>
                  <h3 data-reveal="left" data-delay="0.25">
                    {f.title}
                  </h3>
                  <p data-reveal="left" data-delay="0.25">
                    {f.desc}
                  </p>
                  <a href="#projects" className="btn btn-primary btn-md btn-rocket" data-reveal="left" data-delay="0.25">
                    Learn More
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Divider code="// 02.00 SEC_WORK" index="INDEX [02 / 06]" />

        {/* ── FLAGSHIPS ────────────────────────────────────── */}
        <section id="flagships" className="section">
          <div className="container">
            <SectionHead
              dir="right"
              tag="SHOWCASE"
              title={<><strong>Featured</strong> Work</>}
              desc="Selected projects I've designed, built and shipped."
            />
            <article className="card flagship" data-reveal="right" data-delay="0.25">
              <div className="glow" />
              <div className="flagship-head">
                <span className="badge">● {flagship.badge}</span>
                <span className="flagship-meta">{flagship.meta}</span>
              </div>
              <div className="flagship-body">
                <div>
                  <h3 className="flagship-title">{flagship.title}</h3>
                  <p className="flagship-desc">{flagship.desc}</p>
                  <div className="metrics">
                    {flagship.metrics.map((m) => (
                      <div key={m.desc} className="metric">
                        <div className="metric-num">{m.num}</div>
                        <div className="metric-desc">{m.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <LayerExplorer />
              </div>
            </article>

            <div className="subgrid">
              {subProjects.map((p, i) => (
                <article key={p.title} className="card sub-card" data-reveal="bottom" data-delay={(0.25 + i * 0.1).toFixed(2)}>
                  <span className="badge">{p.badge}</span>
                  <h3 className="sub-title">{p.title}</h3>
                  <p className="sub-desc">{p.desc}</p>
                  <ul className="specs">
                    {p.specs.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  <div className="tags">
                    {p.tags.map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Divider code="// 03.00 SEC_PROJECTS" index="INDEX [03 / 06]" />

        {/* ── PROJECT MATRIX ───────────────────────────────── */}
        <section id="projects" className="section">
          <div className="container">
            <SectionHead tag="INDEX" title={<><strong>Project</strong> Matrix</>} desc="Filter by category to explore more of my work." />
            <ProjectMatrix />
          </div>
        </section>

        {/* ── GALLERY + SLIDER ─────────────────────────────── */}
        <section id="gallery" className="section section-light">
          <div className="container">
            <SectionHead
              dir="left"
              tag="VISUALS"
              title={<><strong>Very Stylish</strong> Gallery</>}
              desc="Screens, mockups and design explorations."
            />
            <GalleryGrid />
          </div>
        </section>

        <section id="slider" className="section slider">
          <div className="container">
            <Carousel />
          </div>
        </section>

        {/* ── CONTACT / FOOTER ─────────────────────────────── */}
        <section id="contact" className="section footer">
          <div className="container">
            <div className="card contact-card">
              <div className="glow" />
              <div className="section-tag" data-reveal="top" data-delay="0.25">
                DIRECT CONNECT
              </div>
              <h2 className="contact-title" data-reveal="left" data-delay="0.45">
                Let&apos;s build something extraordinary.
              </h2>
              <p className="lead" data-reveal="right" data-delay="0.45">
                Available for freelance projects, full-time roles and collaborations. Drop your email and I&apos;ll get back to you.
              </p>
              <div data-reveal="bottom" data-delay="0.45">
                <Subscribe />
              </div>
              <div data-reveal="bottom" data-delay="0.5">
                <CopyEmail />
              </div>
              <ul className="socials">
                {profile.socials.map((s, i) => (
                  <li key={s.label} data-reveal={["left", "right", "bottom", "top"][i % 4]} data-delay="0.45">
                    <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                      <Icon name={s.icon} size={20} />
                    </a>
                  </li>
                ))}
              </ul>
              <div className="footer-meta">
                <span>
                  © {new Date().getFullYear()} {profile.fullName}. All rights reserved.
                </span>
                <span>Designed &amp; built with Next.js.</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
