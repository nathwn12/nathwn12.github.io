import { useCallback, useEffect } from "react";
import { CONTACT_EMAIL } from "../lib/contact";
import { coreStack } from "../content/hero";
import { ROUTES, navigate } from "../lib/router";
import { navName } from "../lib/navNames";
import { cycleTheme, useTheme } from "../lib/theme";

/**
 * Footer — the printed colophon, in normal flow after the page scroller.
 *
 * Static (never fixed): it sits below the scroller in the app's flex column
 * so it can never cover content. A single 48px-tall scrolling row holds the
 * colophon line, the route list, and the contact/appearance controls in one
 * line with horizontal overflow — the wrap that once grew it past 200px on
 * phones is gone. Its height needs no live measurement: the scroller sizes
 * itself from the remaining flex space.
 */

const YEAR = new Date().getFullYear();

const linkClass =
  "flex min-h-11 items-center rounded-xs text-detail font-medium text-text-muted transition-colors duration-link hover:text-text hover:underline";

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

  return (
    <footer className="relative z-40 shrink-0 border-t-[3px] border-text bg-bg pb-[env(safe-area-inset-bottom)]">
      <div className="px-6 lg:px-10">
        <div className="mx-auto flex h-12 w-full max-w-[80rem] items-center justify-between gap-x-8 overflow-x-auto whitespace-nowrap">
          <p className="flex shrink-0 items-center py-2 font-display text-body font-semibold text-text">
            Colophon — © {YEAR} Nathaniel Nikolai Ladero. Set in Fraunces
            and Public Sans. {coreStack} Source on GitHub.
          </p>

          <nav
            aria-label="Sections"
            className="flex shrink-0 items-center gap-x-4"
          >
            {ROUTES.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className="flex min-h-11 items-center rounded-xs font-mono text-micro uppercase tracking-[0.08em] text-text-muted transition-colors duration-nav hover:text-accent-text hover:underline"
              >
                {navName(item.id, item.label)}
              </button>
            ))}
          </nav>

          <nav
            aria-label="Contact and appearance"
            className="flex shrink-0 items-center gap-x-6"
          >
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
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
              Email
            </a>
            <button
              type="button"
              onClick={cycleThemeHandler}
              title="Switch the color scheme: light or dark (F2)"
              aria-label={`Color scheme: ${themePreference}. Activate to switch to the other scheme (F2).`}
              className="flex min-h-11 items-center rounded-sm border border-border px-3 text-detail font-medium text-text transition-colors duration-field hover:border-border-accent hover:text-accent-text"
            >
              Theme: {themeLabel}
            </button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
