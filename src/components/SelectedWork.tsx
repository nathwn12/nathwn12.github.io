import { useState, type CSSProperties } from "react";
import {
  allProjectsLabel,
  projects,
  projectsMarginalia,
} from "../content/projects";
import { RouteLink } from "../lib/router";

const featured = projects.slice(0, 3);

const reveal = (delay: number): CSSProperties =>
  ({ "--d": `${delay}ms` }) as CSSProperties;

/**
 * Selected work (paper): an index of the first three projects on the left and
 * the active case note on the right. Point or focus a row to read its notes;
 * on a phone the panel is hidden and each row carries its own description, so
 * nothing needs a hover to be read. All eleven live at /work.
 */
export function SelectedWork() {
  const [active, setActive] = useState(featured[0]?.id ?? "");

  return (
    <section
      className="work-band band field-paper"
      aria-labelledby="work-heading"
    >
      <div className="wrap">
        <div className="work-head">
          <h2 className="head" id="work-heading" data-reveal>
            Selected work
          </h2>
          <p className="lede" data-reveal style={reveal(80)}>
            {projectsMarginalia}, published under github.com/nathwn12.
          </p>
        </div>

        <div className="work-split">
          <div className="work-left">
            <ul className="work-index" id="work-index">
              {featured.map((project) => (
                <li key={project.id}>
                  <RouteLink
                    href="/work"
                    data-project={project.id}
                    data-active={active === project.id}
                    onMouseEnter={() => setActive(project.id)}
                    onFocus={() => setActive(project.id)}
                  >
                    <span className="name">{project.name}</span>
                    <span className="meta">
                      {project.kind}, {project.year}. {project.role}.
                    </span>
                    <span className="desc">{project.description}</span>
                  </RouteLink>
                </li>
              ))}
            </ul>
            <p className="work-more">
              <RouteLink className="text-link" href="/work">
                {allProjectsLabel}
              </RouteLink>
            </p>
          </div>

          <div className="work-preview" id="work-preview" aria-live="polite">
            {featured.map((project) => (
              <article
                key={project.id}
                data-panel={project.id}
                hidden={active !== project.id}
              >
                <h3>{project.name}</h3>
                <p className="preview-desc">{project.description}</p>
                <ul>
                  {project.highlights.slice(0, 2).map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
                <p className="tech">{project.tech.join(", ")}</p>
                <p className="repo">
                  <a
                    className="text-link"
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Repository
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
