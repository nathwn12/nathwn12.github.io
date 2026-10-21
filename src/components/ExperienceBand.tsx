import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { employer, experience, provenance } from "../content/experience";
import {
  railRule,
  staggerChild,
  staggerParent,
  usePrefersReducedMotion,
} from "../lib/motion";
import { RouteLink } from "../lib/router";
import { BandRule } from "./BandRule";
import { BandShell } from "./InstrumentBand";

/**
 * ExperienceBand — the landing's front: the real backend career, directly
 * after the stack seam and before any open-source work.
 *
 * The route's dated rail (Experience.tsx), adapted to the landing: the tenure
 * in words, stated once above the rail, then one rail row per outcome with a
 * 12px mono uppercase label in the rail column and the outcome in the content
 * column. Every row's figure renders at 24px semibold inside its own
 * sentence — the payments percentage lifted onto its own line (its
 * description carries no percentage), the data-access reduction, the
 * security finding count, and the commit-ledger total emphasized in place —
 * with the entry's sentence as the supporting line; the delivery row renders
 * the imported `provenance` line only. No figure is ever doubled. Every string is
 * read from src/content/experience.ts — this file formats and sequences, it
 * never authors a fact. A required entry that is absent renders its row as a
 * plain line stating the record is unavailable, never a silent empty gap.
 *
 * Authority: docs/premium-direction.md § Landing, § Layout, § Type,
 * § Hard-ban list.
 */

const payments = experience.find((entry) => entry.id === "02");
const dataAccess = experience.find((entry) => entry.id === "04");
const auth = experience.find((entry) => entry.id === "03");
const ledger = experience.find((entry) => entry.id === "01");

/** The band's one dominant figure, lifted out of the payments sentence. */
function dominantFigure(outcome: string): string | null {
  const match = outcome.match(/\d[\d,]*(?:\.\d+)?%/);
  return match ? match[0] : null;
}

/** A row's figure, emphasized inside its own sentence: the matched substring
    renders at 24px semibold while the sentence keeps every word in order, so
    the number appears exactly once (no doubled figures) and the sentence is
    never rewritten around it. */
function emphasized(sentence: string, mark: string): ReactNode {
  const at = sentence.indexOf(mark);
  if (at < 0) return sentence;
  return (
    <>
      {sentence.slice(0, at)}
      <span className={FIGURE}>{mark}</span>
      {sentence.slice(at + mark.length)}
    </>
  );
}

/** The lifted figure's treatment: 24px semibold, dominant over its own
    sentence — every row's number reads before its words. */
const FIGURE =
  "text-[1.5rem] leading-[1.1] font-semibold tabular-nums tracking-tight text-text";

/** The rail label's treatment: 12px mono uppercase muted — never the value. */
const RAIL_LABEL =
  "font-mono text-micro uppercase tracking-[0.14em] text-text-muted lg:pt-1";

const ACTION =
  "inline-flex min-h-11 items-center rounded-xs text-label font-semibold text-accent-text transition-colors duration-link hover:underline";

export function ExperienceBand({ marginalia }: { marginalia?: ReactNode }) {
  const figure = payments ? dominantFigure(payments.outcome) : null;
  /* Reduced motion: no rule draw, no stagger delay — the record stands
     complete on first paint instead of walking in. */
  const reduceMotion = usePrefersReducedMotion();

  return (
    <BandShell
      kicker="01 / Experience"
      title="Backend experience"
      headingId="experience-band-heading"
      band={0}
      marginalia={marginalia}
    >
      <motion.p
        variants={staggerChild}
        className="mt-4 max-w-[65ch] text-lead text-text"
      >
        {employer.role}, {employer.company}, {employer.location},{" "}
        {employer.period}.
      </motion.p>

      <motion.ol variants={staggerParent} className="mt-8">
        <motion.li
          variants={staggerChild}
          className="grid gap-x-6 lg:grid-cols-[7rem_minmax(0,1fr)]"
        >
          <p className={RAIL_LABEL}>
            Payments
          </p>
          <div className="min-w-0">
            {payments ? (
              <>
                {figure && (
                  <p className={FIGURE}>
                    {figure}
                  </p>
                )}
                <p className="mt-4 max-w-[65ch] text-body text-text">
                  {payments.description}
                </p>
              </>
            ) : (
              <p className="max-w-[65ch] text-body text-text">
                The payments record is unavailable.
              </p>
            )}
          </div>
        </motion.li>

        <motion.li
          variants={staggerChild}
          className="relative mt-4 grid gap-x-6 border-t border-border pt-4 lg:grid-cols-[7rem_minmax(0,1fr)]"
        >
          <BandRule variants={railRule(0)} reduced={reduceMotion} />
          <p className={RAIL_LABEL}>
            Data access
          </p>
          <div className="min-w-0">
            {dataAccess ? (
              <p className="max-w-[65ch] text-body text-text">
                {emphasized(dataAccess.outcome, "over 40%")}
              </p>
            ) : (
              <p className="max-w-[65ch] text-body text-text">
                The data-access record is unavailable.
              </p>
            )}
          </div>
        </motion.li>

        <motion.li
          variants={staggerChild}
          className="relative mt-4 grid gap-x-6 border-t border-border pt-4 lg:grid-cols-[7rem_minmax(0,1fr)]"
        >
          <BandRule variants={railRule(1)} reduced={reduceMotion} />
          <p className={RAIL_LABEL}>
            Security
          </p>
          <div className="min-w-0">
            {auth ? (
              <p className="max-w-[65ch] text-body text-text">
                {emphasized(auth.outcome, "zero")}
              </p>
            ) : (
              <p className="max-w-[65ch] text-body text-text">
                The authentication record is unavailable.
              </p>
            )}
          </div>
        </motion.li>

        <motion.li
          variants={staggerChild}
          className="relative mt-4 grid gap-x-6 border-t border-border pt-4 lg:grid-cols-[7rem_minmax(0,1fr)]"
        >
          <BandRule variants={railRule(2)} reduced={reduceMotion} />
          <p className={RAIL_LABEL}>
            Delivery
          </p>
          <div className="min-w-0">
            {ledger ? (
              <p className="max-w-[65ch] text-body text-text">
                {emphasized(provenance, "1,182")}
              </p>
            ) : (
              <p className="max-w-[65ch] text-body text-text">
                The ledger record is unavailable.
              </p>
            )}
          </div>
        </motion.li>

        <motion.li
          variants={staggerChild}
          className="relative mt-4 grid gap-x-6 border-t border-border pt-4 lg:grid-cols-[7rem_minmax(0,1fr)]"
        >
          <BandRule variants={railRule(3)} reduced={reduceMotion} />
          <p className={RAIL_LABEL}>
            Record
          </p>
          <div className="min-w-0">
            <RouteLink
              href="/experience"
              data-nav-item
              className={ACTION}
            >
              Full record →
            </RouteLink>
          </div>
        </motion.li>
      </motion.ol>
    </BandShell>
  );
}
