import { projects } from "../content/projects";
import { workLede, workRows } from "../content/ledger";
import { RouteLink } from "../lib/router";
import { Marquee } from "./Marquee";
import { Seam } from "./Readout";

/**
 * WorkBand — the public work, compact and low: thirteen live repositories, each
 * one carrying its own readout.
 *
 * The band sits below the record and the AI practice on purpose. It is
 * supporting evidence, so it states the list and gets out of the way: one row
 * per repository, a name, a year at the frame's right edge, a line about the
 * three worth opening first, and one row of mono facts — kind, authorship,
 * stack. The close is the marquee: the same thirteen repository names running
 * past as ambient evidence, so a reader who does not scroll the whole list still
 * sees how much of it there is.
 *
 * The band used to hold a sticky column that described "the active row". It was
 * a panel that could be wrong: the pointer crossing a row latched it, so wheeling
 * down the list with the cursor resting on Puppet kept the panel saying
 * `nathwn12/puppet` while Potflix, Slowburn and nine others went past it, and a
 * reader had no way to tell that the panel had stopped tracking. A panel that
 * shows the wrong project's data is worse than no panel, so the readout is now
 * inline: every row is complete on its own, nothing is shared state, and the
 * scroll has no opinion about what is being read.
 *
 * The columns are fixed, so the year ends on the frame's right edge on every
 * row, and the kind/role/stack line starts on the row's left edge on every row.
 * They used to be three fields run together and right-aligned onto an x that
 * matched nothing else on the page.
 *
 * Hover is drawn as motion and nothing else: a 1px signal rule sweeps the row's
 * width while the name steps left by one space. No lift, no shadow, and no
 * colour change on the row itself.
 */

/** The three repositories that also have a written line in the record. */
const FEATURED = new Map(workRows.map((row) => [row.name, row]));

/** What the marquee carries: every repository under the account, with the
 *  language GitHub reports as its primary. A name and a fact, no figure. */
const MARQUEE_ITEMS = projects.map((project) => ({
  value: `nathwn12/${project.dir}`,
  label: project.tech[0] ?? "",
}));

export function WorkBand() {
  return (
    <>
      <Seam />
      <section
        id="work"
        aria-labelledby="work-heading"
        className="py-[var(--rec-rhythm)] md:py-[var(--rec-rhythm-lg)]"
      >
        <div className="frame">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <h2
              id="work-heading"
              className="font-display text-[length:var(--rec-text-claim)] leading-[var(--rec-leading-claim)] font-normal! tracking-[var(--rec-tracking-claim)]! text-[color:var(--rec-ink)]"
            >
              Selected work
            </h2>
            <RouteLink
              href="/projects"
              className="data inline-flex min-h-11 items-center border-b border-[color:var(--rec-rule-strong)] text-[color:var(--rec-signal)] transition-[color,border-color] duration-150 hover:border-[color:var(--rec-signal)]"
            >
              All projects
            </RouteLink>
          </div>
          <p className="mt-4 max-w-[62ch] text-[color:var(--rec-ink-muted)]">
            {workLede}
          </p>

          {/* One rule above the first row and one after the last: the ledger is
              a closed table, not a list that stops in mid-air. */}
          <ol className="mt-8 border-b border-[color:var(--rec-rule)]">
            {projects.map((project) => {
              const featured = FEATURED.get(project.name);
              return (
                <li
                  key={project.dir}
                  className="group border-t border-[color:var(--rec-rule)]"
                >
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block py-5"
                  >
                    {/* the scan: one hairline, drawn left to right, hover and
                        focus only. Nothing moves but its scale. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 -top-px block h-px origin-left scale-x-0 bg-[color:var(--rec-signal)] transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-within:scale-x-100"
                    />

                    <div className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-baseline gap-x-6">
                      <span className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-[color:var(--rec-ink)] transition-transform duration-200 ease-out group-hover:-translate-x-1 group-focus-within:-translate-x-1">
                        {project.name}
                      </span>
                      <span className="data data--sm text-right tabular-nums text-[color:var(--rec-ink-muted)]">
                        {project.year}
                      </span>
                    </div>

                    {featured ? (
                      <p className="mt-2 max-w-[54ch] text-[0.9375rem] leading-[1.5] text-[color:var(--rec-ink-muted)]">
                        {featured.line}
                      </p>
                    ) : null}

                    {/* Two rows, not a wrapping run of three fields: what it is
                        and whose it is on the first, what it is made of on the
                        second. A single wrapping line left its separator
                        stranded at the end of a line on a phone. */}
                    <div className="data data--sm mt-2 flex flex-col gap-y-1 text-[color:var(--rec-ink-muted)]">
                      <span className="flex items-center gap-x-4">
                        <span>{project.kind}</span>
                        <span
                          aria-hidden="true"
                          className="h-3 w-px bg-[color:var(--rec-rule-strong)]"
                        />
                        <span>{project.role}</span>
                      </span>
                      <span>{project.tech.join(", ")}</span>
                    </div>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* The band closes on the names themselves: every repository under the
          account, running past once. The rows above are the argument; this is
          the size of the set they were drawn from. */}
      <Marquee items={MARQUEE_ITEMS} />
    </>
  );
}
