import { GROUP_NOTES, TIER_WORDS, repos, type Tier } from "../content/skills";
import { atlasLede, figures } from "../content/ledger";
import { Seam } from "./Readout";

/**
 * AtlasBand — the system atlas, set as a manifest.
 *
 * Six groups on a hairline table: the group, its count in a column of its own,
 * and its packages under three column headings that are the tiers themselves —
 * Daily driver, Production shipped, Working knowledge. The column a package
 * sits in *is* its tier, so no badge, pill, bar or legend has to encode it, and
 * the heading row makes the encoding explicit for a screen reader as well as an
 * eye.
 *
 * The count used to trail the group's note as a lone number on its own line,
 * aligned to nothing; it is now its own column under its own heading, so a
 * column of counts reads down the page. A tier with nothing in it says so with
 * an em dash rather than an empty cell — a blank reads as a loading failure, and
 * "this group has no daily-driver package" is a fact about the group.
 *
 * The group name is set in the record's heading face at a table's size: the
 * same Instrument Serif, normal weight and tracking as every claim on the page,
 * so the manifest's rows introduce themselves the way the page does.
 *
 * Every one of the packages from content/skills.ts is rendered, once, in mono at
 * 12.5px. Nothing is dropped and nothing is added: this is the list, not a
 * selection, and the band says so. On a phone the table folds into one block per
 * group, each tier block carrying its own heading, so the fold does not cost a
 * reader the tier.
 */

const TIER_ORDER: Tier[] = ["DAILY", "PROD", "WORKING"];

const GRID =
  "grid gap-x-8 gap-y-4 md:grid-cols-[minmax(0,13rem)_3.5rem_repeat(3,minmax(0,1fr))]";

export function AtlasBand() {
  return (
    <>
      <Seam />
      <section
        id="atlas"
        aria-labelledby="atlas-heading"
        className="py-[var(--rec-rhythm)] md:py-[var(--rec-rhythm-lg)]"
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
          <p className="mt-4 max-w-[var(--rec-prose-measure)] text-[color:var(--rec-ink-muted)]">
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
              <span className="data data--sm text-right text-[color:var(--rec-ink-muted)]">
                packages
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
                  <h3 className="font-display text-[1.0625rem]! leading-[1.25]! font-normal! tracking-[-0.01em]! text-[color:var(--rec-ink)]">
                    {group.label}
                  </h3>
                  <p className="mt-1 hidden max-w-[28ch] text-[0.75rem] leading-[1.45] text-[color:var(--rec-ink-muted)] md:block">
                    {GROUP_NOTES[group.label]}
                  </p>
                </div>

                <p
                  data-atlas-count
                  className="data data--sm tabular-nums text-[color:var(--rec-measure)] md:self-start md:text-right"
                >
                  {group.packages.length}
                  <span className="md:hidden"> packages</span>
                </p>

                {TIER_ORDER.map((tier) => {
                  const packages = group.packages.filter(
                    (pkg) => pkg.tier === tier,
                  );
                  return (
                    <div key={tier} data-atlas-cell>
                      <p className="data data--sm mb-1 text-[color:var(--rec-ink-muted)] md:hidden">
                        {TIER_WORDS[tier]}
                      </p>
                      <p className="font-mono text-[0.78125rem] leading-[1.6] text-[color:var(--rec-ink-muted)]">
                        {packages.length > 0 ? (
                          packages.map((pkg, position) => (
                            <span key={pkg.slug}>
                              <span data-package={pkg.slug}>{pkg.name}</span>
                              {position < packages.length - 1 ? ", " : ""}
                            </span>
                          ))
                        ) : (
                          <span
                            className="text-[color:var(--rec-ink-muted)]"
                            aria-label="no package in this tier"
                          >
                            —
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
