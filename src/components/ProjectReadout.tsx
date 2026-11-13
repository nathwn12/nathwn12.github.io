import { useEffect, useRef, useState } from "react";
import type { ProjectLore } from "../content/projects";
import { activeIndexAt, READING_LINE } from "../lib/reading";

/**
 * ProjectReadout — the projects band's one scrubbed panel.
 *
 * The band used to carry a sticky column that described "the active row", and
 * it could be wrong: the pointer crossing a row latched the panel, so wheeling
 * down the list with the cursor resting on one row kept the panel naming that
 * row while nine others went past it. A panel that shows the wrong project's
 * data is worse than no panel.
 *
 * This one cannot be wrong by construction. {@link activeIndexAt} (in
 * `lib/reading.ts`, shared with the experience band's year marker) is a pure
 * function of the rows' current viewport positions and a reading line: the
 * active row is the last one whose top has passed that line. Nothing is
 * latched, nothing is remembered between frames, and the answer is recomputed
 * from the live layout on every scroll frame — so it is correct at every scroll
 * position, including one arrived at by dragging the scrollbar or by a deep
 * link. It is also the reason the rows themselves carry no entrance animation:
 * the band's motion is this one continuous readout, not thirteen little ones.
 *
 * The panel is `aria-hidden`: every row already states its own index, name,
 * kind, stack and year, so this is a reading aid for the eye and a screen
 * reader would only hear each fact twice.
 */

/** "Fork of acme/tool" → "fork of acme/tool"; anything else is its own kind. */
function kindOf(project: ProjectLore): string {
  return project.role.startsWith("Fork of ")
    ? `fork of ${project.role.slice("Fork of ".length)}`
    : project.kind;
}

export function ProjectReadout({ projects }: { projects: ProjectLore[] }) {
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const scope = root.closest("section") ?? document;
      const rows = [
        ...scope.querySelectorAll<HTMLElement>("[data-project-row]"),
      ];
      const tops = rows.map((row) => row.getBoundingClientRect().top);
      const next = activeIndexAt(tops, window.innerHeight * READING_LINE);
      if (next < 0) return;
      setActive((previous) => (previous === next ? previous : next));
    };

    /* One rAF per frame at most: a scroll event can fire many times per frame
       and the readout only needs the frame's final layout. */
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  const project = projects[active] ?? projects[0];
  if (!project) return null;

  return (
    <div
      ref={rootRef}
      data-project-readout
      aria-hidden="true"
      className="hidden border-t border-[color:var(--rec-rule-strong)] pt-4 lg:sticky lg:top-[calc(var(--rec-header-h)+var(--rec-space-4))] lg:block lg:self-start"
    >
      <p className="data data--sm text-[color:var(--rec-ink-muted)]">active</p>

      <p className="data data--lg mt-2 tabular-nums text-[color:var(--rec-measure)]">
        {String(active + 1).padStart(2, "0")}
        <span className="text-[color:var(--rec-ink-muted)]">
          {" / "}
          {String(projects.length).padStart(2, "0")}
        </span>
      </p>

      <h3 className="mt-3 font-display text-[1.75rem] leading-[1.1] font-normal! tracking-[-0.01em]! text-[color:var(--rec-ink)]">
        {project.name}
      </h3>

      <p className="data data--sm mt-3 text-[color:var(--rec-ink-muted)]">
        {kindOf(project)}
      </p>
      <p className="data data--sm mt-1 text-[color:var(--rec-ink-muted)]">
        {project.tech.join(", ")}
      </p>
      <p className="data data--sm mt-1 tabular-nums text-[color:var(--rec-ink-muted)]">
        {project.year}
      </p>
    </div>
  );
}
