import { GROUP_NOTES, repos, TIER_WORDS } from "../content/skills";
import { atlasLede } from "../content/ledger";
import { Reveal } from "./Reveal";

/**
 * AtlasBand — the system atlas, as a scannable band instead of 88 rows.
 *
 * Each of the six groups is one block: its name, its one-line note, and every
 * package in the group as a single flowing run. Tier is carried by weight —
 * a daily driver is set in the full ink at semibold, everything else in the
 * muted tone — and stated in words once in the lede. That is 88 packages in
 * roughly one screen instead of the 9,388px table the old route shipped.
 *
 * The package names are the content; versions are release metadata, and the
 * band is a map of what he works in, not a dependency manifest. Nothing is
 * hidden: every group and every package from content/skills.ts renders.
 */
export function AtlasBand() {
  return (
    <section id="atlas" className="band" aria-labelledby="atlas-heading">
      <div className="frame">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
            <h2 id="atlas-heading" className="h2">
              The system atlas
            </h2>
            <p className="meta muted max-w-[42ch]">
              {TIER_WORDS.DAILY} in bold. {TIER_WORDS.PROD} and{" "}
              {TIER_WORDS.WORKING} in the lighter tone.
            </p>
          </div>
          <p className="prose mt-4">{atlasLede}</p>
        </Reveal>

        <div className="mt-8 lg:mt-10">
          <div className="atlas">
            {repos.map((group, index) => (
              <Reveal key={group.label} delayMs={index * 40}>
                <div className="atlas__group" data-atlas-group={group.label}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3>{group.label}</h3>
                    <span className="meta muted tnum">
                      {group.packages.length}
                    </span>
                  </div>
                  <p className="atlas__note meta muted mt-1">
                    {GROUP_NOTES[group.label]}
                  </p>
                  <p className="atlas__packages">
                    {group.packages.map((pkg, position) => (
                      <span key={pkg.slug} data-package={pkg.slug}>
                        {pkg.tier === "DAILY" ? <b>{pkg.name}</b> : pkg.name}
                        {position < group.packages.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
