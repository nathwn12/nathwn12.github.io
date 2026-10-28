import { archived, projects, projectsLede } from "../content/projects";

/**
 * Render one highlight, turning `backticked` identifiers into a <code> token
 * instead of printing the backticks. The prototype does the same for
 * `allow_clipboard:true`; the content keeps the plain source text.
 */
function highlightParts(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * The work archive: all eleven live projects, featured first, then the
 * supporting tools; retired work is separated at the foot so it never reads as
 * current. Every card states what the project does, the moves behind it, the
 * stack, and the repository under nathwn12.
 */
export function WorkPage() {
  return (
    <div className="work-page">
      <section className="page-head field-paper" aria-labelledby="work-title">
        <div className="wrap">
          <h1 id="work-title">Work</h1>
          <p className="lede">{projectsLede}</p>
        </div>
      </section>

      <section className="work-list field-paper" aria-label="Projects">
        <div className="work-list-inner">
          {projects.map((project) => (
            <article className="project" key={project.id}>
              <div className="project-meta">
                <p className="year">{project.year}</p>
                <p>{project.kind}</p>
                <p>{project.role}</p>
              </div>
              <div>
                <h2>{project.name}</h2>
                <p className="project-desc">{project.description}</p>
                <ul className="project-highlights">
                  {project.highlights.map((highlight) => (
                    <li key={highlight}>{highlightParts(highlight)}</li>
                  ))}
                </ul>
                <p className="project-tech">{project.tech.join(", ")}</p>
                <p className="project-link">
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
              </div>
            </article>
          ))}

          <div className="archived">
            <h2>Retired</h2>
            <div>
              {archived.map((entry) => (
                <p key={entry.dir}>
                  <a
                    className="link"
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {entry.name}
                  </a>
                  , {entry.year}. {entry.reason}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
