import { navigate, routeAtOffset, useRoute } from "../lib/router";
import { CV_PATH, RESUME_PATH } from "../lib/contact";
import { navName } from "../lib/navNames";

/**
 * PageFoot — the shared bottom band rendered on every route page (inside the
 * page's own 68ch container).
 *
 * One row under a 1px Line hairline: the résumé and CV downloads on the left,
 * the adjacent-page pager on the right. Copy is sentence case and labels are
 * visible; both downloads resolve through the path constants in
 * src/lib/contact.ts and carry their own download attribute — only the
 * treatment is styled here. Hero passes `accentResume`, so Home carries the
 * accent treatment and every other route renders the controls in ink with the
 * underline-on-hover affordance. No arrow glyphs: link affordance is color,
 * weight, and underline on hover. Timing is per element, not per component:
 * the two pager buttons move on the nav token, the two download links on the
 * link token — both frozen in src/index.css, each running its named value as written
 * (owner order 2026-10-14: the OS reduced-motion query no longer collapses a
 * duration).
 *
 * Tour contract: every control is a `[data-nav-item]` stop, and none carries
 * `[data-nav-activate]` (no click-after-focus; the item tour already routes at
 * the page boundary). Deliberate, recorded: Home gains its first stops here.
 */

interface PageFootProps {
  /** Preserve Hero's accent treatment on the résumé and CV controls (Home only). */
  accentResume?: boolean;
}

const YEAR = new Date().getFullYear();

const directionControl =
  "flex min-h-11 items-center rounded-xs text-label font-medium text-text transition-colors duration-nav hover:underline";

const resumeBase =
  "flex min-h-11 items-center rounded-xs text-body font-semibold transition-colors duration-link";

export function PageFoot({ accentResume = false }: PageFootProps) {
  const { route } = useRoute();
  const prev = routeAtOffset(route.path, -1);
  const next = routeAtOffset(route.path, 1);

  return (
    <div className="mt-section border-t border-border pt-block">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
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
          <a
            href={CV_PATH}
            download="Nathaniel-Nikolai-Ladero-CV.pdf"
            data-nav-item
            className={
              accentResume
                ? `${resumeBase} text-accent-text hover:underline`
                : `${resumeBase} text-text hover:underline`
            }
          >
            Download CV
          </a>
        </div>

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
      <p className="mt-4 text-[0.75rem] font-normal not-italic leading-snug text-text-muted">
        Colophon — © {YEAR} Nathaniel Nikolai Ladero. Set in Newsreader and
        Inter.{" "}
        {/* The link ITSELF owns the 44px target: `inline-block` + `min-h-11`
            makes the anchor's own border box 44px tall (measured 103.8x44 in
            Chromium at 393x852 and 2560x1440), so the element that receives
            the pointer, paints the focus ring, and shows up in hit-testing is
            the anchor — not an inline text run with an aria-hidden overlay
            inside it (that measured 103.8x15 and was the earlier blocker). The
            imprint type stays 12px / muted.

            `-mb-[1.71875rem]` cancels the line-box growth exactly:
            2.75rem (min-h-11) - 0.75rem x 1.375 (leading-snug) = 1.71875rem.
            The margin box therefore stays 16.5px, the paragraph's rhythm does
            not move, and the extra 27.5px extends downward only — into the foot
            band's own 4rem bottom padding, never upward into the 16px gap that
            separates the colophon from the pager row. */}
        <a
          href="https://github.com/nathwn12/nathwn12.github.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block min-h-11 min-w-11 -mb-[1.71875rem] text-text-muted no-underline hover:text-text hover:underline"
        >
          Source on GitHub.
        </a>
      </p>
    </div>
  );
}
