import { navigate, routeAtOffset, useRoute } from "../lib/router";

/**
 * PageFoot — the shared bottom prompt row rendered on every route page,
 * inside the page's `max-w-5xl` wrapper.
 *
 * One row: `$ wget ./resume.pdf ↓` (the primary action) followed by the
 * adjacent-route pager (← PREV <label>` / `NEXT <label> →). Copy and
 * attributes come verbatim from Hero's former link + pager — nothing new was
 * invented. Hero passes `accentResume` so Home keeps the accent treatment;
 * every other page renders the résumé control in ink with a 2px
 * `--border-width-rule` underline (the primary action's one emphasis per
 * view, DESIGN.md §6).
 *
 * Accent budget (§2.3): with `accentResume` the accent usage is exactly the
 * résumé control; without it this row owns no accent at all — ink text, ink
 * rules, concrete hairline. Termini (Home's PREV, Contact's NEXT) render
 * nothing — no disabled controls exist in this system.
 *
 * Tour contract: every control is a `[data-nav-item]` stop, and none carries
 * `[data-nav-activate]` (no click-after-focus; the item tour already routes
 * at the page boundary). Deliberate, recorded: Home gains its first stops
 * here.
 */

interface PageFootProps {
  /** Preserve Hero's accent treatment on the résumé control (Home only). */
  accentResume?: boolean;
}

const directionControl =
  "flex items-center gap-half border-b border-transparent text-label text-text transition-colors duration-150 hover:border-border-accent active:border-border-accent";

export function PageFoot({ accentResume = false }: PageFootProps) {
  const { route } = useRoute();
  const prev = routeAtOffset(route.path, -1);
  const next = routeAtOffset(route.path, 1);

  return (
    <div className="mt-section flex flex-wrap items-baseline gap-x-gutter gap-y-block">
      <div className="flex items-baseline gap-half">
        <span className="text-label text-text-muted">$</span>
        <a
          href="/Nathaniel-Nikolai-Ladero-Resume.pdf"
          download="Nathaniel-Nikolai-Ladero-Resume.pdf"
          data-nav-item
          className={
            accentResume
              ? "text-body-lg text-accent-text underline-offset-4 hover:underline active:opacity-70"
              : "text-body-lg text-text border-b-[length:var(--border-width-rule)] border-b-transparent transition-colors duration-150 hover:border-b-border-accent active:border-b-border-accent"
          }
        >
          wget ./resume.pdf
        </a>
        <span aria-hidden="true" className="text-body-lg text-text-muted">
          ↓
        </span>
      </div>

      <div className="h-px flex-1 bg-border" />

      <div className="flex items-center gap-block">
        {prev.path !== route.path && (
          <button
            type="button"
            onClick={() => navigate(prev.path)}
            data-nav-item
            className={directionControl}
          >
            <span aria-hidden="true">←</span>
            <span>PREV</span>
            <span className="font-bold">{prev.label}</span>
          </button>
        )}
        {next.path !== route.path && (
          <button
            type="button"
            onClick={() => navigate(next.path)}
            data-nav-item
            className={directionControl}
          >
            <span>NEXT</span>
            <span className="font-bold">{next.label}</span>
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  );
}