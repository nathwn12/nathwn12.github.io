import type { CSSProperties } from "react";
import { CommitField } from "./CommitField";
import { countWords } from "../content/projects";
import {
  experience,
  experienceMarginalia,
  provenance,
  type ExperienceEntry,
} from "../content/experience";
import { RouteLink } from "../lib/router";

/** The four rows the cover spends: the two measured wins, the security work,
    and the release pipeline. Selection only; the full record is /record. */
const LEDGER_IDS = ["02", "04", "03", "07"] as const;

const ledgerEntries = LEDGER_IDS.map((id) =>
  experience.find((entry) => entry.id === id),
).filter((entry): entry is ExperienceEntry => Boolean(entry));

const reveal = (delay: number): CSSProperties =>
  ({ "--d": `${delay}ms` }) as CSSProperties;

/**
 * The record band (ink): the recovered commit field, its provenance, and four
 * ledger rows. The field is the site's only image and is drawn from the real
 * 1,182 total; the caption, not the pixels, carries the fact.
 */
export function RecordBand() {
  return (
    <section className="record-band field-ink" aria-labelledby="record-heading">
      <div className="wrap">
        <div className="record-head">
          <h2 className="head" id="record-heading" data-reveal>
            The record
          </h2>
          <p className="lede" data-reveal style={reveal(80)}>
            {experienceMarginalia}
          </p>
        </div>

        <figure className="commit-figure">
          <CommitField />
          <figcaption>
            <strong>One mark, one commit.</strong>{" "}
            <span className="prov">{provenance}</span>
          </figcaption>
        </figure>

        <ol className="ledger">
          {ledgerEntries.map((entry) => (
            <li key={entry.id}>
              <RouteLink href="/record">
                <span className="date">{entry.date}</span>
                <span>
                  <span className="name">{entry.name}</span>
                  <span className="outcome">{entry.outcome}</span>
                </span>
                <span className="status">{entry.status}</span>
              </RouteLink>
            </li>
          ))}
        </ol>

        <p className="record-more">
          <RouteLink className="text-link" href="/record">
            Read all {countWords(experience.length)} entries
          </RouteLink>
        </p>
      </div>
    </section>
  );
}
