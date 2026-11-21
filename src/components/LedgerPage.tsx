import { useEffect, useState, type ReactNode } from "react";
import HorizonVideo from "./HorizonVideo";
import { CountUp, Heatmap, Sparkline, Ticker } from "./Instruments";
import { employer, experience, provenance } from "../content/experience";
import {
  aiPractice,
  contactBlock,
  figures,
  locatedIn,
  name,
  proofRows,
  statusLine,
} from "../content/ledger";
import { signal, specLines } from "../content/signal";
import {
  featuredRows,
  indexRows,
  lifetimeNote,
  workIndexLede,
  workIntro,
} from "../content/showcase";
import { CONTACT_EMAIL, CV_PATH, RESUME_PATH } from "../lib/contact";

const SECTIONS = [
  { id: "signal", index: "01", label: "The signal" },
  { id: "work", index: "02", label: "The work" },
  { id: "proof", index: "03", label: "The proof" },
  { id: "method", index: "04", label: "The method" },
  { id: "contact", index: "05", label: "Contact" },
] as const;

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
    <section id={id} className="cluster frame" aria-labelledby={`${id}-title`}>
      <div className="cluster-corner">
        <span className="section-index">{index}</span>
        <h2 id={`${id}-title`}>{label}</h2>
      </div>
      <div className="cluster-body">{children}</div>
    </section>
  );
}

export default function LedgerPage() {
  const [active, setActive] = useState<string>("signal");

  useEffect(() => {
    document.title = `${name} — event horizon`;
  }, []);

  useEffect(() => {
    const sections = SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter((node): node is HTMLElement => node !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const mailSubject = encodeURIComponent("Role, system, or problem");
  const mailBody = encodeURIComponent(contactBlock.line);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="stage-nav-wrap">
        <a className="stage-mark" href="#horizon" aria-label="Back to the top">
          <img src="/brand/signature-glyph.svg" alt="" width="120" height="120" />
        </a>
        <nav className="stage-nav data" aria-label="Chapters">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active === section.id ? "true" : undefined}
            >
              <span aria-hidden="true">{section.index}</span>{" "}
              {section.label.replace(/^The /, "")}
            </a>
          ))}
        </nav>
      </header>

      <Ticker items={signal.ticker} />

      <main id="main" tabIndex={-1}>
        <section id="horizon" className="hero" aria-labelledby="hero-name">
          <HorizonVideo />
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
          <div className="signal-pair">
            <div>
              <CountUp value={signal.allTime} className="signal-figure" />
              <span className="figure-label data">npm downloads / all time</span>
            </div>
            <div>
              <CountUp value={signal.month} className="signal-figure" />
              <span className="figure-label data">npm downloads / last 30 days</span>
            </div>
          </div>

          <div className="spark-bank">
            {signal.packages.map((item) => (
              <div className="spark-cell" key={item.name}>
                <span className="spark-name data">{item.name}</span>
                <Sparkline values={item.daily} />
                <span className="spark-value data">{item.month.toLocaleString("en-US")}</span>
              </div>
            ))}
          </div>

          <div className="signal-lower">
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
          <p className="stamp data">
            {signal.stamp}
          </p>
        </Cluster>

        <Cluster id="work" index="02" label="The work">
          <p className="work-intro">{workIntro}</p>
          <div className="featured-list">
            {featuredRows.map((row) => (
              <div className="featured-row" key={row.dir}>
                <span className="featured-num">{row.num}</span>
                <div className="featured-main">
                  <h3>{row.name}</h3>
                  <p className="claim">{row.claim}</p>
                  <p className="row-detail">{row.detail}</p>
                  <span className="tech data">{row.tech.join(" / ")}</span>
                </div>
                <div className="featured-stats data">
                  {row.lifetime !== null && (
                    <span className="lifetime-figure">
                      {row.lifetime.toLocaleString("en-US")}
                      <span className="lifetime-note">{lifetimeNote}</span>
                    </span>
                  )}
                  <span>{row.language}</span>
                </div>
                <a href={row.url} target="_blank" rel="noreferrer" aria-label={`Open ${row.name} on GitHub`}>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            ))}
          </div>
          <p className="index-head data">
            {workIndexLede}
          </p>
          <div className="index-grid">
            {indexRows.map((row) => (
              <div className="index-row" key={row.dir}>
                <span className="index-num data">{row.num}</span>
                <a href={row.url} target="_blank" rel="noreferrer">
                  {row.name}
                </a>
                <div className="index-copy">
                  <span className="index-claim">{row.claim}</span>
                  <span className="row-detail">{row.detail}</span>
                </div>
                <span className="index-stats data">
                  {row.lifetime !== null
                    ? `${row.lifetime.toLocaleString("en-US")} lifetime · ${lifetimeNote}`
                    : "no package"}{" · "}
                  {row.language}
                </span>
              </div>
            ))}
          </div>
        </Cluster>

        <Cluster id="proof" index="03" label="The proof">
          <div className="proof-table">
            {proofRows.map((row, i) => (
              <div className="proof-row" key={row.claim}>
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

          <p className="provenance data">{provenance}</p>

          <div className="experience-register">
            {experience.map((entry) => (
              <div
                className={`experience-row${entry.metric ? "" : " experience-row-plain"}`}
                key={entry.id}
              >
                {entry.metric && (
                  <span className="experience-figure">{entry.metric}</span>
                )}
                <div className="experience-copy">
                  <h3>{entry.name}</h3>
                  <p>{entry.outcome}</p>
                  <p className="row-detail">{entry.texture}</p>
                  <span className="data">{entry.date} · {entry.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Cluster>

        <Cluster id="method" index="04" label="The method">
          <div className="method-prose">
            {aiPractice.sentences.map((sentence) => (
              <p key={sentence}>{sentence}</p>
            ))}
          </div>
          <ul className="practice-list">
            {aiPractice.facts.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
          <div className="spec-grid">
            {specLines.map((line) => (
              <div className="spec-line" key={line.key}>
                <span className="spec-key data">{line.key}</span>
                <span className="spec-value">{line.value}</span>
              </div>
            ))}
          </div>
          <dl className="data-line">
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
          <p className="contact-line">
            {contactBlock.line}
          </p>
          <a
            className="mailto"
            href={`mailto:${CONTACT_EMAIL}?subject=${mailSubject}&body=${mailBody}`}
          >
            {CONTACT_EMAIL}
          </a>
          <p className="section-lede">
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
      </footer>
    </>
  );
}
