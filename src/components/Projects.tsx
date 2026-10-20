import { motion } from "framer-motion";
import { projects } from "../content/projects";
import { heroIn, springSnappy } from "../lib/motion";
import { RouteLink } from "../lib/router";
import { PageFoot } from "./PageFoot";

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

/* The rank column is narrower than Experience's date rail by design: a rank is
   two digits, a date is not. */
const RAIL = "lg:grid lg:grid-cols-[3rem_minmax(0,1fr)] lg:items-start lg:gap-x-6";

const ACTION =
  "mt-8 inline-flex min-h-11 items-center rounded-xs text-label font-semibold text-accent-text transition-colors duration-link hover:underline";

const PART_LABEL = "text-label font-medium text-text-muted";

/** A stat as a labeled sentence — never a standalone tile. */
function statSentence(stat: { label: string; value: string }): string {
  return `${stat.label.charAt(0).toUpperCase()}${stat.label.slice(1)}: ${stat.value}.`;
}

export default function Projects() {
  return (
    <section id="projects" className="px-6 py-16 lg:px-10">
      <div className="mx-auto w-full max-w-[68ch] lg:max-w-[calc(68ch_+_4.5rem)]">
        <motion.div
          variants={heroIn}
          initial="hidden"
          animate="visible"
          className="lg:pl-[4.5rem]"
        >
          <h1 className="text-display font-semibold text-text">Projects</h1>
          <p className="mt-4 max-w-[65ch] text-lead text-text">
            Twelve open-source projects, featured work first.
          </p>
          <p className="mt-4 max-w-[65ch] text-detail text-text-muted">
            Every project below is a public repository on github.com/nathwn12,
            built and maintained solo. The order is featured work first, then
            the supporting tools. No star count is shown: the signal here is
            what each one does.
          </p>
          <RouteLink href="/contact" className={ACTION}>
            Start a conversation about this work
          </RouteLink>
        </motion.div>

        <ol className="mt-16">
          {projects.map((project, index) => (
            <motion.li
              key={project.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={springSnappy}
              className={`mt-16 border-t border-border pt-8 ${RAIL}`}
            >
              <p className="text-detail tabular-nums text-text-muted lg:pt-1">
                {String(index + 1).padStart(2, "0")}
              </p>

              <div className="mt-4 lg:mt-0">
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

        <PageFoot />
      </div>
    </section>
  );
}
