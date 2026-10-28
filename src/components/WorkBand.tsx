import { figures, workLede, workRows } from "../content/ledger";
import { RouteLink } from "../lib/router";
import { countWord } from "../content/ledger";
import { Reveal } from "./Reveal";

/**
 * WorkBand — selected work on the one coloured field in the record.
 *
 * The field is the point: after two sections of paper the page changes ground,
 * and the three projects are set as three aligned rows — name, what it is, and
 * the record line — like entries in a register rather than cards. Alignment on
 * three fixed columns is what separates them; there is no rule, no box and no
 * screenshot. An engineering record with invented product shots would be a
 * costume, so the evidence here is the named work, the stack, and the case notes
 * one click away.
 *
 * The three-column register starts at 1024px, not at the 768px two-column
 * breakpoint the other bands use: between 760px and 1023px the 14rem name and
 * 12.5rem meta leave the description only ~240px at a pad width, which sets the
 * record line at four or five words and breaks the reading measure. Below
 * 1024px the row goes back to one column (name, line, meta) at the same height.
 */
export function WorkBand() {
  return (
    <section
      id="work"
      className="band field-accent"
      aria-labelledby="work-heading"
    >
      <div className="frame">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
            <h2 id="work-heading" className="h2">
              Selected work
            </h2>
            <RouteLink href="/projects" className="text-action">
              All {countWord(figures.projectCount).toLowerCase()} projects
            </RouteLink>
          </div>
          <p className="prose mt-3">{workLede}</p>
        </Reveal>

        <ol className="mt-8 lg:mt-10">
          {workRows.map((row, index) => (
            <Reveal
              key={row.name}
              as="li"
              delayMs={index * 60}
              className="grid gap-x-8 gap-y-1 py-5 first:pt-0 last:pb-0 lg:grid-cols-[14rem_minmax(0,1fr)_12.5rem] lg:items-baseline"
            >
              <h3 className="h3">
                <RouteLink href="/projects" className="link">
                  {row.name}
                </RouteLink>
              </h3>
              <p className="prose order-3 lg:order-none">{row.line}</p>
              <p className="meta order-4 lg:order-none lg:whitespace-nowrap lg:text-right">
                {row.meta}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
