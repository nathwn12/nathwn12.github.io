import { navigate, routeAtOffset, useRoute } from "../lib/router";
import { RESUME_PATH } from "../lib/contact";
import { navName } from "../lib/navNames";

/**
 * PageFoot — the shared bottom band rendered on every route page (inside the
 * page's own 68ch container).
 *
 * One row under a 1px Line hairline: the résumé download on the left, the
 * adjacent-page pager on the right. Copy is sentence case and labels are
 * visible; the résumé link's href and download attributes are unchanged — only
 * the treatment is. Hero passes `accentResume`, so Home carries the accent
 * treatment and every other route renders the control in ink with the
 * underline-on-hover affordance. No arrow glyphs: link affordance is color,
 * weight, and underline on hover. Timing is per element, not per component:
 * the two pager buttons move on the nav token, the résumé link on the link
 * token — both frozen in src/index.css, each running its named value as written
 * (owner order 2026-10-14: the OS reduced-motion query no longer collapses a
 * duration).
 *
 * Tour contract: every control is a `[data-nav-item]` stop, and none carries
 * `[data-nav-activate]` (no click-after-focus; the item tour already routes at
 * the page boundary). Deliberate, recorded: Home gains its first stops here.
 */

interface PageFootProps {
  /** Preserve Hero's accent treatment on the résumé control (Home only). */
  accentResume?: boolean;
}

const directionControl =
  "flex min-h-11 items-center rounded-xs text-label font-medium text-text transition-colors duration-nav hover:underline";

const resumeBase =
  "flex min-h-11 items-center rounded-xs text-body font-semibold transition-colors duration-link";

export function PageFoot({ accentResume = false }: PageFootProps) {
  const { route } = useRoute();
  const prev = routeAtOffset(route.path, -1);
  const next = routeAtOffset(route.path, 1);

  return (
    <div className="mt-section flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border pt-block">
      <a
        href={RESUME_PATH}
        download="Nathaniel-Nikolai-Ladero-Resume.pdf"
        data-nav-item
        className={
          accentResume
            ? `${resumeBase} text-accent-text hover:underline`
            : `${resumeBase} text-text hover:underline`
        }
      >
        Download résumé
      </a>

      <nav aria-label="Adjacent pages" className="flex flex-wrap items-center gap-6">
        {prev.path !== route.path && (
          <button
            type="button"
            onClick={() => navigate(prev.path)}
            data-nav-item
            className={directionControl}
          >
            <span>
              Previous: <span className="font-semibold">{navName(prev.id, prev.label)}</span>
            </span>
          </button>
        )}
        {next.path !== route.path && (
          <button
            type="button"
            onClick={() => navigate(next.path)}
            data-nav-item
            className={directionControl}
          >
            <span>
              Next: <span className="font-semibold">{navName(next.id, next.label)}</span>
            </span>
          </button>
        )}
      </nav>
    </div>
  );
}
