import { useEffect, type ReactNode } from "react";
import { CountUp, Heatmap, Sparkline, Ticker, useInstrumentMotion } from "./Instruments";
import { employer } from "../content/experience";
import {
  contactBlock,
  figures,
  locatedIn,
  name,
  proofRows,
  statusLine,
} from "../content/ledger";
import { signal, specLines } from "../content/signal";
import { featuredRows, indexRows } from "../content/showcase";
import { projectsLede } from "../content/projects";
import { CONTACT_EMAIL, CV_PATH, RESUME_PATH } from "../lib/contact";

const SECTIONS = [
  { id: "signal", index: "01", label: "The signal" },
  { id: "work", index: "02", label: "The work" },
  { id: "proof", index: "03", label: "The proof" },
  { id: "method", index: "04", label: "The method" },
  { id: "contact", index: "05", label: "Contact" },
] as const;

/** Fixed stage indicator. An observer lights the current cluster, even with motion off. */
function useStageNav() {
  useEffect(() => {
    const links = document.querySelectorAll<HTMLAnchorElement>(".stage-nav a");
    const sections = document.querySelectorAll<HTMLElement>("section[data-stage]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          links.forEach((link) => {
            link.dataset.active = String(link.hash === `#${entry.target.id}`);
          });
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
}

function Cluster({
  id,
  index,
  label,
  children,
}: {
  id: string;
  index: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section id={id} data-stage={id} className="cluster frame" aria-labelledby={`${id}-title`}>
      <div className="cluster-corner" data-reveal>
        <span className="section-index">{index}</span>
        <h2 id={`${id}-title`}>{label}</h2>
      </div>
      <div className="cluster-body">{children}</div>
    </section>
  );
}

export default function LedgerPage() {
  useInstrumentMotion();
  useStageNav();

  useEffect(() => {
    document.title = `${name} — event horizon`;
  }, []);

  const mailSubject = encodeURIComponent("Role, system, or problem");
  const mailBody = encodeURIComponent(contactBlock.line);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="stage-nav-wrap">
        <a className="stage-mark data" href="#horizon">
          NNL <span>/ the record</span>
        </a>
        <nav className="stage-nav data" aria-label="Chapters">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              <span aria-hidden="true">{section.index}</span>{" "}
              {section.label.replace(/^The /, "")}
            </a>
          ))}
        </nav>
      </header>

      <Ticker items={signal.ticker} />

      <main id="main" tabIndex={-1} className="outline-none">
        <section id="horizon" className="hero" aria-labelledby="hero-name">
          <div className="hero-hud">
            <div className="hud hud-name">
              <p className="eyebrow data">Event horizon / portfolio / 2026</p>
              <h1 id="hero-name">{name}</h1>
            </div>
            <div className="hud hud-role">
              <p className="eyebrow data">Role</p>
              <p>Backend systems, then the tools around them.</p>
              <p className="data">{locatedIn} · Remote</p>
            </div>
            <div className="hud hud-status">
              <p className="eyebrow data">Status</p>
              <p>{statusLine}</p>
              <p className="data">{employer.period}</p>
            </div>
            <a className="hud hud-scroll data" href="#signal">
              <span className="scroll-line" aria-hidden="true" />
              <span>Descend to the record</span>
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <Cluster id="signal" index="01" label="The signal">
          <div className="signal-pair" data-reveal>
            <div>
              <CountUp value={signal.allTime} className="signal-figure" />
              <span className="figure-label data">npm downloads / all time</span>
            </div>
            <div>
              <CountUp value={signal.month} className="signal-figure" />
              <span className="figure-label data">npm downloads / last 30 days</span>
            </div>
          </div>

          <div className="spark-bank" data-reveal>
            {signal.packages.map((item) => (
              <div className="spark-cell" key={item.name}>
                <span className="spark-name data">{item.name}</span>
                <Sparkline values={item.daily} />
                <span className="spark-value data">{item.month.toLocaleString("en-US")}</span>
              </div>
            ))}
          </div>

          <div className="signal-lower" data-reveal>
            <div className="activity-block">
              <span className="micro-label data">github activity / 30 days</span>
              <Heatmap />
              <span className="heat-note data">{signal.activityText}</span>
            </div>
            <div className="micro-figures">
              <div>
                <CountUp value={signal.github.commits} className="micro-number" />
                <span className="micro-label data">commits / 12 mo</span>
              </div>
              <div>
                <CountUp value={signal.repos} className="micro-number" />
                <span className="micro-label data">public repos</span>
              </div>
              <div>
                <CountUp value={signal.github.contributions} className="micro-number" />
                <span className="micro-label data">contributions / 12 mo</span>
              </div>
              <div>
                <CountUp value={signal.github.pullRequests} className="micro-number" />
                <span className="micro-label data">pull requests / 12 mo</span>
              </div>
              <div>
                <CountUp value={signal.packageCount} className="micro-number" />
                <span className="micro-label data">npm packages</span>
              </div>
            </div>
          </div>
          <p className="stamp data" data-reveal>
            {signal.stamp}
          </p>
        </Cluster>

        <Cluster id="work" index="02" label="The work">
          <div className="featured-list">
            {featuredRows.map((row) => (
              <div className="featured-row" data-reveal key={row.dir}>
                <span className="featured-num">{row.num}</span>
                <div className="featured-main">
                  <h3>{row.name}</h3>
                  <p className="claim">{row.claim}</p>
                  <span className="tech data">{row.tech.join(" / ")}</span>
                </div>
                <div className="featured-stats data">
                  <span>{row.monthLabel}</span>
                  <span>{row.language}</span>
                  <span>pushed {row.pushed}</span>
                </div>
                {row.daily && <Sparkline values={row.daily} tone="measure" />}
                <a href={row.url} target="_blank" rel="noreferrer" aria-label={`Open ${row.name} on GitHub`}>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            ))}
          </div>
          <p className="index-head data" data-reveal>
            {projectsLede}
          </p>
          <div className="index-grid">
            {indexRows.map((row) => (
              <div className="index-row" data-reveal key={row.dir}>
                <span className="index-num data">{row.num}</span>
                <a href={row.url} target="_blank" rel="noreferrer">
                  {row.name}
                </a>
                <span className="index-claim">{row.claim}</span>
                <span className="index-stats data">
                  {row.language} · {row.monthLabel} · pushed {row.pushed}
                </span>
              </div>
            ))}
          </div>
        </Cluster>

        <Cluster id="proof" index="03" label="The proof">
          <div className="proof-table">
            {proofRows.map((row, i) => (
              <div className="proof-row" data-reveal key={row.claim}>
                <span
                  className="proof-figure"
                  data-figure-hang={row.figure.endsWith("%") ? "percent" : undefined}
                >
                  {row.figure}
                </span>
                <div className="proof-text">
                  <h3>{row.claim}</h3>
                  <p>{row.detail}</p>
                  <span className="proof-note data">
                    {String(i + 1).padStart(2, "0")} / measured
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Cluster>

        <Cluster id="method" index="04" label="The method">
          <div className="spec-grid">
            {specLines.map((line) => (
              <div className="spec-line" data-reveal key={line.key}>
                <span className="spec-key data">{line.key}</span>
                <span className="spec-value">{line.value}</span>
              </div>
            ))}
          </div>
          <dl className="data-line" data-reveal>
            <div>
              <dt className="data">tenure</dt>
              <dd className="data">{figures.tenure}</dd>
            </div>
            <div>
              <dt className="data">period</dt>
              <dd className="data">{employer.period}</dd>
            </div>
            <div>
              <dt className="data">base</dt>
              <dd className="data">{locatedIn}</dd>
            </div>
          </dl>
        </Cluster>

        <Cluster id="contact" index="05" label="Contact">
          <p className="contact-line" data-reveal>
            {contactBlock.line}
          </p>
          <a
            className="mailto"
            data-reveal
            href={`mailto:${CONTACT_EMAIL}?subject=${mailSubject}&body=${mailBody}`}
          >
            {CONTACT_EMAIL}
          </a>
          <p className="section-lede" data-reveal>
            {contactBlock.nextStep}
          </p>
        </Cluster>
      </main>

      <footer className="colophon frame">
        <span className="data">NNL / event horizon / 2026</span>
        <p className="colophon-links data">
          <a href="https://github.com/nathwn12" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/nathaniel-nikolai-l-184181261/" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href={RESUME_PATH}>Résumé</a>
          <a href={CV_PATH}>CV</a>
          <a href="https://github.com/nathwn12/nathwn12.github.io" target="_blank" rel="noreferrer">Source</a>
        </p>
        <span className="data">Shader: glsl-black-hole · MIT · sayed1145</span>
      </footer>
    </>
  );
}
