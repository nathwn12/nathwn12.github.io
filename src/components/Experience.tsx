import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  employer,
  experience,
  experienceLede,
  formerRoleLine,
  latestRecordDate,
  provenance,
  tenureEnd,
  tenureSpan,
  type ExperienceEntry,
} from "../content/experience";
import { CONTACT_CTA, figures, percentIn } from "../content/ledger";
import { RouteLink, SectionLink } from "../lib/router";
import { revealLines, revealRule } from "../lib/motion";
import { Timeline, TimelineReadout, type TimelineFigure, type TimelineItem } from "./Timeline";

/**
 * Experience — the production record, in the order it happened.
 *
 * The route is a flight log: the tenure stated once at the top as a readout,
 * the commit ledger above the list as the reason the page exists, then the nine
 * dated entries hanging off one continuous rule. The date is the spine and the
 * sequence is time, so no entry is numbered.
 *
 * Each row states the outcome as its heading, the mechanism under it, and the
 * figure the outcome itself carries — where there is one. The figure is parsed
 * out of the entry's own sentence rather than typed into this file, so a row's
 * number cannot drift from the claim above it, and an entry with no measured
 * result gets no figure at all instead of an invented one.
 *
 * The delivered sentences stay word for word: the home page rewrites, this page
 * quotes. Xentra is stated as former employment throughout — the company closed
 * in May 2026 — and the closing note is the provenance of the numbers above it.
 */

/** The measured value an entry's own outcome sentence carries, or nothing. */
function figureFor(entry: ExperienceEntry): TimelineFigure | null {
  const commits = entry.outcome.match(/([\d,]+)\s+commits\b/);
  if (commits) {
    return {
      value: Number(commits[1].replace(/,/g, "")),
      format: (value) => Math.round(value).toLocaleString("en-US"),
    };
  }

  if (/\bzero\b[^.]*\bfindings\b/i.test(entry.outcome)) {
    return {
      value: 0,
      format: (value) => Math.round(value).toString(),
    };
  }

  const percent = percentIn(entry.outcome);
  const run = percent?.match(/[\d,.]+/)?.[0];
  if (!percent || !run) return null;

  return {
    value: Number(run.replace(/,/g, "")),
    format: (value) => percent.replace(run, Math.round(value).toString()),
  };
}

const items: TimelineItem[] = experience.map((entry) => ({
  id: entry.id,
  date: entry.date,
  name: entry.name,
  status: entry.status,
  outcome: entry.outcome,
  description: entry.description,
  highlights: entry.highlights,
  figure: figureFor(entry),
}));

/** The ledger's figures, read back out of the provenance string. */
const commits = figures.commits
  ? Number(figures.commits.replace(/,/g, ""))
  : null;
const repositories = figures.repositories
  ? Number(figures.repositories.replace(/,/g, ""))
  : null;

const grouped = (value: number) => Math.round(value).toLocaleString("en-US");
const plain = (value: number) => Math.round(value).toString();

export function Experience() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const seamRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const title = revealLines(titleRef.current, { delay: 0.05 });
      const seam = revealRule(seamRef.current);
      return () => {
        title.revert();
        seam.revert();
      };
    },
    { dependencies: [] },
  );

  return (
    <>
      <section className="band band--first" aria-labelledby="experience-heading">
        <div className="frame">
          <div className="grid gap-y-10 lg:grid-cols-12 lg:gap-x-10">
            <div className="lg:col-span-8">
              <h1
                ref={titleRef}
                id="experience-heading"
                className="font-display text-[clamp(2.75rem,1.4rem+5.4vw,6.5rem)] leading-[0.9] tracking-[-0.02em]"
              >
                Experience
              </h1>
              <p className="lede mt-6 max-w-[46ch] text-[color:var(--rec-ink-muted)]">
                {experienceLede}
              </p>
            </div>

            {/* The tenure is its own readout, outside the dated list, so the
                employment period can never be read as one more shipped
                milestone: the newest dated entry is November 2025 and the
                tenure ran to May 2026. */}
            <div className="lg:col-span-3 lg:col-start-10">
              <div
                data-tenure-span
                className="grid gap-y-5 border-t border-[color:var(--rec-rule)] pt-4"
              >
                <div className="grid gap-y-1">
                  <p className="data text-[color:var(--rec-ink-muted)]">Tenure</p>
                  <p className="data tnum text-[color:var(--rec-ink)]">
                    {tenureSpan}
                  </p>
                </div>

                <div className="grid gap-y-1">
                  <p className="data text-[color:var(--rec-ink-muted)]">Location</p>
                  <p className="data text-[color:var(--rec-ink)]">
                    {employer.location}
                  </p>
                </div>

                <p className="text-[0.9375rem] leading-[1.5] text-[color:var(--rec-ink-muted)]">
                  {formerRoleLine}
                </p>
              </div>
            </div>
          </div>

          <span ref={seamRef} aria-hidden="true" className="rule rule--draw mt-10 lg:mt-12" />

          {/* The commit ledger: why the page exists, above the list it proves.
              The seam above is the strip's top rule; this block closes on its
              own bottom rule, so the strip never draws two rules 1px apart. */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 border-b border-[color:var(--rec-rule)] py-7 md:grid-cols-[repeat(2,auto)_minmax(0,1fr)] md:gap-x-12 md:items-baseline">
            {commits !== null && (
              <TimelineReadout value={commits} format={grouped} label="commits" />
            )}
            {repositories !== null && (
              <TimelineReadout
                value={repositories}
                format={plain}
                label="repositories"
              />
            )}
            <p className="col-span-2 max-w-[46ch] text-[0.9375rem] leading-[1.5] text-[color:var(--rec-ink-muted)] md:col-span-1">
              {provenance}
            </p>
          </div>
        </div>
      </section>

      <section className="band band--flush" aria-labelledby="contributions-heading">
        <div className="frame">
          <h2
            id="contributions-heading"
            className="text-[length:var(--rec-text-title)] leading-[1.12] font-semibold tracking-[-0.01em]"
          >
            Selected contributions
          </h2>
          <p className="prose mt-3 text-[color:var(--rec-ink-muted)]">
            {experience.length} dated records, newest first — a selection, not an
            exhaustive log. The latest is {latestRecordDate}; the tenure ran to{" "}
            {tenureEnd}.
          </p>

          <div className="mt-10 lg:mt-12">
            <Timeline items={items} />
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-[color:var(--rec-rule)] pt-8">
            <SectionLink section="contact" className="button">
              {CONTACT_CTA}
            </SectionLink>
            <RouteLink href="/projects" className="text-action">
              The open-source work
            </RouteLink>
          </div>
        </div>
      </section>
    </>
  );
}
