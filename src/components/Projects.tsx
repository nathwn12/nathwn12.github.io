import { motion } from "framer-motion";
import { archived, projects } from "../content/projects";
import { heroIn, springSnappy } from "../lib/motion";
import { RouteLink } from "../lib/router";
import { PageFoot } from "./PageFoot";
import {
  Folio,
  GUTTER_CELL,
  GUTTER_CONTAINER,
  GUTTER_GRID,
  Kicker,
  folioFromKicker,
} from "./InstrumentBand";

/**
 * Projects — ranked open-source case studies, each band split into what the
 * project does and the facts behind it.
 *
 * Authority: docs/premium-direction.md § Per-route application (Projects),
 * § Layout, § Type; motion names from src/lib/motion (frozen — never redefined
 * here). Where this file and the direction disagree, the direction wins.
 *
 * Route identity (this route's alone): a narrow numeric rail carrying the rank,
 * with the ranking rationale stated in words above the list — numerals appear
 * here only because they mark a real order. Inside each band the case splits
 * into two boxes side by side at `lg`: what the project does on the left, its
 * case-study facts on the right, so each fact sits beside the description it
 * belongs to rather than under a heading of its own. Stats are labelled
 * sentences, never tiles, and the tech reads as inline chips.
 *
 * Reading held (fleet brief, applied here): nothing is placed behind a
 * disclosure control. The direction offers an expanded-view control; the brief's
 * standing reading forbids parking content behind one, so the full case — both
 * halves, every stat — stays visible on the band. Bands are full width and
 * unboxed: a 1px Line rule, then the case. Nothing nests.
 *
 * Rhythm: the direction's 8px base held strictly — section gaps 64px (mt-16),
 * entry gaps 32px (mt-8), text gaps 16px (mt-4).
 *
 * Motion: the title block makes the page's single slow arrival (heroIn); each
 * band settles on the crisp zero-overshoot spring (springSnappy) applied to
 * OPACITY ONLY — no rise, no layout tween.
 */

/* The one code-adjacent convention in the system: Body family at Detail size,
   letterspacing 0, distinguished by a Line border rather than a third face. */
const CHIP =
  "inline-flex items-center rounded-xs border border-border px-2 py-1 text-detail text-text-muted";

/* The rank rail against the case: 2 columns of rank, 8 of case. */
const RAIL = "lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-6";
const RAIL_RANK = "lg:col-span-2";
const RAIL_BODY = "lg:col-span-8";

const ACTION =
  "mt-8 inline-flex min-h-11 items-center rounded-xs text-label font-semibold text-accent-text transition-colors duration-link hover:underline";

/** The route's kicker — the folio's only source (see folioFromKicker). */
const KICKER = "08 / Projects";

const PART_LABEL = "text-label font-medium text-text-muted";

/** A stat as a labeled sentence — never a standalone tile. */
function statSentence(stat: { label: string; value: string }): string {
  return `${stat.label.charAt(0).toUpperCase()}${stat.label.slice(1)}: ${stat.value}.`;
}

export default function Projects() {
  return (
    <section id="projects" className="px-6 py-16 lg:px-10 lg:py-24">
      <div className={`${GUTTER_CONTAINER} ${GUTTER_GRID}`}>
        <div aria-hidden="true" className={GUTTER_CELL}>
          <div className="lg:sticky lg:top-32">
            <Folio index={folioFromKicker(KICKER)} />
          </div>
        </div>
        <div className="relative min-w-0 lg:col-span-7">
          <motion.div
            variants={heroIn}
            initial="hidden"
            animate="visible"
          >
            <div aria-hidden="true" className="h-[3px] w-full bg-text" />
            <div className="flex items-baseline gap-3 pt-4">
              <Kicker>{KICKER}</Kicker>
            </div>
            <h1 className="masthead-name mt-3 text-text">Projects</h1>
            <p className="mt-4 max-w-[65ch] text-lead text-text">
              {projects.length} selected open-source projects on this page,
              featured work first.
            </p>
            <p className="mt-4 max-w-[65ch] text-detail text-text-muted">
              Each project below is a public repository on github.com/nathwn12,
              built and maintained solo. The order is featured work first, then
              the supporting tools. No star count is shown: the signal here is
              what each one does.
            </p>
            <RouteLink href="/contact" className={ACTION}>
              Start a conversation about this work
            </RouteLink>
          </motion.div>

          <div aria-hidden="true" className="mt-8 h-[3px] w-full bg-text" />

        <ol className="mt-8">
          {projects.map((project, index) => (
            <motion.li
              key={project.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={springSnappy}
              className={
                index === 0
                  ? `mt-8 pt-0 ${RAIL}`
                  : `mt-16 border-t border-border pt-8 ${RAIL}`
              }
            >
              <p className={`text-detail tabular-nums text-text-muted ${RAIL_RANK} lg:pt-1`}>
                {String(index + 1).padStart(2, "0")}
              </p>

              <div className={`mt-4 ${RAIL_BODY} lg:mt-0`}>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <h2 className="text-title font-semibold text-text">
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-nav-item
                      className="transition-colors duration-link hover:text-accent-text hover:underline"
                    >
                      {project.name}
                    </a>
                  </h2>
                  <span className={CHIP}>{project.dir}/</span>
                </div>

                <p className="mt-3 text-detail text-text-muted">
                  {project.kind} · {project.role} · shipped {project.year}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-2">
                  <div>
                    <p className={PART_LABEL}>What it does</p>
                    <p className="mt-2 max-w-[65ch] text-body text-text">
                      {project.description}
                    </p>
                    <ul className="mt-4 max-w-[65ch] space-y-2">
                      {project.highlights.map((highlight) => (
                        <li key={highlight} className="text-detail text-text-muted">
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className={PART_LABEL}>Facts</p>
                    <ul className="mt-2">
                      {project.stats.map((stat) => (
                        <li
                          key={stat.label}
                          className="text-detail text-text-muted"
                        >
                          {statSentence(stat)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <ul className="mt-6 flex flex-wrap gap-2">
                  {project.tech.map((tech) => (
                    <li key={tech} className={CHIP}>
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.li>
          ))}
        </ol>

        <div className="mt-16 border-t border-border pt-8">
          <h2 className="text-title font-semibold text-text">Retired</h2>
          <ul className="mt-4 space-y-2">
            {archived.map((entry) => (
              <li key={entry.dir} className="text-detail text-text-muted">
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-nav-item
                  className="font-medium text-text transition-colors duration-link hover:text-accent-text hover:underline"
                >
                  {entry.name}
                </a>{" "}
                ({entry.dir}/, {entry.year}): retired, not deleted.{" "}
                {entry.reason}
              </li>
            ))}
          </ul>
        </div>

        <PageFoot />
        </div>
      </div>
    </section>
  );
}
