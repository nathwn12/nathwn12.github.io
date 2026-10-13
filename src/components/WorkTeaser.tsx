import { motion } from "framer-motion";
import { projects } from "../content/projects";
import { RouteLink } from "../lib/router";
import { staggerChild, staggerParent } from "../lib/motion";

/**
 * WorkTeaser — the landing's selected work, three ranked bands.
 *
 * The teaser is deliberately a teaser: a rank in the left gutter at wide
 * widths (a real sequence, with its rationale stated under the heading), the
 * entry title, the two headline measures stated as labelled sentences beside
 * the name they belong to, and the stack inline as Line-bordered chips. The
 * full notes stay on /projects, and each title links there.
 *
 * Identity: full-width sequenced bands separated by 1px Line rules — never a
 * grid of tiles, never nested cards, no number standing without its rank
 * rationale. Tone is type, position, and the rule; the only colour is the
 * hover affordance on a true control.
 *
 * Motion: the list is a stagger parent and each band is a stagger child, so the
 * three walk in one short beat apart, unconditionally — the OS reduced-motion
 * query no longer gates this site (owner order 2026-10-14). Every string is
 * read from src/content/projects.ts, so the copy lives
 * in exactly one place and this file only sequences and shortens it.
 *
 * Authority: fleet brief (senior landing pass) + docs/premium-direction.md
 * § Landing, § Layout, § Hard-ban list.
 */

const chip =
  "rounded-xs border border-border px-2 py-1 text-detail text-text-muted";

/** A stat as a labelled sentence — never a standalone tile or a bare number. */
function statSentence(stat: { label: string; value: string }): string {
  return `${stat.label.charAt(0).toUpperCase()}${stat.label.slice(1)}: ${stat.value}.`;
}

const teasers = projects.slice(0, 3);

export function WorkTeaser() {
  return (
    <section aria-labelledby="work-heading" className="px-6 pt-14 lg:px-10">
      <div className="mx-auto w-full max-w-[68ch]">
        <div className="border-b border-border pb-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2
              id="work-heading"
              className="text-headline font-semibold text-text"
            >
              Selected work
            </h2>
            <RouteLink
              href="/projects"
              data-nav-item
              className="flex min-h-11 items-center rounded-xs text-label font-medium text-text-muted transition-colors duration-150 hover:text-accent-text hover:underline"
            >
              All fifteen projects
            </RouteLink>
          </div>
          <p className="mt-1 text-detail text-text-muted">
            Newest and most distinctive first.
          </p>
        </div>

        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-15% 0px" }}
          variants={staggerParent}
        >
          {teasers.map((project, index) => (
            <motion.li
              key={project.id}
              variants={staggerChild}
              className="grid gap-x-6 gap-y-2 border-b border-border py-6 lg:grid-cols-[2.5rem_minmax(0,1fr)]"
            >
              <p className="text-detail tabular-nums text-text-muted lg:pt-1">
                {String(index + 1).padStart(2, "0")}
              </p>

              <div className="min-w-0">
                <h3 className="text-title font-semibold text-text">
                  <RouteLink
                    href="/projects"
                    data-nav-item
                    className="inline-flex min-h-11 items-center transition-colors duration-150 hover:text-accent-text hover:underline"
                  >
                    {project.name}
                  </RouteLink>
                </h3>

                <p className="mt-2 max-w-[65ch] text-body text-text">
                  {project.stats
                    .slice(0, 2)
                    .map((stat) => statSentence(stat))
                    .join(" ")}
                </p>

                <ul className="mt-3 flex flex-wrap gap-2">
                  {project.tech.slice(0, 4).map((tech) => (
                    <li key={tech} className={chip}>
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
