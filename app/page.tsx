import { Fragment } from "react";
import Icon from "./components/Icon";
import { AuroraCanvas, CopyEmail, LayerExplorer, MotionReveals, NavDock, ProjectFilters } from "./components/Interactive";
import { about, flagship, highlights, profile, projects, subProjects } from "./data";

/** Renders "**bold**" segments from data strings. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

function Divider({ code, index }: { code: string; index: string }) {
  return (
    <div className="section-divider-bar" aria-hidden="true">
      <span className="divider-coord">{code}</span>
      <span className="divider-line" />
      <span className="divider-index">{index}</span>
    </div>
  );
}

function SectionHeader({ tag, title, desc }: { tag: string; title: string; desc?: string }) {
  return (
    <div className="section-header reveal-item">
      <div className="section-tag">{tag}</div>
      <h2 className="section-title">{title}</h2>
      {desc && <p className="section-desc">{desc}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <AuroraCanvas />
      <MotionReveals />
      <NavDock />

      <main>
        {/* ── HERO ───────────────────────────────────────────── */}
        <section id="hero" className="hero-section">
          <div className="hero-bg-grid" aria-hidden="true">
            <div className="grid-line line-1" />
            <div className="grid-line line-2" />
            <div className="grid-line line-3" />
          </div>

          <div className="hero-wordmark-svg" aria-hidden="true">
            <svg viewBox="0 0 1000 215" preserveAspectRatio="xMidYMid meet">
              <text x="0" y="205" fontSize="270" textLength="1000" lengthAdjust="spacingAndGlyphs">
                PORTFOLIO
              </text>
            </svg>
          </div>

          <div className="hero-stage-grid">
            <div className="hero-flank left-flank hero-build">
              <div className="hero-script">Hello, I&apos;m</div>
              <h1 className="hero-name">
                {profile.name.toUpperCase()}
                <span className="accent-red-dot">.</span>
              </h1>
              <div className="hero-role-pill">
                <span className="pill-dot">●</span>
                <span>{profile.role.toUpperCase()}</span>
              </div>
              <p className="hero-desc">
                <Rich text={profile.tagline} />
              </p>
              <div className="hero-actions">
                <a href="#contact" className="btn btn-crimson">
                  <span>GET IN TOUCH</span>
                  <span className="btn-arrow">
                    <Icon name="arrow" size={16} />
                  </span>
                </a>
                <a href="#flagships" className="btn btn-glass">
                  <span>EXPLORE MY WORK</span>
                </a>
              </div>
              <div className="hero-stats-row">
                {profile.stats.map((s) => (
                  <div key={s.label} className="hero-stat-box">
                    <span className="stat-val">{s.value}</span>
                    <span className="stat-lbl">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-center-col hero-build">
              <div className="hero-cutout-wrap">
                <div className="hero-portrait-panel" aria-hidden="true" />
                {profile.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.photo} alt={profile.fullName} className="hero-cutout-img" width={480} height={480} />
                ) : (
                  <div className="hero-cutout-placeholder" role="img" aria-label={profile.fullName}>
                    <span>{profile.initials}</span>
                  </div>
                )}
                <div className="cutout-status-badge">
                  <span className="status-pulse-red">●</span>
                  <span>{profile.statusBadge}</span>
                </div>
              </div>
            </div>

            <div className="hero-flank right-flank hero-build">
              <div className="hud-stack">
                {highlights.map((h) => (
                  <div key={h.title} className="hud-card">
                    <div className="hud-card-header">
                      <span className="hud-idx">{h.idx}</span>
                      <span className="hud-tag">{h.tag}</span>
                    </div>
                    <div className="hud-card-title">{h.title}</div>
                    <div className="hud-card-desc">{h.desc}</div>
                  </div>
                ))}
                <div className="hud-tech-tags">
                  {profile.techTags.map((t) => (
                    <span key={t} className="tech-tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Divider code="// 01.00 SEC_ABOUT" index="INDEX [01 / 04]" />

        {/* ── ABOUT ──────────────────────────────────────────── */}
        <section id="about" className="section">
          <div className="section-container">
            <SectionHeader tag="PROFILE" title="Background & Philosophy" />
            <div className="glass-card about-grid reveal-item">
              <div className="about-text-col">
                {about.paragraphs.map((p, i) => (
                  <p key={i} className="about-text">
                    <Rich text={p} />
                  </p>
                ))}
                <div className="quote-box">&ldquo;{about.quote}&rdquo;</div>
              </div>
              <div className="about-principles-col">
                <ul className="principles-list">
                  {about.principles.map((p) => (
                    <li key={p.num} className="principle-item">
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
          </div>
        </section>

        <Divider code="// 02.00 SEC_WORK" index="INDEX [02 / 04]" />

        {/* ── FLAGSHIPS ──────────────────────────────────────── */}
        <section id="flagships" className="section">
          <div className="section-container">
            <SectionHeader tag="SHOWCASE" title="Featured Work" desc="Selected projects I've designed, built and shipped." />
            <div className="flagship-container">
              <article className="glass-card flagship-card highlighted-card reveal-item">
                <div className="card-glow-red" />
                <div className="flagship-header">
                  <div className="flagship-badge">
                    <span>●</span> {flagship.badge}
                  </div>
                  <div className="flagship-meta">{flagship.meta}</div>
                </div>
                <div className="flagship-body">
                  <div className="flagship-main-info">
                    <h3 className="flagship-title">{flagship.title}</h3>
                    <p className="flagship-desc">{flagship.desc}</p>
                    <div className="flagship-metrics-row">
                      {flagship.metrics.map((m) => (
                        <div key={m.desc} className="metric-pill">
                          <div className="metric-num">{m.num}</div>
                          <div className="metric-desc">{m.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <LayerExplorer />
                </div>
              </article>

              <div className="flagship-subgrid">
                {subProjects.map((p) => (
                  <article key={p.title} className="glass-card subgrid-card reveal-item">
                    <div className="subgrid-top">
                      <div className="subgrid-badge-row">
                        <div className="flagship-badge">{p.badge}</div>
                      </div>
                      <h3 className="subgrid-title">{p.title}</h3>
                      <p className="subgrid-desc">{p.desc}</p>
                      <ul className="spec-list">
                        {p.specs.map((s) => (
                          <li key={s} className="spec-item">
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="subgrid-footer">
                      {p.tags.map((t) => (
                        <span key={t} className="tech-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Divider code="// 03.00 SEC_PROJECTS" index="INDEX [03 / 04]" />

        {/* ── PROJECT MATRIX ─────────────────────────────────── */}
        <section id="projects" className="section">
          <div className="section-container">
            <div className="section-header reveal-item">
              <div className="section-tag">PROJECT INDEX</div>
              <h2 className="section-title">The Project Matrix</h2>
              <p className="section-desc">More things I&apos;ve built — web apps, design work and developer tools.</p>
              <ProjectFilters />
            </div>
            <div className="bento-grid">
              {projects.map((p, i) => (
                <div key={p.title} className="glass-card bento-card reveal-item" data-category={p.category}>
                  <div className="bento-top">
                    <span className="category-chip">{p.chip}</span>
                    {p.href ? (
                      <a href={p.href} target="_blank" rel="noopener noreferrer" className="bento-link" aria-label={`${p.title} link`}>
                        <Icon name="external" size={16} />
                      </a>
                    ) : (
                      <span className="bento-id">#PRJ-{String(i + 1).padStart(2, "0")}</span>
                    )}
                  </div>
                  <h3 className="bento-title">{p.title}</h3>
                  <p className="bento-desc">{p.desc}</p>
                  <div className="bento-footer">
                    <div className="bento-tags">
                      {p.tags.map((t) => (
                        <span key={t} className="tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Divider code="// 04.00 SEC_CONTACT" index="INDEX [04 / 04]" />

        {/* ── CONTACT ────────────────────────────────────────── */}
        <section id="contact" className="section">
          <div className="glass-card contact-card reveal-item">
            <div className="contact-glow-red" />
            <div className="contact-content">
              <div className="section-tag">DIRECT CONNECT</div>
              <h2 className="contact-title">Let&apos;s Build Something Extraordinary.</h2>
              <p className="contact-subtitle">
                Available for freelance projects, full-time roles and collaborations. The fastest way to reach me is email.
              </p>
              <CopyEmail />
              <div className="social-links-row">
                {profile.socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="social-pill" aria-label={s.label}>
                    <Icon name={s.icon} size={18} />
                    <span>{s.handle}</span>
                  </a>
                ))}
              </div>
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
