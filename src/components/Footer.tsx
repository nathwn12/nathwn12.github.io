import { useCallback, useEffect } from "react";
import { CONTACT_EMAIL } from "../lib/contact";
import { ROUTES, navigate } from "../lib/router";
import { navName } from "../lib/navNames";
import { cycleTheme, useTheme } from "../lib/theme";

/**
 * Footer — the persistent one-row chrome bar, in normal flow after the page
 * scroller.
 *
 * One row at every width (`h-11` + the 3px top rule ≈ 47px, `whitespace-nowrap`,
 * no `flex-wrap`, `overflow-hidden` so the bar can never scroll horizontally):
 * `© YEAR NNL` on the left, route links (hidden below `lg`) plus
 * Email/GitHub/LinkedIn/Theme on the right. The long colophon sentence lives
 * in the end-of-page `PageFoot`, not here.
 */

const YEAR = new Date().getFullYear();

const linkClass =
  "flex min-h-11 items-center rounded-xs text-micro font-medium text-text-muted transition-colors duration-link hover:text-text hover:underline";

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
          <div className="flex h-11 w-full items-center justify-between gap-x-2 overflow-hidden whitespace-nowrap">
            <span className="shrink-0 text-micro text-text-muted">
              © {YEAR} NNL
            </span>
            <div className="flex min-w-0 items-center gap-x-5">
              <nav
                aria-label="Sections"
                className="hidden items-center gap-x-4 lg:flex"
              >
                {ROUTES.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className="flex min-h-11 shrink-0 items-center rounded-xs font-mono text-micro uppercase tracking-[0.08em] text-text-muted transition-colors duration-nav hover:text-accent-text hover:underline"
                  >
                    {navName(item.id, item.label)}
                  </button>
                ))}
              </nav>
              <nav
                aria-label="Contact and appearance"
                className="flex shrink-0 items-center gap-x-2"
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
      </div>
    </footer>
  );
}
