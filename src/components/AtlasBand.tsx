import { GROUP_NOTES, TIER_WORDS, repos, type Tier } from "../content/skills";
import { atlasLede, figures } from "../content/ledger";
import { Seam } from "./Readout";

/**
 * AtlasBand — the system atlas, set as a manifest.
 *
 * Six groups on a hairline table: the group, its count, and its packages under
 * three column headings that are the tiers themselves — Daily driver,
 * Production shipped, Working knowledge. The column a package sits in *is* its
 * tier, so no badge, pill, bar or legend has to encode it, and the heading row
 * makes the encoding explicit for a screen reader as well as an eye.
 *
 * Every one of the 88 packages from content/skills.ts is rendered, once, in
 * mono at 12.5px. Nothing is dropped and nothing is added: this is the list,
 * not a selection, and the band says so. On a phone the table folds into one
 * block per group, each tier block carrying its own heading, so the fold does
 * not cost a reader the tier.
 */

const TIER_ORDER: Tier[] = ["DAILY", "PROD", "WORKING"];

const GRID =
  "grid gap-x-8 gap-y-4 md:grid-cols-[minmax(0,12rem)_repeat(3,minmax(0,1fr))]";

export function AtlasBand() {
  return (
    <>
      <Seam />
      <section
        id="atlas"
        aria-labelledby="atlas-heading"
        className="py-[var(--rec-band)] md:py-[var(--rec-band-lg)]"
      >
        <div className="frame">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <h2
              id="atlas-heading"
              className="font-display text-[length:var(--rec-text-claim)] leading-[var(--rec-leading-claim)] font-normal! tracking-[var(--rec-tracking-claim)]! text-[color:var(--rec-ink)]"
            >
              The system atlas
            </h2>
            <p className="data data--sm text-[color:var(--rec-measure)]">
              {figures.packageCount} packages, {repos.length} groups
            </p>
          </div>
          <p className="mt-4 max-w-[62ch] text-[color:var(--rec-ink-muted)]">
            {atlasLede}
          </p>

          <div className="mt-8 border-t border-[color:var(--rec-rule)]">
            {/* The column headings are the tiers. They are field labels over
                data, not eyebrows over a heading. */}
            <div
              aria-hidden="true"
              className={`${GRID} hidden border-b border-[color:var(--rec-rule)] py-3 md:grid`}
            >
              <span className="data data--sm text-[color:var(--rec-ink-muted)]">
                group
              </span>
              {TIER_ORDER.map((tier) => (
                <span
                  key={tier}
                  className="data data--sm text-[color:var(--rec-ink-muted)]"
                >
                  {TIER_WORDS[tier]}
                </span>
              ))}
            </div>

            {repos.map((group) => (
              <div
                key={group.label}
                data-atlas-group={group.label}
                className={`atlas__group ${GRID} border-b border-[color:var(--rec-rule)] py-5`}
              >
                <div>
                  <h3 className="text-[0.9375rem]! font-semibold tracking-[-0.01em] text-[color:var(--rec-ink)]">
                    {group.label}
                  </h3>
                  <p className="mt-1 hidden max-w-[30ch] text-[0.75rem] leading-[1.45] text-[color:var(--rec-ink-muted)] md:block">
                    {GROUP_NOTES[group.label]}
                  </p>
                  <p className="data data--sm mt-2 text-[color:var(--rec-measure)] tabular-nums">
                    {group.packages.length}
                  </p>
                </div>

                {TIER_ORDER.map((tier) => (
                  <div key={tier}>
                    <p className="data data--sm mb-1 text-[color:var(--rec-ink-muted)] md:hidden">
                      {TIER_WORDS[tier]}
                    </p>
                    <p className="font-mono text-[0.78125rem] leading-[1.6] text-[color:var(--rec-ink-muted)]">
                      {group.packages
                        .filter((pkg) => pkg.tier === tier)
                        .map((pkg, position, list) => (
                          <span key={pkg.slug}>
                            <span data-package={pkg.slug}>{pkg.name}</span>
                            {position < list.length - 1 ? ", " : ""}
                          </span>
                        ))}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
