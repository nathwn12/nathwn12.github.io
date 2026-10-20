import { useCallback, useEffect } from "react";
import { CONTACT_EMAIL } from "../lib/contact";
import { cycleTheme, useTheme } from "../lib/theme";

/**
 * Footer — the colophon, the theme control, and the safe-area pad.
 *
 * It is `fixed` (never scrolls with page content) and its height is
 * auto-measured by PageShell into `--page-footer-offset`, which the page
 * scroller reserves — so the wrap at 375px, a text zoom, and the iOS safe-area
 * inset all stay accounted for instead of being pinned to a magic constant.
 *
 * Every control is at least 44pt tall and carries a visible text label: no
 * icon-only affordance, no status readouts, no decorative glyphs. Contact is
 * plain text links (color + underline on hover); the appearance control is the
 * one Line-bordered chip in the footer, so the two groups read apart without a
 * vertical stripe (§ Hard-ban list: the only vertical accent is the 1px gutter
 * marker). The credit is a colophon, not a build log: it names the two faces
 * the page is set in, never the framework list.
 */

const YEAR = new Date().getFullYear();

const linkClass =
  "flex min-h-11 items-center rounded-xs text-detail font-medium text-text-muted transition-colors duration-link hover:text-text hover:underline";

export function Footer() {
  const [themePreference] = useTheme();

  const cycleThemeHandler = useCallback(() => {
    cycleTheme();
  }, []);

  /* F2 switches the color scheme: light ↔ dark. Never hijack keys while typing
     or while the mobile menu is open — the footer is the control's home, so the
     shortcut is registered here beside it. */
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
      if (document.querySelector("[data-mobile-menu]")) return;
      e.preventDefault();
      cycleThemeHandler();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycleThemeHandler]);

  const themeLabel = `${themePreference[0].toUpperCase()}${themePreference.slice(1)}`;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)]">
      {/* Gutters sit outside the 68ch measure, matching the page container
          (Hero.tsx:71-72) and the header, so the chrome rule spans the
          viewport while the content keeps one edge. */}
      <div className="px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-[68ch] flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
          <p className="py-2 text-detail text-text-muted">
            © {YEAR} Nathaniel Nikolai Ladero — designed and built by hand.
            Set in Fraunces and Public Sans.
          </p>

          <nav
            aria-label="Contact and appearance"
            className="flex flex-wrap items-center gap-x-6"
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
