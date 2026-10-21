import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { projects } from "../content/projects";
import { RouteLink } from "../lib/router";
import { staggerChild } from "../lib/motion";
import { BandShell } from "./InstrumentBand";

/**
 * WorkTeaser — the landing's selected work, three ranked bands.
 *
 * The teaser is deliberately a teaser: a large muted rank numeral in the left
 * gutter (a real sequence, stated once per row at display size, never a 12px
 * label), the entry title, one derived line per row read straight from the
 * project's own record (`role · kind · year`), the two headline measures
 * stated as labelled sentences beside the name they belong to, and the stack
 * inline as Line-bordered chips. The full notes stay on /projects, and each
 * title links there.
 *
 * Identity: full-width sequenced bands separated by 1px Line rules — never a
 * grid of tiles, never nested cards, no number standing without its rank
 * rationale. The list opens with a rule and closes with one: a hairline
 * between every row and the band-closing rule under the last. Tone is type,
 * position, and the rule; the only colour is the hover affordance on a true
 * control.
 *
 * Motion: the list is a stagger parent and each band is a stagger child, so the
 * three walk in one short beat apart. Every string is
 * read from src/content/projects.ts, so the copy lives
 * in exactly one place and this file only sequences and shortens it.
 *
 * Authority: fleet brief (senior landing pass) + docs/premium-direction.md
 * § Landing, § Layout, § Hard-ban list.
 */

const chip =
  "rounded-xs border border-border px-2 py-1 text-detail text-text-muted";

/** One row's derived line — the project's own record, never invented copy:
    authorship, kind, and year, each read verbatim from src/content/projects.ts. */
function derivedLine(project: (typeof projects)[number]): string {
  return `${project.role} · ${project.kind} · ${project.year}`;
}

/** One row's definition — the project's own `description`, never invented copy:
    truncated at the first sentence boundary (`.` followed by whitespace). */
function firstSentence(description: string): string {
  const boundary = description.search(/\.\s/);
  return boundary === -1 ? description : description.slice(0, boundary + 1);
}

/** A stat as a labelled sentence — never a standalone tile or a bare number. */
function statSentence(stat: { label: string; value: string }): string {
  return `${stat.label.charAt(0).toUpperCase()}${stat.label.slice(1)}: ${stat.value}.`;
}

const teasers = projects.slice(0, 3);

export function WorkTeaser({ marginalia }: { marginalia?: ReactNode }) {
  return (
    <BandShell
      kicker="02 / Selected work"
      title="Selected work"
      headingId="work-heading"
      band={1}
      marginalia={marginalia}
    >
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-detail text-text-muted">
          Open-source work following the experience record, featured work first.
        </p>
        <RouteLink
          href="/projects"
          data-nav-item
          className="flex min-h-11 items-center rounded-xs text-label font-medium text-text-muted transition-colors duration-link hover:text-accent-text hover:underline"
        >
          All {projects.length} projects
        </RouteLink>
      </div>

      <ol className="mt-8 border-t border-border">
          {teasers.map((project, index) => (
            <motion.li
              key={project.id}
              variants={staggerChild}
              className={`grid gap-x-6 gap-y-2 border-b border-border py-6 lg:grid-cols-[5rem_minmax(0,1fr)]`}
            >
              <p className="font-display text-[clamp(2rem,3.5vw,3.5rem)] leading-none font-semibold tabular-nums text-text-muted">
                {String(index + 1).padStart(2, "0")}
              </p>

              <div className="min-w-0">
                <h3 className="text-title font-semibold text-text">
                  <RouteLink
                    href="/projects"
                    data-nav-item
                    className="inline-flex min-h-11 items-center transition-colors duration-link hover:text-accent-text hover:underline"
                  >
                    {project.name}
                  </RouteLink>
                </h3>

                <p className="mt-1 text-detail text-text-muted">
                  {derivedLine(project)}
                </p>

                <p className="mt-2 max-w-[62ch] text-body text-text">
                  {firstSentence(project.description)}
                </p>

                <p className="mt-1 text-detail text-text-muted">
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
        </ol>
    </BandShell>
  );
}
