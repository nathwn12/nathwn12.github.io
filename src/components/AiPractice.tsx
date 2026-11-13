import { aiPractice } from "../content/ledger";
import { Seam } from "./Readout";

/**
 * AiPractice — the capability band: what he does with AI, as prose.
 *
 * One band, three sentences, three identifiers. It is not an inventory: no
 * repository, product or model name appears here, because a list of what ran
 * where is the public work's job (and the forward notes' at the back). The band
 * states a practice — building the tooling agents run on, working with local
 * models, running a documentation-grade assisted loop end to end — and leaves
 * the evidence to the band below it.
 *
 * The layout is the flat one the louder bands use: the label on the frame's
 * left in the heading face with the band's own three identifiers on the right,
 * then the prose in a measured column under them. Nothing is a card, a chip or
 * a badge: the register is a document, not a product page.
 */
export function AiPractice() {
  return (
    <>
      <Seam />
      <section
        id="practice"
        aria-labelledby="practice-heading"
        className="py-[var(--rec-rhythm)] md:py-[var(--rec-rhythm-lg)]"
      >
        <div className="frame">
          <div className="mt-4 grid gap-x-10 gap-y-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 lg:block">
              <h2
                id="practice-heading"
                className="font-display text-[length:var(--rec-text-claim)] leading-[var(--rec-leading-claim)] font-normal! tracking-[var(--rec-tracking-claim)]! text-[color:var(--rec-ink)]"
              >
                {aiPractice.heading}
              </h2>

              {/* Three identifiers, separated by rules rather than by middle
                  dots: the band's own readout, on the heading's line, the way
                  the atlas carries its counts. */}
              <ul className="data data--sm flex flex-wrap items-center gap-x-5 gap-y-2 text-[color:var(--rec-ink-muted)] lg:mt-4">
                {aiPractice.facts.map((fact, index) => (
                  <li
                    key={fact}
                    className={
                      index === 0
                        ? "whitespace-nowrap"
                        : "whitespace-nowrap sm:border-l sm:border-[color:var(--rec-rule)] sm:pl-5"
                    }
                  >
                    {fact}
                  </li>
                ))}
              </ul>
            </div>

            <p className="max-w-[var(--rec-prose-measure)] text-[length:var(--rec-text-lead)] leading-[var(--rec-leading-lead)] text-[color:var(--rec-ink)]">
              {aiPractice.sentences.join(" ")}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
