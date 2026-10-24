import { useCallback, useEffect } from "react";
import { CONTACT_EMAIL } from "../lib/contact";
import { cycleTheme, useTheme } from "../lib/theme";

/**
 * Footer — the persistent one-row chrome bar, in normal flow after the page
 * scroller.
 *
 * One row at every width (`min-h-11` + `py-1` ≈ 52px, `whitespace-nowrap`,
 * no `flex-wrap`, no horizontal scroll container):
 * `© YEAR NNL` on the left, then the four actions that live nowhere else in
 * the chrome - Email, GitHub, LinkedIn, and the theme control. Page
 * destinations belong to the header and the end-of-page pager; the footer
 * does not repeat them. The long colophon sentence lives in the end-of-page
 * `PageFoot`, not here.
 *
 * Narrow viewports (below 25rem) only tighten the two gaps one step — the row
 * itself never wraps, scrolls, or clips, and the 52px bar keeps the focus
 * ring's clearance.
 */

const YEAR = new Date().getFullYear();

/**
 * The three text links carry both target axes as a floor, not as text width:
 * `min-h-11` is the 44px height, and `min-w-11` is the 44px width the labels
 * cannot supply on their own ("Email" measured 33px wide and "GitHub" 43px
 * before this floor). `justify-center` keeps each label centred in the 44px
 * box instead of hugging its left edge. Measured in Chromium at 393x852 and
 * 2560x1440: 44x44 for both, every edge probe landing on the anchor; removing
 * either floor drops a real hit area below 44 on that axis.
 */
const linkClass =
  "flex min-h-11 min-w-11 items-center justify-center rounded-xs text-micro font-medium text-text-muted transition-colors duration-link hover:text-text hover:underline";

export function Footer() {
  const [themePreference] = useTheme();

  const cycleThemeHandler = useCallback(() => {
    cycleTheme();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "F2" || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (document.querySelector("[data-mobile-menu], [data-command-palette]")) return;
      e.preventDefault();
      cycleThemeHandler();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycleThemeHandler]);

  const themeLabel = `${themePreference[0].toUpperCase()}${themePreference.slice(1)}`;

  const themeButton = (
    <button
      type="button"
      onClick={cycleThemeHandler}
      title="Switch the color scheme: light or dark (F2)"
      aria-label={`Color scheme: ${themePreference}. Activate to switch to the other scheme (F2).`}
      className="flex min-h-11 shrink-0 items-center rounded-sm border border-border px-1.5 text-micro font-medium text-text transition-colors duration-field hover:border-border-accent hover:text-accent-text"
    >
      Theme: {themeLabel}
    </button>
  );

  return (
    <footer className="relative z-40 shrink-0 border-t-[3px] border-text bg-bg pb-[env(safe-area-inset-bottom)]">
      <div className="px-6 lg:px-10">
        <div className="mx-auto w-full max-w-[80rem]">
          <div className="flex min-h-11 w-full items-center justify-between gap-x-2 whitespace-nowrap py-1 max-[25rem]:gap-x-1">
            <span className="shrink-0 text-micro text-text-muted">
              © {YEAR} NNL
            </span>
            <nav
              aria-label="Contact and appearance"
              className="flex shrink-0 items-center gap-x-2 max-[25rem]:gap-x-1"
            >
              <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
                Email
              </a>
              <a
                href="https://github.com/nathwn12"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/nathaniel-nikolai-l-184181261/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                LinkedIn
              </a>
              {themeButton}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
