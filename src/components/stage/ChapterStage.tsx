import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
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
import { countUp, motionAllowed } from "../../lib/motion";
import { scrollTo as scrollToTarget } from "../../lib/smooth";
import { emitStageFlash, mountStageMotion } from "../../lib/stage-motion";
import { BlackHoleCanvas } from "./BlackHoleCanvas";

const ANCHOR_BY_PATH: Readonly<Record<string, string>> = {
  "/experience": "experience",
  "/projects": "work",
};

export function initialChapter(source?: string): ChapterId {
  const raw = (
    source ??
    (typeof window !== "undefined"
      ? window.location.hash.slice(1) || window.location.pathname
      : "")
  ).trim();
  const normalized = raw.startsWith("#") ? raw.slice(1) : raw;
  const pathKey = normalized.startsWith("/")
    ? normalized.split(/[?#]/)[0]!
    : `/${normalized.split(/[?#]/)[0]}`;
  const candidate = ANCHOR_BY_PATH[pathKey] ?? normalized.split(/[?#]/)[0]!;
  return (IDS as readonly string[]).includes(candidate)
    ? (candidate as ChapterId)
    : IDS[0];
}

/**
 * ChapterStage — one descent past a single mass, read in five orbital shells.
 * The hardest measured result sits inside the horizon; every other figure is a
 * satellite around it. Native scroll owns the camera and no chapter is hidden.
 */
export function ChapterStage() {
  const [active, setActive] = useState<ChapterId>(() => initialChapter());
  const [live, setLive] = useState(false);
  const [figureReady, setFigureReady] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panels = useRef<Partial<Record<ChapterId, HTMLElement | null>>>({});
  const figure = useRef<HTMLSpanElement>(null);

  const onStatus = useCallback((value: boolean) => setLive(value), []);

  useEffect(() => {
    if (!root.current) return;
    const motion = mountStageMotion(root.current);
    return () => motion.destroy();
  }, []);

  // The figure is added only once the shader has published the horizon, so it
  // never grows from a placeholder box and contributes no layout shift.
  useEffect(() => {
    if (live || !motionAllowed()) setFigureReady(true);
  }, [live]);

  useEffect(() => {
    if (!figureReady) return;
    const reduction = proofRows[0]?.figure ?? "";
    const target = Number(reduction.replace(/[^\d.]/g, ""));
    const counter = Number.isFinite(target)
      ? countUp(figure.current, target, (value) => `−${Math.round(value)}%`, {
          duration: 1.25,
        })
      : null;
    return () => counter?.revert();
  }, [figureReady]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const rootMargin = "-45% 0px -45% 0px";
    const observer = new IntersectionObserver(
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
    for (const id of IDS) {
      const panel = panels.current[id];
      if (panel) observer.observe(panel);
    }
    return () => observer.disconnect();
  }, []);

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
    void document.fonts?.ready.then(jump).catch(() => undefined);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  // Back and forward move through the same five chapters the index writes.
  useEffect(() => {
    const onPop = () => {
      const raw = window.location.hash.slice(1);
      const id = (IDS as readonly string[]).includes(raw)
        ? (raw as ChapterId)
        : IDS[0];
      setActive(id);
      const panel = document.getElementById(id);
      if (panel) scrollToTarget(panel, { immediate: true });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

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
    const next = `#${id}`;
    if (window.location.hash === next) window.history.replaceState(null, "", next);
    else window.history.pushState(null, "", next);
    const panel = document.getElementById(id);
    if (!panel) return;

    // A document snapshot costs two frames on every width. The lens flash is
    // one frame and reads as the same cut, so it carries every chapter change.
    emitStageFlash();
    scrollToTarget(panel, { immediate: true });
  }

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
  const singularity = proofRows[0];

  return (
    <div className="stage" ref={root} data-bh={live ? "live" : "still"}>
      <BlackHoleCanvas onStatus={onStatus} />

      <div className="bh-still" aria-hidden="true">
        <div className="bh-still__dust" />
        <div className="bh-still__shadow" />
        <div className="bh-still__disc" />
        <div className="bh-still__photon" />
        <div className="bh-still__horizon" />
      </div>

      {figureReady ? (
        <div className="singularity" hidden={active !== "person"}>
          <span className="singularity__num" ref={figure} data-figure>
            {singularity?.figure ?? ""}
          </span>
          <span className="singularity__label">
            <span className="singularity__label-full">{singularity?.claim ?? ""}</span>
            <span className="singularity__label-short">
              {singularity?.claim.split(" ").slice(-2).join(" ") ?? ""}
            </span>
          </span>
        </div>
      ) : null}

      <nav className="stage-rail" aria-label="Chapters">
        <div className="stage-rail__inner">
          <ol className="stage-rail__list">
            {CHAPTERS.map((chapter, index) => {
              const current = chapter.id === active;
              return (
                <li key={chapter.id} className="stage-rail__item">
                  <a
                    href={`#${chapter.id}`}
                    className="stage-rail__link"
                    data-chapter-link={chapter.id}
                    aria-label={`${String(index + 1).padStart(2, "0")} ${chapter.label}`}
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

      <div className="stage-traverse">
        <section {...panelProps("person")} aria-labelledby="chapter-person-title">
          <div className="stage-panel__frame">
            <div className="stage-panel__content stage-panel__content--arrival">
              <div className="stage-lead">
                <p className="stage-kicker">
                  <span className="stage-kicker__no">01</span>
                  <span>{CHAPTERS[0].label}</span>
                </p>
                <h1 id="chapter-person-title" className="stage-title">
                  I ship systems that hold in production.
                </h1>
                <p className="stage-claim">{recordOpener}</p>
                <p className="stage-voice">{standfirst}</p>
              </div>
              <span className="singularity-slot" aria-hidden="true" />
              <ul className="stage-facts">
                <li>{name}</li>
                <li>{figures.tenure} in production</li>
                <li>{locatedIn}</li>
                <li>{statusLine}</li>
              </ul>
            </div>
          </div>
        </section>

        <section {...panelProps("method")} aria-labelledby="chapter-method-title">
          <div className="stage-panel__frame">
            <div className="stage-panel__content">
              <div className="stage-lead">
                <p className="stage-kicker">
                  <span className="stage-kicker__no">02</span>
                  <span>{CHAPTERS[1].label}</span>
                </p>
                <h2 id="chapter-method-title" className="stage-heading">
                  {aiPractice.heading}
                </h2>
                <p className="stage-claim">{aiPractice.sentences[2]}</p>
                <p className="stage-voice">{aiPractice.sentences[0]}</p>
                <p className="stage-voice">{aiPractice.sentences[1]}</p>
                <ul className="stage-chips">
                  {aiPractice.facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              </div>
              <div className="stage-data">
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
                <ul className="stage-fields">
                  {proofRows.slice(1).map((row) => (
                    <li key={row.claim}>
                      <p className="stage-fields__figure">{row.figure}</p>
                      <div>
                        <h3>{row.claim}</h3>
                        <p>{row.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section {...panelProps("work")} aria-labelledby="chapter-work-title">
          <div className="stage-panel__frame">
            <div className="stage-panel__content">
              <div className="stage-lead">
                <p className="stage-kicker">
                  <span className="stage-kicker__no">03</span>
                  <span>{CHAPTERS[2].label}</span>
                </p>
                <h2 id="chapter-work-title" className="stage-heading">
                  Selected work
                </h2>
                <p className="stage-claim">{workLede}</p>
              </div>
              <div className="stage-data">
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
              </div>
            </div>
          </div>
        </section>

        <section {...panelProps("experience")} aria-labelledby="chapter-experience-title">
          <div className="stage-panel__frame">
            <div className="stage-panel__content">
              <div className="stage-lead">
                <p className="stage-kicker">
                  <span className="stage-kicker__no">04</span>
                  <span>{CHAPTERS[3].label}</span>
                </p>
                <h2 id="chapter-experience-title" className="stage-heading">
                  Experience
                </h2>
                <p className="stage-claim">{experienceLede}</p>
                <p className="stage-contract">
                  <span>{formerRoleLine}</span>
                  <span>{tenureSpan}</span>
                  <span>{employer.location}</span>
                </p>
              </div>
              <div className="stage-data">
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
              </div>
            </div>
          </div>
        </section>

        <section {...panelProps("contact")} aria-labelledby="chapter-contact-title">
          <div className="stage-panel__frame">
            <div className="stage-panel__content stage-panel__content--contact">
              <div className="stage-lead">
                <p className="stage-kicker">
                  <span className="stage-kicker__no">05</span>
                  <span>{CHAPTERS[4].label}</span>
                </p>
                <h2 id="chapter-contact-title" className="stage-heading">
                  {contactBlock.heading}
                </h2>
                <p className="stage-voice">{contactBlock.line}</p>
                <p className="stage-lede">{contactBlock.nextStep}</p>
              </div>
              <a
                className="stage-action"
                href={`mailto:${CONTACT_EMAIL}?subject=Software%20engineering%20role`}
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ChapterStage;
