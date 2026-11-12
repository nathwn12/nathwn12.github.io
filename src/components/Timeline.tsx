import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  countUp,
  motionAllowed,
  revealLines,
  type MotionHandle,
} from "../lib/motion";

/**
 * Timeline — the experience route's one structural motion.
 *
 * The page is a vertical rule down the left with nine entries hanging off it,
 * and the motion is the receipt being drawn: each entry's connector extends
 * from the rule (1px of `--rec-signal`, scaleX 0 to 1), its outcome line
 * masks up, and its measured figure counts once. Nothing else moves.
 *
 * The scroll work is ONE batched trigger over the whole timeline
 * (`ScrollTrigger.batch`) rather than nine independent ones: a batch fires for
 * the rows that enter together, staggers nothing it does not own, and costs one
 * observer set for the page. Each row is fired at most once, whichever
 * direction it arrives from, so a refresh mid-page cannot leave a connector
 * undrawn or a figure counting twice.
 *
 * With the OS asking for less motion, or the footer's switch off, the final
 * state is written straight in: every connector at full extent, every heading
 * plain text, every figure at its delivered value. A page whose scripts never
 * arrive paints the same thing, because the hidden state is set here and never
 * in CSS.
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

  useGSAP(
    () => {
      const handle = countUp(figureRef.current, value, format, {
        duration: 1.2,
      });
      return () => handle.revert();
    },
    { dependencies: [value] },
  );

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

/** The timeline: one rule, nine rows, one batched trigger. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const connectors = gsap.utils.toArray<HTMLElement>(
        "[data-timeline-connector]",
        root,
      );
      const rows = gsap.utils.toArray<HTMLElement>("[data-timeline-entry]", root);

      if (!motionAllowed()) {
        gsap.set(connectors, { scaleX: 1, transformOrigin: "left center" });
        return;
      }

      gsap.set(connectors, { scaleX: 0, transformOrigin: "left center" });

      const figures = new Map<Element, TimelineFigure>();
      rows.forEach((row, index) => {
        const figure = items[index]?.figure;
        if (figure) figures.set(row, figure);
      });

      const handles: MotionHandle[] = [];
      const fired = new Set<Element>();

      const fire = (elements: Element[]) => {
        for (const row of elements) {
          if (fired.has(row)) continue;
          fired.add(row);

          const connector = row.querySelector<HTMLElement>(
            "[data-timeline-connector]",
          );
          if (connector) {
            gsap.to(connector, {
              scaleX: 1,
              duration: 0.7,
              ease: "power2.out",
            });
          }

          const heading = row.querySelector<HTMLElement>(
            "[data-timeline-heading]",
          );
          if (heading) handles.push(revealLines(heading, { delay: 0.08 }));

          const figureEl = row.querySelector<HTMLElement>(
            "[data-timeline-figure]",
          );
          const figure = figures.get(row);
          if (figureEl && figure) {
            handles.push(
              countUp(figureEl, figure.value, figure.format, {
                duration: 1.1,
              }),
            );
          }
        }
      };

      const triggers = ScrollTrigger.batch(rows, {
        start: "top 88%",
        onEnter: fire,
        onEnterBack: fire,
      });

      return () => {
        triggers.forEach((trigger) => trigger.kill());
        handles.forEach((handle) => handle.revert());
      };
    },
    { scope: rootRef, dependencies: [] },
  );

  return (
    <div ref={rootRef} className="relative">
      {/* The spine. It is full-height by construction, so it ends where the
          last entry does rather than at an assumed row height. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-px bg-[var(--rec-rule)]"
      />

      <ol>
        {items.map((item) => (
          <li
            key={item.id}
            data-timeline-entry
            className="relative grid gap-x-10 gap-y-2 py-8 pl-6 md:grid-cols-[minmax(0,1fr)_9rem] md:py-10 md:pl-10"
          >
            {/* The connector into the spine: 1px of signal, drawn from the
                rule outwards by the batch trigger above. */}
            <span
              aria-hidden="true"
              data-timeline-connector
              className="absolute top-2 left-0 h-px w-4 origin-left bg-[var(--rec-signal)] md:top-3 md:w-6"
            />

            <p
              data-timeline-date
              className="data tnum text-[color:var(--rec-ink-muted)] md:col-start-2 md:row-start-1 md:pt-1 md:text-right"
            >
              {item.date}
            </p>

            <div className="md:col-start-1 md:row-start-1">
              <h3
                data-timeline-heading
                className="max-w-[62ch] text-[1.0625rem] leading-[1.35] font-medium text-[color:var(--rec-ink)]"
              >
                {item.outcome}
              </h3>

              <p className="prose mt-2 text-[color:var(--rec-ink-muted)]">
                {item.description}
              </p>

              {item.highlights.length > 0 && (
                <ul className="mt-3 grid max-w-[62ch] gap-y-1.5">
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
  );
}
