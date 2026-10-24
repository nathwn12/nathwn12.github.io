import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  bandEnter,
  bandStaggerParent,
  fadeUp,
  usePrefersReducedMotion,
} from "../lib/motion";
import { BandRule } from "./BandRule";

/**
 * Broadsheet — the shared printed-sheet grammar for every band and route
 * title block (2026-10-21; responsive measures 2026-10-21).
 *
 * One sheet container (`.sheet` in src/index.css: the viewport minus a fluid
 * `clamp(1.5rem, 4vw, 3rem)` gutter per side, capped at 80rem — 96rem at
 * 1600px+, where ALL added width lands in the outer grid columns and gaps
 * while text columns keep their ch measures) split at `lg` into a real
 * 12-column
 * grid: a 2-column folio margin carrying the oversized section numeral
 * (clipped by the column edge), a content column whose span varies per band
 * (7 / 8 / 5 — never the same centred column twice running), and the
 * remaining columns carrying marginalia or clear paper. Below `lg` the grid
 * collapses and the kicker alone carries the number — no separate inline
 * folio renders, so the numeral can never print twice.
 *
 * The page frame owns the 3px ink bar: masthead top and under-name, the
 * printed strip's edges, the route nameplates, and the end-of-page foot. A
 * band opens on that same ink at hairline weight — one 1px rule at the
 * container width, never viewport-bleed — so eight bands read as one paper,
 * not eight competing bars. Prose keeps its 60–72ch measure inside its own
 * column, however wide the column is.
 *
 * Short viewports compress through `.band-top`/`.band-grid` (src/index.css):
 * type steps down and rhythm loses a quarter — nothing hides, order holds.
 *
 * Authority: docs/premium-direction.md §§ Type/Layout/Motion.
 */

/** The sheet measure — a large-format page, not a centred column. `.sheet`
    (src/index.css) is the viewport minus the fluid `--sheet-gutter` per side,
    capped at 80rem (96rem at 1600px+). `mx-auto` stays on the constant: the
    instrument-panel test reads it off the DOM. */
export const GUTTER_CONTAINER = "sheet mx-auto";

/** The 12-column grid at `lg`; single column below. `.sheet-grid` widens the
    column gap at 1600px+ so added width lands in gaps and outer columns —
    text columns keep their ch measures. The `lg` breakpoint never moves. */
export const GUTTER_GRID = "sheet-grid lg:grid lg:grid-cols-12 lg:gap-x-6";

/** The folio margin: numeral only, clipped by its own column edge. */
export const GUTTER_CELL =
  "hidden overflow-hidden lg:block lg:col-span-2";

/** Default content cell; BandShell overrides the span per band. */
export const CONTENT_CELL = "relative min-w-0 lg:col-span-7";

/** The folio numeral for a band, derived from the band's own kicker —
 *  the leading number before the slash (e.g. "03" from "03 / System atlas").
 *  The folio is never passed, indexed, or counted separately, so the margin
 *  numeral and the kicker cannot diverge. Throws on a kicker with no leading
 *  number, so a bad kicker fails loudly instead of printing a wrong folio. */
export function folioFromKicker(kicker: string): string {
  const match = kicker.match(/^(\d{2})\s*\//);
  if (!match) {
    throw new Error(
      `folioFromKicker: kicker carries no leading folio number: ${JSON.stringify(kicker)}`,
    );
  }
  return match[1];
}

/** Oversized folio numeral — decorative; the kicker carries the meaning. */
export function Folio({ index }: { index: string }) {
  return (
    <span aria-hidden="true" className="folio-numeral block">
      {index}
    </span>
  );
}

/** Gutter index kept for route gutters that name their own folio. */
export function GutterIndex({ index }: { index: string }) {
  return (
    <span
      aria-hidden="true"
      className="block text-right font-mono text-micro tabular-nums text-text-muted"
    >
      {index}
    </span>
  );
}

/** Editorial kicker: mono, micro, wide tracking, muted. The kicker OWNS the
    band's number ("01 / Experience") and is the numeral's only source below
    `lg` — no separate inline folio renders beside it, so the number prints
    exactly once at narrow widths. A span (not a paragraph) so title blocks
    can lay it out without nesting a paragraph inside a paragraph. */
export function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-micro font-medium uppercase tracking-[0.14em] text-text-muted">
      {children}
    </span>
  );
}

/** Marginalia: small mono notes in the outer margin, `lg` only. A span so it
    never forms a paragraph-in-paragraph where it is laid out. */
export function Marginalia({ children }: { children: ReactNode }) {
  return <span className="marginalia block">{children}</span>;
}

/** The hairline under a heading: exactly the content column, never wider. */
export function ColumnRule() {
  return (
    <div aria-hidden="true" className="mt-6 border-t border-border" />
  );
}

/** The band's opening rule: one hairline of the page's ink, exactly the
    container width. The 3px bar belongs to the frame only (owner review
    2026-10-24: eight identical heavy bars competed with the masthead), so the
    weight is declared HERE as `h-px` — the markup is the single source of
    truth and no rule in src/index.css re-heights `[data-band-rule]`.
    tests/instrument-panel.test.tsx fails if the two ever disagree. */
export function BandTopRule() {
  return (
    <div
      aria-hidden="true"
      data-band-rule=""
      className="h-px w-full bg-text"
    />
  );
}

/** Content span per band: 7 / 8 / 5 rotate so no two bands match. */
function contentSpan(band: number): string {
  const spans = ["lg:col-span-7", "lg:col-span-8", "lg:col-span-5"];
  return spans[((band % spans.length) + spans.length) % spans.length];
}

/** Margin span fills the row: folio (2) + content + margin = 12. */
function marginSpan(band: number): string {
  const spans = ["lg:col-span-3", "lg:col-span-2", "lg:col-span-5"];
  return spans[((band % spans.length) + spans.length) % spans.length];
}

interface BandShellProps {
  /** Band kicker, e.g. "01 / Experience" — the folio's only source. */
  kicker: string;
  /** Band heading — every content string stays verbatim. */
  title: string;
  /** Label target for the band's section. */
  headingId: string;
  /** Document-order position driving span rotation and stagger delay. */
  band: number;
  /** Small mono notes for the outer margin (`lg` only). */
  marginalia?: ReactNode;
  /**
   * Content-column span override, e.g. `"lg:col-span-10"`. The rotation in
   * {@link contentSpan} keeps every band asymmetric by default; the atlas
   * takes the wide column (7–8 of 12) so its diagram dominates the band.
   */
  contentClass?: string;
  children: ReactNode;
}

/**
 * One broadsheet band: hairline opening rule, folio margin, asymmetric content
 * column, optional marginalia. The band arrives whole (0.98 → 1) while its
 * children keep their own stagger — mass, not slide.
 */
export function BandShell({
  kicker,
  title,
  headingId,
  band,
  marginalia,
  contentClass,
  children,
}: BandShellProps) {
  const reduceMotion = usePrefersReducedMotion();
  /* The margin numeral is derived from this band's own kicker — the two can
     never diverge, and no index, length, or hardcode feeds it. */
  const folio = folioFromKicker(kicker);

  return (
    <section aria-labelledby={headingId} className="relative">
      <div className={`${GUTTER_CONTAINER} sheet-pad`}>
        <div className="band-top">
          <BandTopRule />
        </div>
        <motion.div
          initial={reduceMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-15% 0px" }}
          variants={bandEnter}
        >
          <div className={`${GUTTER_GRID} band-grid`}>
            <div aria-hidden="true" className={GUTTER_CELL}>
              <div className="lg:sticky lg:top-32">
                <Folio index={folio} />
              </div>
            </div>

            <div className={`relative min-w-0 ${contentClass ?? contentSpan(band)}`}>
              <BandRule reduced={reduceMotion} />
              <motion.div
                initial={reduceMotion ? "visible" : "hidden"}
                whileInView="visible"
                viewport={{ once: true, margin: "-15% 0px" }}
                variants={bandStaggerParent(band)}
              >
                <motion.div variants={fadeUp}>
                  <div className="flex items-baseline gap-3">
                    <Kicker>{kicker}</Kicker>
                  </div>
                </motion.div>
                <motion.h2
                  id={headingId}
                  variants={fadeUp}
                  className="mt-3 font-display text-headline font-semibold text-text text-balance"
                >
                  {title}
                </motion.h2>
                <ColumnRule />
                {children}
              </motion.div>
            </div>

            {marginalia ? (
              <aside
                aria-label="Marginal notes"
                className={`hidden min-w-0 flex-col gap-6 lg:flex ${marginSpan(band)}`}
              >
                <div className="border-t border-border pt-3">{marginalia}</div>
              </aside>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
