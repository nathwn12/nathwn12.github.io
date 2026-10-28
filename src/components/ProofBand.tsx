import { proofRows } from "../content/ledger";
import { Reveal } from "./Reveal";

/**
 * ProofBand — the record's measurements, one row per claim.
 *
 * Every row is the same shape: the claim and its supporting detail on the left,
 * the figure hard right on one numeric edge, so four different results can be
 * compared by eye. On a phone the figure shares the claim's line instead of
 * taking one of its own, which is what keeps four rows inside one screen.
 *
 * The figures are derived in src/content/ledger.ts from the delivered record; a
 * figure that cannot be derived drops its row rather than printing a
 * placeholder. There is no table, no header row and no stripe: rows sit apart by
 * space alone.
 */
export function ProofBand() {
  return (
    <section id="proof" className="band" aria-labelledby="proof-heading">
      <div className="frame">
        <Reveal>
          <h2 id="proof-heading" className="h2 max-w-[24ch]">
            What the record shows
          </h2>
        </Reveal>

        <div className="mt-6 lg:mt-10">
          {proofRows.map((row, index) => (
            <Reveal key={row.claim} delayMs={index * 50}>
              <div className="record-row">
                <h3 className="record-row__claim text-[1.0625rem] leading-snug font-semibold tracking-[-0.01em]">
                  {row.claim}
                </h3>
                <p className="record-row__figure">{row.figure}</p>
                <p className="record-row__detail prose">{row.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
