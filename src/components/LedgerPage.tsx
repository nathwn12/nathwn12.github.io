import { useEffect, type ReactNode } from "react";
import HorizonVideo from "./HorizonVideo";
import {
  aiPractice,
  contactBlock,
  figures,
  locatedIn,
  name,
  proofRows,
  standfirst,
  statusLine,
} from "../content/ledger";
import { employer, experience, provenance } from "../content/experience";
import { projects, projectsLede } from "../content/projects";
import { recordOpener } from "../content/hero";
import { CONTACT_EMAIL, CV_PATH, RESUME_PATH } from "../lib/contact";
import { useTheme } from "../lib/theme";

const SECTIONS = [
  { id: "reduction", index: "01", label: "The reduction" },
  { id: "method", index: "02", label: "The method" },
  { id: "work", index: "03", label: "The work" },
  { id: "record", index: "04", label: "The record" },
  { id: "contact", index: "05", label: "Contact" },
] as const;

function Section({
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
    <section id={id} className="ledger-section frame" aria-labelledby={`${id}-title`}>
      <div className="section-head" data-reveal>
        <span className="section-index">{index}</span>
        <h2 id={`${id}-title`}>{label}</h2>
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}

/** Native-scroll reveal. With reduced motion the elements are already shown. */
function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (document.documentElement.dataset.motion === "off") {
      nodes.forEach((node) => node.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.04 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

export default function LedgerPage() {
  const [theme, toggleTheme] = useTheme();
  useReveal();

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

      <header className="masthead">
        <a className="masthead-mark data" href="#horizon">
          NNL <span>/ the record</span>
        </a>
        <nav className="masthead-nav data" aria-label="Chapters">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              <span aria-hidden="true">{section.index}</span>{" "}
              {section.label.replace(/^The /, "")}
            </a>
          ))}
        </nav>
        <button
          type="button"
          className="theme-toggle data"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "paper" : "void"} mode`}
        >
          {theme === "dark" ? "Paper" : "Void"}
        </button>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        <section id="horizon" className="hero" aria-labelledby="hero-name">
          {theme === "dark" ? (
            <HorizonVideo />
          ) : (
            <div className="horizon-field horizon-plate" aria-hidden="true">
              <img src="/horizon-still.png" alt="" />
            </div>
          )}

          <div className="hero-hud">
            <div className="hud hud-name">
              <p className="eyebrow data">Event horizon / portfolio / 2026</p>
              <h1 id="hero-name">Nathaniel Nikolai Ladero</h1>
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
            <a className="hud hud-scroll data" href="#reduction">
              <span className="scroll-line" aria-hidden="true" />
              <span>Scroll to the record</span>
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <Section id="reduction" index="01" label="The reduction">
          <p className="statement" data-reveal>
            {recordOpener}
          </p>
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
                </div>
                <span className="proof-note data">
                  {String(i + 1).padStart(2, "0")} / measured
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="method" index="02" label="The method">
          <div className="method-grid">
            <div className="method-prose">
              <p className="lead" data-reveal>
                {standfirst}
              </p>
              {aiPractice.sentences.map((sentence) => (
                <p key={sentence} data-reveal>
                  {sentence}
                </p>
              ))}
            </div>
            <aside className="method-facts" aria-label="Practice and position">
              <p className="eyebrow data" data-reveal>
                The practice, in three terms
              </p>
              <ul className="fact-rule" data-reveal>
                {aiPractice.facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
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
            </aside>
          </div>
        </Section>

        <Section id="work" index="03" label="The work">
          <p className="section-lede" data-reveal>
            {projectsLede}
          </p>
          <ol className="row-list work-list">
            {projects.map((project, i) => (
              <li className="work-row" data-reveal key={project.id}>
                <a href={project.url} target="_blank" rel="noreferrer">
                  <span className="row-index data">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="row-name">{project.name}</span>
                  <span className="row-desc">{project.description}</span>
                  <span className="row-meta data">
                    {project.kind} · {project.year}
                  </span>
                  <span className="row-arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="record" index="04" label="The record">
          <div className="record-figures" data-reveal>
            <div>
              <span className="record-figure">{figures.commits}</span>
              <span className="figure-label data">commits recovered</span>
            </div>
            <div>
              <span className="record-figure">{figures.repositories}</span>
              <span className="figure-label data">repositories carrying the work</span>
            </div>
            <div>
              <span className="record-figure">{figures.scanned}</span>
              <span className="figure-label data">repositories scanned</span>
            </div>
          </div>
          <p className="section-lede" data-reveal>
            {provenance}
          </p>
          <ol className="row-list experience-list">
            {experience.map((entry) => (
              <li className="experience-row" data-reveal key={entry.id}>
                <span className="row-index data">
                  {entry.id} / {entry.date}
                </span>
                <div className="row-name">
                  {entry.name}
                  <span className="data">{entry.status}</span>
                </div>
                <p className="row-desc">{entry.outcome}</p>
                <span className="experience-metric">{entry.metric ?? "—"}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="contact" index="05" label="Contact">
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
        </Section>
      </main>

      <footer className="colophon frame">
        <span className="data">NNL / event horizon / 2026</span>
        <p className="colophon-links data">
          <a href="https://github.com/nathwn12" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/nathaniel-nikolai-l-184181261/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          <a href={RESUME_PATH}>Résumé</a>
          <a href={CV_PATH}>CV</a>
          <a href="https://github.com/nathwn12/nathwn12.github.io" target="_blank" rel="noreferrer">
            Source
          </a>
        </p>
        <span className="data">
          Shader: glsl-black-hole · MIT · sayed1145
        </span>
      </footer>
    </>
  );
}
