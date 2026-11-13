import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { countUp, motionAllowed } from "../lib/motion";
import { activeIndexAt, READING_LINE } from "../lib/reading";

/**
 * Timeline — the experience route's one structural motion.
 *
 * The page is a vertical rule down the left with nine entries hanging off it,
 * and the motion is the record being filled in: the rule's fill extends from the
 * top of the list to the bottom as the band crosses the reading line, and one
 * sticky marker in the left gutter reads the year of the entry currently at that
 * line. One scrubbed tween and one derived readout — not nine connectors each
 * drawing themselves, which is what made the page feel like a festival of small
 * entrances rather than one continuous movement.
 *
 * Both answers are derived from the live layout on every frame
 * ({@link activeIndexAt}), so the year marker cannot name an entry that has
 * already gone past, and the fill cannot disagree with the scroll position.
 *
 * With the OS asking for less motion the final state is written straight in:
 * the rule is filled, the marker names the first entry, and no trigger is
 * created. A page whose scripts never arrive paints the same thing, because the
 * hidden state is set here and never in CSS.
 */

if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  gsap.registerPlugin(ScrollTrigger);
}

/** A measured value, and the way to render it at any point of its count. */
export interface TimelineFigure {
  value: number;
  format: (value: number) => string;
}

/** One dated entry, already flattened for the row. */
export interface TimelineItem {
  id: string;
  date: string;
  name: string;
  status: string;
  outcome: string;
  description: string;
  highlights: string[];
  figure: TimelineFigure | null;
}

/**
 * A large mono readout that counts once, on mount.
 *
 * Used by the provenance strip above the timeline, which is on screen when the
 * page opens: its figures count during the boot, not on a scroll that already
 * happened. The rendered text is the delivered value, so the count is an
 * enhancement over a figure that is simply there.
 */
export function TimelineReadout({
  value,
  format,
  label,
}: {
  value: number;
  format: (value: number) => string;
  label: string;
}) {
  const figureRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handle = countUp(figureRef.current, value, format, {
      duration: 1.2,
    });
    return () => handle.revert();
  }, [value, format]);

  return (
    <div>
      <p className="font-mono text-[clamp(2.25rem,1.4rem+2.6vw,3.5rem)] leading-[0.9] tracking-[0.01em] text-[color:var(--rec-measure)]">
        <span ref={figureRef} className="tnum">
          {format(value)}
        </span>
      </p>
      <p className="data mt-2 text-[color:var(--rec-ink-muted)]">{label}</p>
    </div>
  );
}

/** The year an entry's date names. */
function yearOf(date: string): string {
  return date.match(/\d{4}/)?.[0] ?? date;
}

/** The timeline: one rule, one fill, one year marker, one trigger. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const fill = fillRef.current;
    if (!root || !fill) return;

    const rows = [...root.querySelectorAll<HTMLElement>("[data-timeline-entry]")];

    const update = () => {
      const line = window.innerHeight * READING_LINE;
      const tops = rows.map((row) => row.getBoundingClientRect().top);
      const next = activeIndexAt(tops, line);
      if (next < 0) return;
      setActive((previous) => (previous === next ? previous : next));
    };

    if (!motionAllowed()) {
      gsap.set(fill, { scaleY: 1, transformOrigin: "top center" });
      update();
      return;
    }

    gsap.set(fill, { scaleY: 0, transformOrigin: "top center" });

    const tween = gsap.to(fill, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: root,
        start: "top 70%",
        end: "bottom 70%",
        scrub: true,
        onUpdate: update,
        onRefresh: update,
      },
    });

    update();

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  const years = items.map((item) => yearOf(item.date));
  const marker = years[active] ?? years[0] ?? "";

  return (
    <div
      ref={rootRef}
      className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 md:grid-cols-[4.5rem_minmax(0,1fr)] md:gap-x-6"
    >
      {/* The marker's column is as tall as the list, so the year holds under the
          bar while the entries it names go past. */}
      <div aria-hidden="true" className="relative">
        <p
          data-year-marker
          className="data data--lg sticky top-[calc(var(--rec-header-h)+var(--rec-space-4))] tabular-nums text-[color:var(--rec-measure)]"
        >
          {marker}
        </p>
      </div>

      <div className="relative">
        {/* The spine, and its fill: one element scaled from the top by the
            band's single scrubbed trigger. */}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-px bg-[var(--rec-rule)]"
        />
        <span
          ref={fillRef}
          aria-hidden="true"
          data-spine-fill
          className="absolute inset-y-0 left-0 w-px origin-top bg-[var(--rec-signal)]"
          style={{ transform: "scaleY(0)" }}
        />

        <ol>
          {items.map((item) => (
            <li
              key={item.id}
              data-timeline-entry
              className="relative grid gap-x-10 gap-y-2 py-8 pl-6 md:grid-cols-[minmax(0,1fr)_9rem] md:py-10 md:pl-10"
            >
              <p
                data-timeline-date
                className="data tnum text-[color:var(--rec-ink-muted)] md:col-start-2 md:row-start-1 md:pt-1 md:text-right"
              >
                {item.date}
              </p>

              <div className="md:col-start-1 md:row-start-1">
                <h3
                  data-timeline-heading
                  className="max-w-[var(--rec-prose-measure)] text-[1.0625rem] leading-[1.35] font-medium text-[color:var(--rec-ink)]"
                >
                  {item.outcome}
                </h3>

                <p className="prose mt-2 text-[color:var(--rec-ink-muted)]">
                  {item.description}
                </p>

                {item.highlights.length > 0 && (
                  <ul className="mt-3 grid max-w-[var(--rec-prose-measure)] gap-y-1.5">
                    {item.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex gap-3 text-[0.9375rem] leading-[1.5] text-[color:var(--rec-ink-muted)]"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-[0.72em] h-px w-3 shrink-0 bg-[var(--rec-rule-strong)]"
                        />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                  {item.figure && (
                    <p
                      data-timeline-figure
                      className="font-mono tnum text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] leading-none tracking-[0.01em] text-[color:var(--rec-measure)]"
                    >
                      {item.figure.format(item.figure.value)}
                    </p>
                  )}
                  <p className="data text-[color:var(--rec-ink-muted)]">{item.name}</p>
                  <p className="data text-[color:var(--rec-ink-muted)]">
                    {item.status}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
