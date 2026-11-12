import { useEffect, useRef, useState } from "react";
import { projects } from "../content/projects";
import { countWord, figures, workLede, workRows } from "../content/ledger";
import { RouteLink } from "../lib/router";
import { Seam } from "./Readout";

/**
 * WorkBand — the ledger roll: eleven live repositories, scrolled past a fixed
 * readout column.
 *
 * The readout is `position: sticky`, not a ScrollTrigger pin. That is the one
 * deliberate departure from the plan, and it is the accessible version of the
 * same idea: the column holds its place at the top of the band while the rows
 * travel past it, so the band reads as one instrument, and the page never
 * hijacks the scroll. A pin would have added a spacer the height of the band
 * (a second scroll distance to land on the next band), fought momentum and
 * keyboard focus, and needed `pinSpacing: false` gymnastics to avoid stranding
 * the atlas. Sticky gives the identical composition with none of that risk, and
 * it degrades to a static row of metadata on a phone.
 *
 * The active row — the one the readout describes — is whichever row the pointer
 * is on, or the row the keyboard is on, or, failing both, the row nearest the
 * middle of the viewport. Every row is a real link to its repository, reachable
 * by Tab whether or not any script runs, and the readout is not a live region:
 * a pointer crossing a row must not be announced.
 *
 * Hover is drawn as motion and nothing else: a 1px signal rule sweeps the row's
 * width while the row's own metadata steps left by one space. No lift, no
 * shadow, no glow, and no colour change on the row itself.
 */

const SECONDARY_ROWS = new Set(workRows.map((row) => row.name));

export function WorkBand() {
  const rowsRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  /** Set while a pointer or a focus owns the readout; scroll must not fight it. */
  const manualRef = useRef(false);

  /* Scroll-driven fallback: the row crossing the middle of the viewport is the
     one the readout describes. Silent while a pointer or focus is in charge. */
  useEffect(() => {
    const list = rowsRef.current;
    if (!list || typeof IntersectionObserver !== "function") return;
    const rows = [...list.querySelectorAll<HTMLElement>("[data-row]")];
    if (rows.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (manualRef.current) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = rows.indexOf(entry.target as HTMLElement);
          if (index >= 0) setActive(index);
        }
      },
      /* A nine-pixel band across the middle of the viewport: rows are at least
         sixty pixels tall, so exactly one row is ever the band's occupant and
         the readout cannot race between two. */
      { rootMargin: "-49.5% 0px -49.5% 0px", threshold: 0 },
    );
    for (const row of rows) observer.observe(row);
    return () => observer.disconnect();
  }, []);

  const current = projects[active] ?? projects[0];
  const repo = current.url.replace("https://github.com/", "");

  return (
    <>
      <Seam />
      <section
        id="work"
        aria-labelledby="work-heading"
        className="py-[var(--rec-band)] md:py-[var(--rec-band-lg)]"
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
              className="data inline-flex min-h-11 items-center text-[color:var(--rec-signal)] underline decoration-[color:var(--rec-rule-strong)] decoration-1 underline-offset-[0.3em] transition-[color,text-decoration-color,border-color] duration-150 hover:decoration-[color:var(--rec-signal)]"
            >
              All {countWord(figures.projectCount).toLowerCase()} projects
            </RouteLink>
          </div>
          <p className="mt-4 max-w-[62ch] text-[color:var(--rec-ink-muted)]">
            {workLede}
          </p>

          <div className="mt-10 grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
            <ol ref={rowsRef} className="order-2 lg:order-1">
              {projects.map((project, index) => {
                const featured = SECONDARY_ROWS.has(project.name)
                  ? workRows.find((row) => row.name === project.name)
                  : undefined;
                return (
                  <li
                    key={project.dir}
                    data-row
                    className={
                      featured
                        ? "group border-t border-[color:var(--rec-rule)] py-6"
                        : "group border-t border-[color:var(--rec-rule)] py-4"
                    }
                  >
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseEnter={() => {
                        manualRef.current = true;
                        setActive(index);
                      }}
                      onMouseLeave={() => {
                        manualRef.current = false;
                      }}
                      onFocus={() => {
                        manualRef.current = true;
                        setActive(index);
                      }}
                      onBlur={() => {
                        manualRef.current = false;
                      }}
                      className="relative block"
                    >
                      {/* the scan: one hairline, drawn left to right, hover and
                          focus only. Nothing moves but its scale. */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 -top-px block h-px origin-left scale-x-0 bg-[color:var(--rec-signal)] transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-within:scale-x-100"
                      />

                      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
                        <span className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-[color:var(--rec-ink)] transition-transform duration-200 ease-out group-hover:-translate-x-1 group-focus-within:-translate-x-1">
                          {project.name}
                        </span>
                        <span className="data data--sm flex flex-wrap items-center gap-x-4 gap-y-1 text-[color:var(--rec-ink-muted)] transition-transform duration-200 ease-out group-hover:-translate-x-1 group-focus-within:-translate-x-1">
                          <span>{project.kind}</span>
                          <span>{project.role}</span>
                          <span>{project.year}</span>
                        </span>
                      </div>

                      {featured ? (
                        <p className="mt-2 max-w-[54ch] text-[0.9375rem] leading-[1.5] text-[color:var(--rec-ink-muted)]">
                          {featured.line}
                        </p>
                      ) : null}

                      {/* On a phone the readout column is hidden, so the stack
                          travels with its row instead of being lost. */}
                      <p className="data data--sm mt-2 text-[color:var(--rec-ink-muted)] lg:hidden">
                        {project.tech.join(", ")}
                      </p>
                    </a>
                  </li>
                );
              })}
            </ol>

            {/* The readout: one column, pinned by sticky rather than by scroll
                machinery. Hidden below `lg`, where the rows carry their own
                metadata instead. */}
            <div className="order-1 hidden lg:order-2 lg:block">
              <div className="sticky top-[calc(var(--rec-header-h)+1.5rem)] border-t border-[color:var(--rec-rule-strong)] pt-4">
                <p className="data data--sm text-[color:var(--rec-ink-muted)]">
                  reading
                </p>
                <p className="mt-2 break-words font-mono text-[0.8125rem] leading-[1.5] text-[color:var(--rec-ink)]">
                  {repo}
                </p>
                <dl className="mt-4 space-y-3">
                  <div>
                    <dt className="data data--sm text-[color:var(--rec-ink-muted)]">
                      stack
                    </dt>
                    <dd className="data data--sm mt-1 text-[color:var(--rec-ink)]">
                      {current.tech.join(", ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="data data--sm text-[color:var(--rec-ink-muted)]">
                      technologies
                    </dt>
                    <dd className="data data--sm mt-1 text-[color:var(--rec-measure)] tabular-nums">
                      {current.tech.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="data data--sm text-[color:var(--rec-ink-muted)]">
                      shipped
                    </dt>
                    <dd className="data data--sm mt-1 text-[color:var(--rec-ink)]">
                      {current.year}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
