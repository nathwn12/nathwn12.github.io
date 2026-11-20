import { useEffect, useRef, useState, type MouseEvent } from "react";
import { CHAPTERS, IDS, type ChapterId } from "../../lib/chapters";
import { recordOpener } from "../../content/hero";
import {
  aiPractice,
  contactBlock,
  figures,
  locatedIn,
  measurement,
  name,
  proofRows,
  queryFigure,
  standfirst,
  statusLine,
  workLede,
  workRows,
} from "../../content/ledger";
import {
  employer,
  experience,
  experienceLede,
  formerRoleLine,
  provenance,
  tenureSpan,
} from "../../content/experience";
import { projects, projectsLede } from "../../content/projects";
import { credentials } from "../../content/credentials";
import { CONTACT_EMAIL } from "../../lib/contact";
import { motionAllowed } from "../../lib/motion";
import { scrollTo as scrollToTarget } from "../../lib/smooth";

/** Retired detail paths land on the chapter that absorbed their content. */
const ANCHOR_BY_PATH: Readonly<Record<string, string>> = {
  "/experience": "experience",
  "/projects": "work",
};

/**
 * The chapter a deep link opens on. A hash wins over the path; a retired detail
 * path maps to the chapter that carries its material; anything else opens on the
 * first chapter. Pure so a test can pass a path or a hash directly.
 */
export function initialChapter(source?: string): ChapterId {
  const raw = (
    source ??
    (typeof window !== "undefined"
      ? window.location.hash.slice(1) || window.location.pathname
      : "")
  ).trim();
  const normalized = raw.startsWith("#") ? raw.slice(1) : raw;
  const pathKey = normalized.startsWith("/") ? normalized.split(/[?#]/)[0]! : `/${normalized.split(/[?#]/)[0]}`;
  const candidate = ANCHOR_BY_PATH[pathKey] ?? normalized.split(/[?#]/)[0]!;
  return (IDS as readonly string[]).includes(candidate)
    ? (candidate as ChapterId)
    : IDS[0];
}

/**
 * ChapterStage — one document, five chapters, one source of truth.
 *
 * Every chapter is rendered in the ordinary document flow and stays visible.
 * Nothing here gates a panel on the active chapter: no `inert`, no
 * `aria-hidden`, no hidden remainder. The two observers only report where the
 * reader is — one moves the current mark on the rail, one draws a chapter's
 * seam once it has been read. A line says the same thing to a screen reader.
 */
export function ChapterStage() {
  const [active, setActive] = useState<ChapterId>(() => initialChapter());
  const panels = useRef<Partial<Record<ChapterId, HTMLElement | null>>>({});

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    // A thin band at the viewport's centre decides which chapter is current.
    const rootMargin = "-45% 0px -45% 0px";
    const activeObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (!visible.length) return;
        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.id;
        if (id && (IDS as readonly string[]).includes(id)) {
          setActive(id as ChapterId);
        }
      },
      { rootMargin, threshold: 0 },
    );
    const seenObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.seen = "true";
          }
        }
      },
      { rootMargin, threshold: 0 },
    );

    for (const id of IDS) {
      const panel = panels.current[id];
      if (!panel) continue;
      activeObserver.observe(panel);
      seenObserver.observe(panel);
    }
    return () => {
      activeObserver.disconnect();
      seenObserver.disconnect();
    };
  }, []);

  // The browser fires its native hash jump before React has put the panels in
  // the document, so a shared /#work link would open on the first chapter.
  // Jump once after mount; this is an initial position, never an animation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.slice(1);
    if (!(IDS as readonly string[]).includes(hash)) return;
    const panel = document.getElementById(hash);
    if (!panel) return;
    let cancelled = false;
    const jump = () => {
      if (!cancelled) scrollToTarget(panel, { immediate: true });
    };
    const frame = window.requestAnimationFrame(jump);
    // The serif and the mono face change the measure after they load. Settle
    // the position once more so the linked chapter, not its old offset, is on
    // screen.
    void document.fonts?.ready.then(jump).catch(() => undefined);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  /** The props every chapter panel shares: identity and reading seam. */
  function panelProps(id: ChapterId) {
    return {
      id,
      "data-chapter": id,
      "data-active": active === id ? "true" : "false",
      className: "stage-panel",
      ref: (node: HTMLElement | null) => {
        panels.current[id] = node;
      },
    };
  }

  function goTo(id: ChapterId) {
    setActive(id);
    if (typeof window === "undefined") return;
    window.history.replaceState(null, "", `#${id}`);
    const panel = document.getElementById(id);
    if (panel && typeof panel.scrollIntoView === "function") {
      panel.scrollIntoView({
        behavior: motionAllowed() ? "smooth" : "auto",
        block: "start",
      });
    }
  }

  /** Every rail link is a hash jump; no route link exists anywhere. */
  function railClick(id: ChapterId) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      goTo(id);
    };
  }

  const activeIndex = Math.max(0, IDS.indexOf(active));

  return (
    <div className="stage">
      <nav className="stage-rail" aria-label="Chapters">
        <div className="stage-rail__inner">
          <span className="stage-rail__mark" aria-hidden="true">
            <img
              src="/brand/signature.svg"
              alt=""
              width="30"
              height="30"
              draggable={false}
            />
          </span>
          <p className="stage-rail__eyebrow">Nathaniel Nikolai Ladero</p>
          <ol className="stage-rail__list">
            {CHAPTERS.map((chapter, index) => {
              const current = chapter.id === active;
              return (
                <li key={chapter.id} className="stage-rail__item">
                  <a
                    href={`#${chapter.id}`}
                    className="stage-rail__link"
                    data-chapter-link={chapter.id}
                    aria-current={current ? "true" : undefined}
                    onClick={railClick(chapter.id)}
                  >
                    <span className="stage-rail__no">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="stage-rail__label">{chapter.label}</span>
                  </a>
                </li>
              );
            })}
          </ol>
          <p className="stage-rail__foot">Five chapters in one document.</p>
        </div>
      </nav>

      <p
        className="stage-live sr-only"
        aria-live="polite"
        aria-atomic="true"
        data-stage-live
      >
        {`Chapter ${activeIndex + 1} of ${CHAPTERS.length}: ${CHAPTERS[activeIndex].label}`}
      </p>

      <div className="stage-panels">
        <section
          {...panelProps("person")}
          aria-labelledby="chapter-person-title"
        >
          <p className="stage-kicker">
            <span className="stage-kicker__no">01</span>
            <span>{CHAPTERS[0].label}</span>
          </p>
          <h1 id="chapter-person-title" className="stage-title">
            <span className="stage-title__line">I ship systems</span>
            <span className="stage-title__line">that hold in production.</span>
          </h1>
          <p className="stage-claim">{recordOpener}</p>
          <p className="stage-voice">{standfirst}</p>
          <ul className="stage-facts">
            <li>{name}</li>
            <li>{figures.tenure} in production</li>
            <li>{locatedIn}</li>
            <li>{statusLine}</li>
          </ul>
        </section>

        <section
          {...panelProps("method")}
          aria-labelledby="chapter-method-title"
        >
          <p className="stage-kicker">
            <span className="stage-kicker__no">02</span>
            <span>{CHAPTERS[1].label}</span>
          </p>
          <h2 id="chapter-method-title" className="stage-heading">
            {aiPractice.heading}
          </h2>
          <blockquote className="stage-quote">
            {aiPractice.sentences[2]}
          </blockquote>
          <div className="stage-columns">
            <div>
              {aiPractice.sentences.slice(0, 2).map((sentence) => (
                <p key={sentence}>{sentence}</p>
              ))}
              <ul className="stage-chips">
                {aiPractice.facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </div>
            <div className="stage-measure">
              <p className="stage-measure__label">{measurement.label}</p>
              <dl className="stage-measure__pair">
                <div>
                  <dt>{measurement.beforeName}</dt>
                  <dd className="stage-measure__figure">{queryFigure.before}</dd>
                  <dd>{measurement.beforeNote}</dd>
                </div>
                <div>
                  <dt>{measurement.afterName}</dt>
                  <dd className="stage-measure__figure">{queryFigure.after}</dd>
                  <dd>{measurement.afterNote}</dd>
                </div>
              </dl>
              <p className="stage-measure__note">{measurement.provenance}</p>
            </div>
          </div>
          <ul className="stage-fields">
            {proofRows.map((row) => (
              <li key={row.claim}>
                <p className="stage-fields__figure">{row.figure}</p>
                <div>
                  <h3>{row.claim}</h3>
                  <p>{row.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section {...panelProps("work")} aria-labelledby="chapter-work-title">
          <p className="stage-kicker">
            <span className="stage-kicker__no">03</span>
            <span>{CHAPTERS[2].label}</span>
          </p>
          <h2 id="chapter-work-title" className="stage-heading">
            Selected work
          </h2>
          <p className="stage-lede">{workLede}</p>
          <ol className="stage-rows">
            {workRows.map((row, index) => (
              <li key={row.name}>
                <span className="stage-rows__no">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <a href={row.url} target="_blank" rel="noopener noreferrer">
                  {row.name}
                </a>
                <span>{row.line}</span>
              </li>
            ))}
          </ol>
          <h3 className="stage-subheading">The full catalogue</h3>
          <p className="stage-lede">{projectsLede}</p>
          <ol className="stage-rows">
            {projects.map((project) => (
              <li key={project.id}>
                <span className="stage-rows__no">{project.year}</span>
                <a href={project.url} target="_blank" rel="noopener noreferrer">
                  {project.name}
                </a>
                <span>{project.description}</span>
              </li>
            ))}
          </ol>
        </section>

        <section
          {...panelProps("experience")}
          aria-labelledby="chapter-experience-title"
        >
          <p className="stage-kicker">
            <span className="stage-kicker__no">04</span>
            <span>{CHAPTERS[3].label}</span>
          </p>
          <h2 id="chapter-experience-title" className="stage-heading">
            Experience
          </h2>
          <p className="stage-lede">{experienceLede}</p>
          <p className="stage-contract">
            <span>{formerRoleLine}</span>
            <span>{tenureSpan}</span>
            <span>{employer.location}</span>
          </p>
          <ol className="stage-sequence">
            {experience.map((entry) => (
              <li key={entry.id}>
                <p className="stage-sequence__date">{entry.date}</p>
                <h3>{entry.name}</h3>
                <p className="stage-sequence__outcome">{entry.outcome}</p>
                <p>{entry.description}</p>
                {entry.metric ? (
                  <p className="stage-sequence__figure">{entry.metric}</p>
                ) : null}
                <ul className="stage-chips">
                  {entry.tech.map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <p className="stage-lede">{provenance}</p>
          <h3 className="stage-subheading">Credentials</h3>
          <ul className="stage-list stage-list--credentials">
            {credentials.map((credential) => (
              <li key={credential.id}>
                <a href={credential.url} target="_blank" rel="noopener noreferrer">
                  {credential.title}
                </a>
                <span>{credential.issuer}</span>
                <span>{credential.date}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          {...panelProps("contact")}
          aria-labelledby="chapter-contact-title"
        >
          <p className="stage-kicker">
            <span className="stage-kicker__no">05</span>
            <span>{CHAPTERS[4].label}</span>
          </p>
          <h2 id="chapter-contact-title" className="stage-heading">
            {contactBlock.heading}
          </h2>
          <p className="stage-voice">{contactBlock.line}</p>
          <a
            className="stage-action"
            href={`mailto:${CONTACT_EMAIL}?subject=Software%20engineering%20role`}
          >
            {CONTACT_EMAIL}
          </a>
          <p className="stage-lede">{contactBlock.nextStep}</p>
        </section>
      </div>
    </div>
  );
}

export default ChapterStage;
