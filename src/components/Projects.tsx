import {
  archived,
  projects,
  projectsLede,
  projectsSupport,
} from "../content/projects";
import { CONTACT_CTA } from "../content/ledger";
import { RouteLink, SectionLink } from "../lib/router";
import { Reveal } from "./Reveal";

/**
 * Projects — the long form: eleven public repositories with their case notes.
 *
 * Featured work first, then the supporting tools, then the retired entry. Each
 * band pairs what the project does with the facts behind it (kind, authorship,
 * ship year, stats) and keeps the full case notes visible — nothing sits behind
 * a disclosure control.
 *
 * The home page names three of these and rewrites its lines; this page keeps
 * every delivered sentence.
 */

/** A stat as a labelled sentence — never a standalone tile. */
function statSentence(stat: { label: string; value: string }): string {
  return `${stat.label.charAt(0).toUpperCase()}${stat.label.slice(1)}: ${stat.value}.`;
}

export default function Projects() {
  return (
    <>
      <section className="band band--first" aria-labelledby="projects-heading">
        <div className="frame">
          <div className="grid gap-y-8 lg:grid-cols-12 lg:gap-x-10">
            <div className="lg:col-span-7">
              <Reveal>
                <h1 id="projects-heading" className="h1">
                  Projects
                </h1>
                <p className="lede mt-5 max-w-[46ch]">{projectsLede}</p>
                <p className="prose muted mt-4">{projectsSupport}</p>
                <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2">
                  <SectionLink section="contact" className="button">
                    {CONTACT_CTA}
                  </SectionLink>
                  <RouteLink href="/experience" className="text-action">
                    The production record
                  </RouteLink>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-4 lg:col-start-9">
              <Reveal delayMs={80}>
                {/* The count is the page's claim, set as the record's unit so the
                    opening band is a composition rather than a title over an
                    empty half. Both figures are read off the content module. */}
                <div className="fact">
                  <p className="fact__label">Published on GitHub</p>
                  <p className="fact__figure">{projects.length}</p>
                  <p className="fact__note">
                    public repositories under github.com/nathwn12, newest work
                    first.
                  </p>
                  <p className="fact__note">
                    {archived.length} retired and kept public at the foot of the
                    page.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="band band--flush" aria-labelledby="repositories-heading">
        <div className="frame">
          <h2 id="repositories-heading" className="sr-only">
            Repositories
          </h2>
          <ol>
            {projects.map((project, index) => (
              <Reveal
                key={project.id}
                as="li"
                delayMs={index < 4 ? index * 40 : 0}
                className="py-8"
              >
                <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                  <h2 className="h3">
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link"
                    >
                      {project.name}
                    </a>
                  </h2>
                  <p className="meta muted">
                    {project.kind} · {project.role} · shipped {project.year}
                  </p>
                </div>

                <div className="mt-4 grid gap-x-10 gap-y-6 lg:grid-cols-12">
                  <div className="lg:col-span-8">
                    <p className="prose">{project.description}</p>
                    <ul className="mt-4 max-w-[62ch]">
                      {project.highlights.map((highlight) => (
                        <li key={highlight} className="prose flex gap-3">
                          <span
                            aria-hidden="true"
                            className="mt-[0.6em] block size-1 shrink-0 bg-current"
                          />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="lg:col-span-4">
                    <p className="meta muted">{project.dir}/</p>
                    <ul className="mt-2">
                      {project.stats.map((stat) => (
                        <li key={stat.label} className="meta muted">
                          {statSentence(stat)}
                        </li>
                      ))}
                    </ul>
                    <p className="meta mt-3">{project.tech.join(" · ")}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>

          <div className="mt-8">
            <h2 className="h3">Retired</h2>
            <ul className="mt-3">
              {archived.map((entry) => (
                <li key={entry.dir} className="prose muted">
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="accent-link"
                  >
                    {entry.name}
                  </a>{" "}
                  ({entry.dir}/, {entry.year}): retired, not deleted.{" "}
                  {entry.reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
