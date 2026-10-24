import { motion } from "framer-motion";
import {
  employer,
  experience,
  experienceLede,
  formerRoleLine,
  latestRecordDate,
  provenance,
  tenureEnd,
  tenureSpan,
} from "../content/experience";
import { fadeUp, staggerChild, staggerParent } from "../lib/motion";
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
 * Experience — the career record as a dated time rail.
 *
 * Authority: docs/premium-direction.md § Per-route application (Experience),
 * § Layout (resolved asymmetry), § Type; motion names from src/lib/motion
 * (frozen — never redefined here). Where this file and the direction disagree,
 * the direction wins.
 *
 * Route identity (this route's alone): ONE persistent left rail carrying the
 * date of every selected contribution, so chronology is the spine and the eye
 * travels a single vertical line down the page. That rail IS the resolved
 * asymmetry — at wide widths the column widens past the 68ch measure and each
 * date sits offset into the left gutter; below `lg` the rail collapses and the
 * date stacks above its entry. The continuous tenure is a separate labeled
 * band above the list, so the employment span can never be mistaken for one
 * more dated milestone. No other route has a left rail of its own: Skills runs
 * its rail on the right (tier), Projects ranks in a narrow numeric column.
 *
 * Rhythm: the direction's 8px base held strictly — section gaps 64px (mt-16),
 * entry gaps 32px (mt-8), text gaps 16px (mt-4). Bands are full width and
 * unboxed: a 1px Line rule, then the entry. Nothing nests.
 *
 * Emphasis is weight and position, never colour: the outcome sentence (the
 * claim) is set a step heavier than the supporting description, and the status
 * is stated in words beside its tech as Line-bordered chips. Each entry's
 * `highlights` — the concrete moves behind the outcome — render under the
 * description as Detail lines, so how the work was done sits with what it was.
 *
 * Motion: the title block rises once (fadeUp); entries walk in under
 * staggerParent with one short beat per row (staggerChild). It runs
 * unconditionally — the OS reduced-motion query no longer gates this site
 * (owner order 2026-10-14), so the ledger arrives full-length, every line
 * legible.
 *
 * States: content is imported synchronously and schema-validated at module load
 * (content/experience.ts throws on a mismatch), so this page has no loading,
 * empty, or error state of its own; the shell owns both (Suspense fallback and
 * the route error boundary in App.tsx).
 */

/* One grid, declared once: the title block and every entry share it — the
   entries pair a 3-column date rail with a 7-column record inside the
   sheet's 12. */
const RAIL = "lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-6";
const RAIL_DATE = "lg:col-span-3";
const RAIL_BODY = "lg:col-span-7";

/* The one code-adjacent convention in the system: Body family at Detail size,
   letterspacing 0, distinguished by a Line border rather than a third face. */
const CHIP =
  "inline-flex items-center rounded-xs border border-border px-2 py-1 text-detail text-text-muted";

const ACTION =
  "mt-8 inline-flex min-h-11 items-center rounded-xs text-label font-semibold text-accent-text transition-colors duration-link hover:underline";

/** The route's kicker — the folio's only source (see folioFromKicker). */
const KICKER = "06 / Experience";

export function Experience() {
  return (
    <section id="experience" className="px-6 py-16 lg:px-10 lg:py-24">
      <div className={`${GUTTER_CONTAINER} ${GUTTER_GRID}`}>
        <div aria-hidden="true" className={GUTTER_CELL}>
          <div className="lg:sticky lg:top-32">
            <Folio index={folioFromKicker(KICKER)} />
          </div>
        </div>
        <div className="relative min-w-0 lg:col-span-8">
          {/* Masthead title block: 3px bars, folio kicker, nameplate title. */}
          <div aria-hidden="true" className="h-[3px] w-full bg-text" />
          <div className={`${RAIL} pt-4`}>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className={RAIL_BODY}
            >
              <div className="flex items-baseline gap-3">
                <Kicker>{KICKER}</Kicker>
              </div>
              <h1 className="masthead-name route-title mt-3 text-text">Experience</h1>
              <p className="mt-4 max-w-[65ch] text-lead text-text">
                {experienceLede}
              </p>
              <p className="mt-4 max-w-[65ch] text-detail text-text-muted">
                {formerRoleLine}, {employer.location}.
              </p>
              <RouteLink href="/contact" className={ACTION}>
                Ask about this work
              </RouteLink>
            </motion.div>
          </div>

          <div aria-hidden="true" className="mt-8 h-[3px] w-full bg-text" />

          {/* The continuous tenure is its own labeled span, never one more
              dated record: the span runs March 2023 – May 2026 while the
              selected contributions below stop at the last shipped milestone.
              Both facts are derived from content — no milestone is implied
              for the gap. */}
          <motion.div
            data-tenure-span
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-8 border-t border-border pt-8"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="font-mono text-micro font-medium uppercase tracking-[0.14em] text-text-muted">
                Tenure
              </p>
              <p className="text-title font-semibold tabular-nums text-text">
                {tenureSpan}
              </p>
            </div>
            <p className="mt-2 max-w-[65ch] text-detail text-text-muted">
              Continuous employment at {employer.company}
            </p>
          </motion.div>

          {/* The dated list is a selection, not an exhaustive event log. */}
          <div className="mt-16 border-t border-border pt-8">
            <h2 className="text-headline font-semibold text-text">
              Selected contributions
            </h2>
            <p className="mt-2 max-w-[65ch] text-detail text-text-muted">
              {experience.length} dated records, newest first — a selection,
              not an exhaustive log. The latest is {latestRecordDate}; the
              tenure ran to {tenureEnd}.
            </p>
          </div>

        <motion.ol
          variants={staggerParent}
          initial="hidden"
          animate="visible"
          className="mt-8"
        >
          {experience.map((entry) => (
            <motion.li
              key={entry.id}
              variants={staggerChild}
              className={`mt-8 border-t border-border pt-8 ${RAIL}`}
            >
              <p className={`text-detail tabular-nums text-text-muted ${RAIL_DATE} lg:pt-1`}>
                {entry.date}
              </p>

              <div className={`mt-4 ${RAIL_BODY} lg:mt-0`}>
                <h2 className="text-title font-semibold text-text">
                  {entry.name}
                </h2>
                <p className="mt-4 max-w-[65ch] text-body font-medium text-text">
                  {entry.outcome}
                </p>
                <p className="mt-4 max-w-[65ch] text-body text-text-muted">
                  {entry.description}
                </p>
                {entry.highlights.length > 0 && (
                  <ul className="mt-4 max-w-[65ch] space-y-2">
                    {entry.highlights.map((highlight) => (
                      <li key={highlight} className="text-detail text-text-muted">
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-4 text-detail text-text-muted">
                  {entry.status}
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {entry.tech.map((item) => (
                    <li key={item} className={CHIP}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.li>
          ))}
        </motion.ol>

        <p className="mt-16 max-w-[65ch] border-t border-border pt-8 text-detail text-text-muted">
          {provenance}
        </p>

        <PageFoot />
        </div>
      </div>
    </section>
  );
}
