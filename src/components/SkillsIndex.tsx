import { repos, TIER_WORDS, type Tier } from "../content/skills";

/**
 * Skills index (paper, on /record only): the capability behind the record.
 *
 * All 88 packages stay, in the six groups content/skills.ts already carries.
 * Presentation is the record page's own: no table, no zebra rows, no card
 * borders, no chips, no proficiency bars. The whole band is set as a run-in
 * index — group name at the left edge, every package flowing as text — and the
 * tier is carried by weight alone. The legend states the three tier words once,
 * each set in its own weight, so the key is the type and not a colour.
 *
 * `data-pkg` and `data-group` exist so the band's height and its 88 names can be
 * measured and asserted without reading the stylesheet.
 */

const TIER_CLASS: Record<Tier, string> = {
  DAILY: "pkg is-daily",
  PROD: "pkg is-prod",
  WORKING: "pkg is-working",
};

export function SkillsIndex() {
  return (
    <section
      className="skills-band field-paper"
      aria-labelledby="skills-heading"
    >
      <div className="skills-inner wrap">
        <div className="skills-head">
          <h2 id="skills-heading">Skills</h2>
          <p className="skills-legend">
            <span className={TIER_CLASS.DAILY}>{TIER_WORDS.DAILY}</span>
            <span aria-hidden="true"> · </span>
            <span className={TIER_CLASS.PROD}>{TIER_WORDS.PROD}</span>
            <span aria-hidden="true"> · </span>
            <span className={TIER_CLASS.WORKING}>{TIER_WORDS.WORKING}</span>
          </p>
        </div>

        {repos.map((group) => (
          <div className="skills-group" key={group.label} data-group={group.label}>
            <h3 className="skills-group-label">{group.label}</h3>
            <ul className="skills-run">
              {group.packages.map((pkg) => (
                <li className={TIER_CLASS[pkg.tier]} key={pkg.slug} data-pkg>
                  {pkg.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
