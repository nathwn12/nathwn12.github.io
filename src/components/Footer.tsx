import { useCallback, useEffect } from "react";
import {
  CONTACT_EMAIL,
  CV_FILENAME,
  CV_PATH,
  RESUME_FILENAME,
  RESUME_PATH,
} from "../lib/contact";
import { cycleTheme, useTheme } from "../lib/theme";

/**
 * Footer — the record's close: the ways out, then the colophon.
 *
 * A designed end rather than a sitemap. The real destinations sit on one line
 * and the colophon carries the imprint, the full name and the source link. The
 * name is not painted again as a display line above them: the record already
 * opened with it, and the colophon states it once, where a reader looks for it.
 * The theme control lives here because it is a document setting, not a
 * destination.
 *
 * The two documents belong to the routes that have no cover. On `/` the first
 * screen already offers the pair as its primary action, and the footer used to
 * repeat them in the same closing viewport; on `/experience` and `/projects`
 * there is no cover, so the footer is the only place the pair survives. The
 * condition is the resolved route id, not the raw path, so a trailing slash or
 * a retired URL cannot produce a second copy on the record.
 *
 * The source link owns its 44px target through the anchor's own box
 * (`inline-block min-h-11 min-w-11` with the negative margin that cancels the
 * line-box growth), so the element that receives the pointer, paints the focus
 * ring and shows up in hit-testing is the anchor itself.
 */

const YEAR = new Date().getFullYear();

/**
 * The three contact links are the smallest targets on the page: at 13px the
 * labels are narrower than 44px on their own, so each anchor carries the floor
 * on BOTH axes (`min-h-11 min-w-11`) and centres its label in the widened box.
 * The element that receives the pointer, paints the focus ring and shows up in
 * hit-testing is the anchor itself.
 */
const LINK_FLOOR =
  "flex min-h-11 min-w-11 items-center justify-center text-[0.8125rem] font-medium text-text-muted transition-colors duration-link hover:text-text hover:underline";

export function Footer({ routeId = "record" }: { routeId?: string }) {
  const [themePreference] = useTheme();
  const cycleThemeHandler = useCallback(() => {
    cycleTheme();
  }, []);

  /* A cover route already owns the pair; only the two detail routes need the
     footer copy. A 404 has no documents either — it is not a reading route.
     App passes the resolved route id, so a trailing slash or a retired path
     cannot put a second pair on the record; the prop default keeps a standalone
     render (and any document without a router) on the record's behaviour. */
  const showDocuments = routeId === "experience" || routeId === "projects";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "F2" || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (document.querySelector("[data-mobile-menu], #mobile-nav:not([hidden])")) {
        return;
      }
      event.preventDefault();
      cycleThemeHandler();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycleThemeHandler]);

  const themeLabel = `${themePreference[0].toUpperCase()}${themePreference.slice(1)}`;

  return (
    <footer className="site-footer">
      <div className="frame">
        <div className="site-footer__rule">
          <nav aria-label="Footer" className="site-footer__links">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className={LINK_FLOOR}
            >
              Email me
            </a>
            <a
              href="https://github.com/nathwn12"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_FLOOR}
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/nathaniel-nikolai-l-184181261/"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_FLOOR}
            >
              LinkedIn
            </a>
            {showDocuments && (
              <>
                <a
                  href={RESUME_PATH}
                  download={RESUME_FILENAME}
                  className="text-action"
                >
                  Résumé (PDF)
                </a>
                <a
                  href={CV_PATH}
                  download={CV_FILENAME}
                  className="text-action"
                >
                  CV (PDF)
                </a>
              </>
            )}
            <button
              type="button"
              onClick={cycleThemeHandler}
              title="Switch the color scheme: light or dark (F2)"
              aria-label={`Color scheme: ${themePreference}. Activate to switch to the other scheme (F2).`}
              className="flex min-h-11 items-center text-[0.8125rem] font-medium text-text-muted transition-colors duration-field hover:text-text"
            >
              Theme: {themeLabel}
            </button>
          </nav>

          <p className="meta muted">© {YEAR} · Philippines, remote</p>
        </div>

        <p className="mt-4 text-[0.75rem] font-normal not-italic leading-snug text-text-muted">
          Colophon — © {YEAR} Nathaniel Nikolai Ladero. Set in Inter.{" "}
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
    </footer>
  );
}
