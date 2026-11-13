import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { proofRows } from "../content/ledger";
import { recordOpener } from "../content/hero";
import { figureParts, renderFigure, type FigureParts } from "../lib/figure";
import { motionAllowed } from "../lib/motion";
import { RouteLink } from "../lib/router";
import { Seam } from "./Readout";

/**
 * RecordBand — the real experience, first-class: the band the page exists for.
 *
 * It leads the page after the cover and opens on the sentence the old cover
 * used as a headline. That sentence is a claim, and the four outcomes under it
 * are what backs the claim — the −98% payment latency first, because it is the
 * measurement the sentence is about.
 *
 * Each outcome is one figure, one claim and one line of mechanism. No figure is
 * typed here: every row comes from `proofRows`, which derives it from the
 * delivered record (a percentage in an `outcome`, a count in `provenance`), so
 * the band cannot drift from `/experience`. A figure that cannot be derived
 * drops its row rather than printing a placeholder.
 *
 * The motion is ONE scrubbed timeline over the four figures: as the band crosses
 * the viewport each figure counts up in turn, 60 ms of overlap between one and
 * the next, from a single scroll-driven proxy. It is not four reveals — no cell
 * fades, lifts or masks itself in — because four little entrances read as a
 * festival while one count reads as a measurement being taken. With motion off
 * no trigger is created and the markup's delivered figures stand, which is also
 * what a reader with no JavaScript gets.
 *
 * What the band deliberately does not carry: the tenure (that is the cover's
 * fact row) and the recovery that produced the commit count (that is stated
 * once, on the experience route). Two bands, one company name, no closure
 * sentence above the fold.
 *
 * The link into the long form is the band's own last line — "The full record" —
 * and it is the only way out of this band, so the numbers never become a
 * navigation decision.
 */

if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Each figure's slice of the scrub, as a fraction of the whole. */
const STEP = 0.2;
/** How long one figure's count takes, as a fraction of the whole. */
const COUNT = 0.34;

const PARTS: FigureParts[] = proofRows.map((row) => figureParts(row.figure));

export function ProofBand() {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (!motionAllowed()) return;

    const figures = [
      ...list.querySelectorAll<HTMLElement>("[data-figure]"),
    ];
    if (figures.length === 0) return;

    const apply = (progress: number) => {
      figures.forEach((element, index) => {
        const parts = PARTS[index];
        if (!parts) return;
        const local = Math.min(
          1,
          Math.max(0, (progress - index * STEP) / COUNT),
        );
        element.textContent = renderFigure(parts, parts.value * local);
      });
    };

    const proxy = { t: 0 };
    /* Count once, on entry, and never rewind. A figure that changes because the
       reader scrolled is a figure that can read wrong: the owner saw "87
       commits" mid-scrub and it is not a measurement any more. It runs to its
       delivered value, then holds it for the rest of the visit. */
    const tween = gsap.to(proxy, {
      t: 1,
      duration: 1.1,
      ease: "power2.out",
      onUpdate: () => apply(proxy.t),
      scrollTrigger: {
        trigger: list,
        start: "top 85%",
        once: true,
      },
    });

    apply(0);

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <>
      <Seam />
      <section
        id="proof"
        aria-labelledby="proof-heading"
        className="py-[var(--rec-rhythm)] md:py-[var(--rec-rhythm-lg)]"
      >
        <div className="frame">
          <h2
            id="proof-heading"
            className="max-w-[26ch] font-display text-[length:var(--rec-text-claim)] leading-[var(--rec-leading-claim)] font-normal! tracking-[var(--rec-tracking-claim)]! text-[color:var(--rec-ink)]"
          >
            {recordOpener}
          </h2>

          {/* Four outcomes, one row each from `sm` up to a four-column line at
              `lg`: the figure, the claim it measures, and the move behind it.
              Every cell opens on its own hairline, so the row reads as one
              table of results rather than four cards. */}
          <ul
            ref={listRef}
            data-proof-scrub
            className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {proofRows.map((row) => (
              <li
                key={row.claim}
                className="border-t border-[color:var(--rec-rule)] pt-4"
              >
                <p
                  data-figure
                  className="font-mono text-[length:clamp(1.75rem,1.2rem+1.6vw,2.25rem)] leading-none tracking-[-0.02em] tabular-nums text-[color:var(--rec-measure)]"
                >
                  {row.figure}
                </p>
                <p className="mt-3 text-[0.9375rem] leading-[1.4] text-[color:var(--rec-ink)]">
                  {row.claim}
                </p>
                <p className="mt-1 max-w-[38ch] text-[0.8125rem] leading-[1.45] text-[color:var(--rec-ink-muted)]">
                  {row.detail}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <RouteLink
              href="/experience"
              className="data inline-flex min-h-11 items-center border-b border-[color:var(--rec-rule-strong)] text-[color:var(--rec-signal)] transition-[color,border-color] duration-150 hover:border-[color:var(--rec-signal)]"
            >
              The full record
            </RouteLink>
          </div>
        </div>
      </section>
    </>
  );
}
