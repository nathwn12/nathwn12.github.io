import {
  employer,
  experience,
  experienceLede,
  formerRoleLine,
  latestRecordDate,
  provenance,
  tenureEnd,
  tenureSpan,
} from "../content/experience";
import { CONTACT_CTA, figures } from "../content/ledger";
import { RouteLink, SectionLink } from "../lib/router";
import { Reveal } from "./Reveal";

/**
 * Experience — the long form: nine dated entries, newest first.
 *
 * This route keeps the delivered sentences word for word (outcome, description,
 * highlights, provenance); the home page carries the rewritten version. That
 * division is the point of keeping two detail routes at all: the record states,
 * the detail proves.
 *
 * The date is the spine. Each entry is a two-column row — date on the left,
 * record on the right — and the continuous tenure sits above the list as its
 * own span, so the employment period can never be mistaken for one more dated
 * milestone.
 */
export function Experience() {
  return (
    <>
      <section className="band band--first" aria-labelledby="experience-heading">
        <div className="frame">
          <div className="grid gap-y-8 lg:grid-cols-12 lg:gap-x-10">
            <div className="lg:col-span-7">
              <Reveal>
                <h1 id="experience-heading" className="h1">
                  Experience
                </h1>
                <p className="lede mt-5 max-w-[46ch]">{experienceLede}</p>
                <p className="meta muted mt-5">
                  {formerRoleLine}, {employer.location}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2">
                  <SectionLink section="contact" className="button">
                    {CONTACT_CTA}
                  </SectionLink>
                  <RouteLink href="/projects" className="text-action">
                    The open-source work
                  </RouteLink>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-4 lg:col-start-9">
              <Reveal delayMs={80}>
                {/* The continuous tenure is its own labelled span, outside the
                    dated list, so the employment period can never be read as one
                    more shipped milestone: the record's newest entry is November
                    2025 and the tenure ran to May 2026. It sits in the opening
                    band's second column so the page opens as one composition
                    rather than a title over an empty half. */}
                <div className="fact" data-tenure-span>
                  <p className="fact__label">Tenure</p>
                  <p className="fact__figure">{figures.tenure}</p>
                  <p className="fact__note tnum">{tenureSpan}</p>
                  <p className="fact__note">
                    Continuous employment at {employer.company}
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="band band--flush" aria-labelledby="contributions-heading">
        <div className="frame">
          <Reveal>
            <h2 id="contributions-heading" className="h2 max-w-[20ch]">
              Selected contributions
            </h2>
            <p className="prose mt-4">
              {experience.length} dated records, newest first — a selection, not
              an exhaustive log. The latest is {latestRecordDate}; the tenure ran
              to {tenureEnd}.
            </p>
          </Reveal>

          <ol className="mt-10">
            {experience.map((entry, index) => (
              <Reveal
                key={entry.id}
                as="li"
                delayMs={index < 4 ? index * 40 : 0}
                className="grid gap-x-10 gap-y-3 py-8 md:grid-cols-[9rem_minmax(0,1fr)] md:py-10"
              >
                <p className="meta muted tnum md:pt-1">{entry.date}</p>
                <div>
                  <h2 className="h3">{entry.name}</h2>
                  <p className="mt-3 max-w-[62ch] text-[1.0625rem] leading-snug font-medium">
                    {entry.outcome}
                  </p>
                  <p className="prose mt-3">{entry.description}</p>
                  {entry.highlights.length > 0 && (
                    <ul className="mt-4 max-w-[62ch]">
                      {entry.highlights.map((highlight) => (
                        <li key={highlight} className="prose flex gap-3">
                          <span
                            aria-hidden="true"
                            className="mt-[0.6em] block size-1 shrink-0 bg-current"
                          />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="meta muted mt-4">
                    {entry.status} · {entry.tech.join(" · ")}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>

          <p className="prose muted mt-8 max-w-[62ch]">{provenance}</p>
        </div>
      </section>
    </>
  );
}
