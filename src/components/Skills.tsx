import { motion } from "framer-motion";
import { GROUP_NOTES, groupSizeNote, repos, skillsLede, TIER_WORDS } from "../content/skills";
import { fadeUp } from "../lib/motion";
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
 * Skills — the capability record as a two-edge index.
 *
 * Authority: docs/premium-direction.md § Per-route application (Skills),
 * § Layout, § Type; motion names from src/lib/motion (frozen — never redefined
 * here). Where this file and the direction disagree, the direction wins.
 *
 * Route identity (this route's alone): a right rail. Names and notes hold the
 * left edge while every row's tier — stated in words, never a colour, bar, or
 * proficiency numeral — resolves hard right at `sm` and above, so the page
 * reads as a ledger with two edges instead of one. Each group opens on a
 * growing rule under its heading rather than the full-bleed band rule the other
 * routes use, and the packages inside hang from a hairline list. No card, no
 * key, no grid: the group's reading-order is carried by its position and stated
 * once in words beside the heading.
 *
 * Rhythm: the direction's 8px base held strictly — group gaps 64px (mt-16),
 * package gaps 32px (py-4), text gaps 16px (mt-4).
 *
 * Motion: each group rises once on its own short beat (fadeUp) as the page
 * settles; no stagger, no choreography, and no reduced variant — the OS query
 * no longer shortens it (owner order 2026-10-14).
 *
 * States: content is imported synchronously and schema-validated at module load
 * (content/skills.ts throws on a mismatch), so this page has no loading, empty,
 * or error state of its own; the shell owns both. The one inline empty state is
 * an unversioned package: its version chip is omitted rather than rendering a
 * placeholder dash.
 */

/* The one code-adjacent convention in the system (Body family, Detail size,
   letterspacing 0, Line border) — versions render here, never in a third face. */
const CHIP =
  "inline-flex items-center rounded-xs border border-border px-2 py-0.5 text-detail tabular-nums text-text-muted";

const ACTION =
  "mt-8 inline-flex min-h-11 items-center rounded-xs text-label font-semibold text-accent-text transition-colors duration-link hover:underline";

/** The route's kicker — the folio's only source (see folioFromKicker). */
const KICKER = "07 / Skills";

export function Skills() {
  return (
    <section id="skills" className="px-6 py-16 lg:px-10 lg:py-24">
      <div className={`${GUTTER_CONTAINER} ${GUTTER_GRID}`}>
        <div aria-hidden="true" className={GUTTER_CELL}>
          <div className="lg:sticky lg:top-32">
            <Folio index={folioFromKicker(KICKER)} />
          </div>
        </div>
        <div className="relative min-w-0 lg:col-span-8">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div aria-hidden="true" className="h-[3px] w-full bg-text" />
            <div className="flex items-baseline gap-3 pt-4">
              <Kicker>{KICKER}</Kicker>
            </div>
            <h1 className="masthead-name route-title mt-3 text-text">Skills</h1>
            <p className="mt-4 max-w-[65ch] text-lead text-text">
              {skillsLede}
            </p>
            <RouteLink href="/contact" className={ACTION}>
              Ask about a specific stack
            </RouteLink>
          </motion.div>

          <div aria-hidden="true" className="mt-8 h-[3px] w-full bg-text" />

        {repos.map((group, index) => {
          const count = group.packages.length;

          return (
            <motion.section
              key={group.label}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-16 border-t border-border pt-8"
            >
              {/* Heading row: the group's place in the reading order, its name,
                  and its size in words. The rule grows to the right of them. */}
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-micro tabular-nums text-text-muted opacity-70">
                  {String(index + 1)}
                </span>
                <h2 className="text-title font-semibold text-text">
                  {group.label}
                </h2>
                <span className="text-detail text-text-muted">
                  {groupSizeNote(count)}
                </span>
              </div>

              {GROUP_NOTES[group.label] ? (
                <p className="mt-4 max-w-[65ch] text-body text-text-muted">
                  {GROUP_NOTES[group.label]}
                </p>
              ) : null}

              <ul className="mt-6 border-t border-border">
                {group.packages.map((pkg) => (
                  <li
                    key={pkg.slug}
                    className="grid grid-cols-1 gap-x-6 gap-y-1 border-b border-border py-4 sm:grid-cols-12"
                  >
                    <div className="sm:col-span-8">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <h3 className="text-body font-semibold text-text">
                          {pkg.name}
                        </h3>
                        {pkg.version === "-" ? null : (
                          <span className={CHIP}>{pkg.version}</span>
                        )}
                      </div>
                      <p className="mt-1 text-detail text-text-muted">
                        {pkg.description}.
                      </p>
                    </div>

                    <p className="text-detail font-medium text-text sm:col-span-4 sm:text-right">
                      {TIER_WORDS[pkg.tier]}
                    </p>
                  </li>
                ))}
              </ul>
            </motion.section>
          );
        })}

        <PageFoot />
        </div>
      </div>
    </section>
  );
}
