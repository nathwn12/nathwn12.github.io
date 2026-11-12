import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import {
  CONTACT_CTA,
  contractLine,
  measurement,
  standfirst,
  stackLine,
  statusLine,
} from "../content/ledger";
import { employer } from "../content/experience";
import { SectionLink, RouteLink } from "../lib/router";
import { motionAllowed } from "../lib/motion";
import { LatencyInstrument } from "./LatencyInstrument";

/**
 * FirstScreen — the record's cover: a claim, and the instrument that proves it.
 *
 * Three parts, one orchestration:
 *   1. The claim is hand-set on three lines and masked up line by line. The
 *      line breaks are structure, not styling: "Payment backends / that hold up
 *      under / production load." is how the sentence is meant to be read, and
 *      the first line starts at the viewport's own left edge rather than the
 *      frame's, so the block breaks the column it sits in.
 *   2. The standfirst, the stack and the availability line — the only running
 *      copy above the fold, all of it content strings.
 *   3. The instrument: the payment query before and after the provider change,
 *      with every number in the DOM (see LatencyInstrument).
 *
 * The whole sequence runs once per session and lasts about 1.4 s: display lines
 * mask up, then the copy and the actions fade in on a 60 ms stagger, then the
 * instrument boots. Nothing else on the page auto-plays, so this is the one
 * loud moment and the rest of the record stays quiet around it.
 *
 * With motion off — the OS preference or the footer's switch — the resting
 * state IS the final state: no masks, no fades, no counting. Nothing is hidden
 * by CSS and then revealed by script, so a browser that never runs a transition
 * still gets the finished cover.
 */

/** Lines in the order they are read, not in the order they fit. */
const CLAIM_LINES = ["Payment backends", "that hold up under", "production load."];

/**
 * Once per session, not once per mount: a route change back to the record
 * should not replay the cover. It is set when the sequence *finishes*, not when
 * it starts — React's development double-mount reverts a GSAP context and runs
 * the effect again, so a flag set at the start would leave the cover with no
 * animation at all on the second run.
 */
let coverPlayed = false;

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
         as following the claim rather than racing it. */
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
      className="overflow-x-clip pt-8 pb-[var(--rec-band)] md:pt-12 md:pb-[var(--rec-band-lg)]"
    >
      <div className="frame">
        <h1
          id="claim-heading"
          className="font-display text-[length:clamp(3rem,9.5vw,11rem)] leading-[0.87] font-normal! tracking-[-0.02em]! text-[color:var(--rec-ink)]"
        >
          {CLAIM_LINES.map((line, index) => (
            <span
              key={line}
              className={
                index === 0
                  ? "block overflow-hidden pb-[0.04em] min-[900px]:ml-[calc(50%-50vw)]"
                  : "block overflow-hidden pb-[0.04em]"
              }
              /* The first line starts at the viewport edge from 900px up, which
                 is where the frame's gutter is wide enough to bleed into.
                 Below that the gutter is the only margin there is, and a
                 cropped P is a defect rather than a bleed. `50% - 50vw` is exact
                 at every width: it subtracts the frame's own centring plus its
                 gutter. */
            >
              <span data-cover-line className="block">
                {line}
                {index < CLAIM_LINES.length - 1 ? " " : ""}
              </span>
            </span>
          ))}
        </h1>

        <div className="mt-8 grid gap-x-12 gap-y-10 md:mt-10 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_23rem]">
          <div>
            <p
              data-cover-fade
              className="max-w-[62ch] text-[length:var(--rec-text-lead)] leading-[var(--rec-leading-lead)] text-[color:var(--rec-ink)]"
            >
              {standfirst}
            </p>

            <p
              data-cover-fade
              className="mt-4 max-w-[62ch] text-[color:var(--rec-ink-muted)]"
            >
              {stackLine}
            </p>

            {/* The employment, stated in the past tense with the period it
                covers: the record must never read as a current role. Three
                facts, separated by rules rather than by a meta string. */}
            <p
              data-cover-fade
              className="data data--sm mt-4 flex flex-col gap-y-1 text-[color:var(--rec-ink-muted)] sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-4"
            >
              <span>{contractLine}</span>
              <span
                aria-hidden="true"
                className="hidden h-3 w-px bg-[color:var(--rec-rule-strong)] sm:inline-block"
              />
              <span>{employer.location}</span>
              <span
                aria-hidden="true"
                className="hidden h-3 w-px bg-[color:var(--rec-rule-strong)] sm:inline-block"
              />
              <span>{employer.period}</span>
            </p>

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

              <SectionLink
                section="proof"
                className="inline-flex min-h-11 items-center text-[0.875rem] font-semibold text-[color:var(--rec-ink)] underline decoration-[color:var(--rec-rule-strong)] decoration-1 underline-offset-[0.35em] transition-[color,text-decoration-color,border-color] duration-150 hover:decoration-[color:var(--rec-signal)]"
              >
                Read the record
              </SectionLink>
            </div>
          </div>

          <div data-cover-fade className="lg:pt-1">
            <LatencyInstrument />
            <p className="data data--sm mt-3 max-w-[38ch] text-[color:var(--rec-ink-muted)]">
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
