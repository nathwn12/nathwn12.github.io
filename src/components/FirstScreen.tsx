import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import {
  CONTACT_CTA,
  locatedIn,
  measurement,
  standfirst,
  statusLine,
} from "../content/ledger";
import { employer, tenureSpan } from "../content/experience";
import { SectionLink, RouteLink } from "../lib/router";
import { motionAllowed } from "../lib/motion";
import { HeroField } from "./HeroField";
import { LatencyInstrument } from "./LatencyInstrument";

/**
 * FirstScreen — the cover: who this is, then the instrument that proves it.
 *
 * The page opens on identity, not on a claim. Three display lines state the
 * role, the platform and the record's one date fact; the standfirst names the
 * employer once and what the work was; the fact row states the span, the mode
 * and the country as three hairline-separated cells. The four numbers the work
 * measured are the next band's job — a cover that opens on figures makes a
 * reader do the arithmetic before they know whose figures they are.
 *
 * Three parts, one orchestration:
 *   1. The display lines are hand-set and masked up line by line. The breaks
 *      are structure, not styling. All three lines start on the frame's own
 *      left edge — the block is measured, not bled: one line hanging 112px
 *      outside its siblings is a crop, not a decision.
 *   2. The standfirst, the fact row and the availability line — the only
 *      running copy above the fold, all of it content strings.
 *   3. The instrument: the payment query before and after the provider change,
 *      scrubbed by scroll, with every number in the DOM (see LatencyInstrument).
 *
 * The cover is a viewport tall at a desktop width, and the instrument column is
 * `position: sticky` inside it: the measurement holds under the bar while its
 * bars travel, so the scrub's payoff lands on screen instead of while the panel
 * is leaving. The actions sit under the status line rather than on the column's
 * bottom edge — with the cover held open for the scrub, a bottom-aligned action
 * row fell below the fold.
 *
 * The whole sequence runs once per session and lasts about 1.4 s: display lines
 * mask up, then the copy and the actions fade in on a 60 ms stagger. Nothing
 * else on the page auto-plays, so this is the one loud moment.
 *
 * With motion off — the OS preference or the footer's switch — the resting
 * state IS the final state: no masks, no fades, no counting. Nothing is hidden
 * by CSS and then revealed by script, so a browser that never runs a transition
 * still gets the finished cover.
 */

/** Lines in the order they are read, not in the order they fit. */
const IDENTITY_LINES = [
  "Software developer.",
  "C# and .NET,",
  "in production since 2023.",
];

/**
 * Once per session, not once per mount: a route change back to the record
 * should not replay the cover. It is set when the sequence *finishes*, not when
 * it starts — React's development double-mount reverts a GSAP context and runs
 * the effect again, so a flag set at the start would leave the cover with no
 * animation at all on the second run.
 */
let coverPlayed = false;

/** The three facts under the standfirst. The span is read off the employment
 *  record's own period string, so the hero cannot drift from `/experience`. */
const FACTS = [tenureSpan, employer.location, locatedIn];

export function FirstScreen() {
  const coverRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const cover = coverRef.current;
      if (!cover) return;
      if (!motionAllowed() || coverPlayed) return;

      const lines = cover.querySelectorAll<HTMLElement>("[data-cover-line]");
      const fades = cover.querySelectorAll<HTMLElement>("[data-cover-fade]");

      const sequence = gsap.timeline({
        onComplete: () => {
          coverPlayed = true;
        },
      });

      sequence.from(
        lines,
        { yPercent: 110, duration: 0.9, stagger: 0.09, ease: "power3.out" },
        0,
      );

      /* 60 ms apart, after the second line has started to land: the copy reads
         as following the identity rather than racing it. */
      sequence.from(
        fades,
        {
          opacity: 0,
          y: 12,
          duration: 0.6,
          stagger: 0.06,
          ease: "power2.out",
        },
        0.34,
      );
    },
    { scope: coverRef, dependencies: [] },
  );

  return (
    <section
      ref={coverRef}
      data-band="cover"
      aria-labelledby="claim-heading"
      className="relative isolate overflow-x-clip pt-8 pb-[var(--rec-rhythm)] md:pt-12 md:pb-[var(--rec-rhythm-lg)] lg:flex lg:flex-col"
    >
      {/* The current behind the type. `isolate` keeps the canvas in this
          section's stacking context, so `-z-10` puts it above the ground and
          below every word, and the grain overlay (z 60, fixed) still reads
          above it. */}
      <HeroField />

      <div className="frame lg:flex lg:flex-1 lg:flex-col">
        <h1
          id="claim-heading"
          className="font-display text-[length:clamp(2.6rem,9.5vw,8.5rem)] leading-[0.87] font-normal! tracking-[-0.02em]! text-[color:var(--rec-ink)]"
        >
          {IDENTITY_LINES.map((line) => (
            <span
              key={line}
              /* Every line shares the frame's left edge. The display size is
                 already the widest thing on the page; bleeding one line past
                 the other two cropped a glyph and read as a mistake, so the
                 three lines are the block, and the block is the frame. */
              className="block overflow-hidden pb-[0.04em]"
            >
              <span data-cover-line className="block">
                {line}
              </span>
            </span>
          ))}
        </h1>

        <div className="mt-8 grid gap-x-12 gap-y-10 md:mt-10 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="flex flex-col">
            <p
              data-cover-fade
              className="max-w-[var(--rec-prose-measure)] text-[length:var(--rec-text-lead)] leading-[var(--rec-leading-lead)] text-[color:var(--rec-ink)]"
            >
              {standfirst}
            </p>

            {/* Three facts, separated by rules rather than by a meta string.
                The span is a closed range that matches the employment record —
                the company made it to May 2026 — so nothing here can read as a
                current role, and no duration is spelled out in words. */}
            <ul
              data-cover-fade
              className="data data--sm mt-5 grid gap-y-2 border-t border-[color:var(--rec-rule)] pt-3 text-[color:var(--rec-ink-muted)] sm:grid-cols-3 sm:gap-x-5 sm:gap-y-0"
            >
              {FACTS.map((fact, index) => (
                <li
                  key={fact}
                  className={
                    index === 0
                      ? ""
                      : "sm:border-l sm:border-[color:var(--rec-rule)] sm:pl-5"
                  }
                >
                  {fact}
                </li>
              ))}
            </ul>

            <p
              data-cover-fade
              className="data mt-6 text-[color:var(--rec-measure)]"
            >
              {statusLine}
            </p>

            <div
              data-cover-fade
              className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3"
            >
              <SectionLink
                section="contact"
                data-magnetic
                className="inline-flex min-h-11 items-center bg-[color:var(--rec-signal)] px-6 text-[0.875rem] font-semibold text-[color:var(--rec-ground)] no-underline transition-opacity duration-150 hover:opacity-90"
              >
                {CONTACT_CTA}
              </SectionLink>

              {/* The text action carries its rule on the box's bottom edge, so
                  the underlined action and the filled block close on the same
                  line and share one baseline. A text-decoration sits 0.35em
                  above that edge and pulls the link's optical bottom a line
                  clear of the block beside it. */}
              <SectionLink
                section="proof"
                className="inline-flex min-h-11 items-center border-b border-[color:var(--rec-rule-strong)] text-[0.875rem] font-semibold text-[color:var(--rec-ink)] transition-[color,border-color] duration-150 hover:border-[color:var(--rec-signal)]"
              >
                Read the record
              </SectionLink>
            </div>
          </div>

          <div
            data-cover-fade
            data-instrument-panel
            className="lg:self-start lg:pt-1"
          >
            <LatencyInstrument />
            <p className="data data--sm mt-3 max-w-[46ch] text-[color:var(--rec-ink-muted)]">
              <RouteLink
                href="/experience"
                className="underline decoration-[color:var(--rec-rule-strong)] decoration-1 underline-offset-[0.3em] transition-[color,text-decoration-color,border-color] duration-150 hover:text-[color:var(--rec-signal)]"
              >
                {measurement.provenance}
              </RouteLink>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
