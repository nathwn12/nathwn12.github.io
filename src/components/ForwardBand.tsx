import { forward, forwardHeading } from "../content/forward";
import { forwardLede } from "../content/ledger";
import { Seam } from "./Readout";

/**
 * ForwardBand — the exhale between two loud sections.
 *
 * Five items on a hairline list, each carrying its kind as a mono label — feat,
 * workflow, learning — so the register is read before the sentence is. There is
 * no card, no icon, no tile: the items are separated by a rule and by nothing
 * else, and the tech identifiers are set as a mono run with commas rather than
 * as chips or a middle-dot string.
 *
 * This band is deliberately quiet. The atlas above it is a manifest and the
 * contact band below it is the close; a third loud surface here would leave the
 * page with no rests.
 */

export function ForwardBand() {
  return (
    <>
      <Seam />
      <section
        id="forward"
        aria-labelledby="forward-heading"
        className="pt-[var(--rec-rhythm)] pb-0 md:pt-[var(--rec-rhythm-lg)]"
      >
        <div className="frame">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
            <h2
              id="forward-heading"
              className="font-display text-[length:var(--rec-text-title)] leading-[var(--rec-leading-title)] font-normal! tracking-[var(--rec-tracking-claim)]! text-[color:var(--rec-ink)]"
            >
              {forwardHeading}
            </h2>
            <p className="max-w-[46ch] text-[0.9375rem] leading-[1.5] text-[color:var(--rec-ink-muted)]">
              {forwardLede}
            </p>
          </div>

          <ul className="mt-8 border-t border-[color:var(--rec-rule)]">
            {forward.map((item) => (
              <li
                key={item.id}
                className="grid gap-x-8 gap-y-2 border-b border-[color:var(--rec-rule)] py-5 last:border-b-0 md:grid-cols-[7rem_minmax(0,1fr)]"
              >
                <p className="data data--sm pt-1 text-[color:var(--rec-signal)]">
                  {item.section}
                </p>
                <div>
                  <h3 className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-[color:var(--rec-ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-1 max-w-[var(--rec-prose-measure)] text-[color:var(--rec-ink-muted)]">
                    {item.body}
                  </p>
                  <p className="data data--sm mt-3 text-[color:var(--rec-ink-muted)]">
                    {item.tech.join(", ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
