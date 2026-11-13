import {
  projects,
  projectsLede,
  projectsSupport,
} from "../content/projects";
import { CONTACT_CTA } from "../content/ledger";
import { RouteLink, SectionLink } from "../lib/router";

/**
 * Projects — the open-source ledger, featured work first.
 *
 * Thirteen rows, one hairline between each: index, name, what it does, the stack
 * it is actually written in, the year it last shipped, and the repository. The
 * index is honest on this route because the order is a real one — featured work
 * first, supporting tools after — so a reader can see where they are in it.
 *
 * The row is the affordance and it is the whole affordance: the rule brightens,
 * the index takes the signal, and the description lifts 2px. Every out-link is
 * a real anchor whose accessible name says where it goes — the repository path,
 * plus that it opens in a new tab — and never "here".
 *
 * A fork states its upstream in the row instead of hiding it. Only what the
 * account publishes today is listed: a private or archived repository is not
 * history, it is a dead link. No screenshots are faked; the row is the
 * evidence.
 */

export default function Projects() {
  return (
    <>
      <section className="band band--first" aria-labelledby="projects-heading">
        <div className="frame">
          <h1
            id="projects-heading"
            className="font-display text-[clamp(2.75rem,1.4rem+5.4vw,6.5rem)] leading-[0.9] tracking-[-0.02em]"
          >
            Projects
          </h1>

          <div className="mt-6 grid gap-y-8 lg:grid-cols-12 lg:gap-x-10">
            <div className="lg:col-span-7">
              <p className="lede max-w-[46ch] text-[color:var(--rec-ink-muted)]">
                {projectsLede}
              </p>
              <p className="prose mt-4 text-[color:var(--rec-ink-muted)]">
                {projectsSupport}
              </p>
            </div>

            <dl className="flex flex-wrap items-start gap-x-10 gap-y-4 border-t border-[color:var(--rec-rule)] pt-4 lg:col-span-4 lg:col-start-9 lg:self-start">
              <div className="grid gap-y-1">
                <dt className="data text-[color:var(--rec-ink-muted)]">published</dt>
                <dd className="data--lg data tnum text-[color:var(--rec-ink)]">
                  {projects.length}
                </dd>
              </div>
            </dl>
          </div>

          {/* The table's own top rule closes this band — no drawn seam above
              it, because a second rule 48px further up reads as an empty strip. */}
        </div>
      </section>

      <section className="band band--flush" aria-labelledby="repositories-heading">
        <div className="frame">
          <h2 id="repositories-heading" className="sr-only">
            Repositories
          </h2>

          <ol className="border-b border-[color:var(--rec-rule)]">
            {projects.map((project, index) => {
              const isFork = project.role.startsWith("Fork of ");
              const upstream = isFork
                ? project.role.slice("Fork of ".length)
                : null;

              return (
                <li
                  key={project.id}
                  className="group border-t border-[color:var(--rec-rule)] transition-colors duration-[140ms] hover:border-[color:var(--rec-rule-strong)] focus-within:border-[color:var(--rec-rule-strong)]"
                >
                  <div className="grid gap-y-3 py-6 md:grid-cols-[2.25rem_minmax(0,1fr)_5.5rem] md:gap-x-8 md:py-7">
                    {/* Narrow: the index and the year share one mono line above
                        the name, and the wrapper dissolves into the row grid on
                        a wide screen. */}
                    <div className="flex items-baseline justify-between gap-4 md:contents">
                      <p className="data tnum text-[color:var(--rec-ink-muted)] transition-colors duration-[140ms] group-hover:text-[color:var(--rec-signal)] group-focus-within:text-[color:var(--rec-signal)] md:col-start-1 md:row-start-1 md:pt-1">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="data tnum text-[color:var(--rec-ink-muted)] md:col-start-3 md:row-start-1 md:justify-self-end md:pt-1">
                        {project.year}
                      </p>
                    </div>

                    <div className="md:col-start-2 md:row-start-1">
                      <h3 className="text-[1.0625rem] leading-[1.3] font-semibold text-[color:var(--rec-ink)]">
                        {project.name}
                      </h3>

                      <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <p className="data text-[color:var(--rec-ink-muted)]">
                          {project.kind}
                        </p>
                        {upstream && (
                          <p className="data text-[color:var(--rec-ink-muted)]">
                            fork of {upstream}
                          </p>
                        )}
                      </div>

                      <p className="prose mt-2 transition-transform duration-[140ms] group-hover:-translate-y-0.5 group-focus-within:-translate-y-0.5">
                        {project.description}
                      </p>

                      <ul className="data data--sm mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[color:var(--rec-ink-muted)]">
                        {project.tech.map((tag) => (
                          <li key={tag}>{tag}</li>
                        ))}
                      </ul>

                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="data mt-2 inline-flex min-h-[2.75rem] items-center text-[color:var(--rec-signal)] underline decoration-1 underline-offset-[0.25em] transition-colors duration-[140ms] hover:decoration-current"
                      >
                        nathwn12/{project.dir}
                        <span className="sr-only">
                          {" "}
                          on GitHub, opens in a new tab
                        </span>
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-[color:var(--rec-rule)] pt-8">
            <SectionLink section="contact" className="button">
              {CONTACT_CTA}
            </SectionLink>
            <RouteLink href="/experience" className="text-action">
              The production record
            </RouteLink>
          </div>
        </div>
      </section>
    </>
  );
}
