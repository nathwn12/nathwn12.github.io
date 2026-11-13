import {
  CONTACT_EMAIL,
  CV_FILENAME,
  CV_PATH,
  RESUME_FILENAME,
  RESUME_PATH,
} from "../lib/contact";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Footer — the instrument's bottom rail: the ways out, the one setting, the
 * imprint.
 *
 * Three columns rather than one run of links, because a footer that lists six
 * destinations in a row makes them all the same size. Contact, documents and
 * source are different kinds of exit and are drawn as such. The theme switch is
 * the only control here — a document setting, not a destination. Motion has no
 * control: it runs unless the OS asks for less.
 *
 * The imprint states the year, the place and the type, each as its own item: no
 * middle-dot meta string, no "© 2026 · Philippines, remote · set in …" run-on.
 *
 * The three contact anchors carry the 44px floor on both axes: at 13px the
 * labels are narrower than 44px on their own, so the anchor owns the target, not
 * its text (pinned by tests/footer-target-size.test.ts).
 */

const YEAR = new Date().getFullYear();

const LINK_FLOOR =
  "flex min-h-11 min-w-11 items-center justify-center text-[0.8125rem] font-medium text-text-muted transition-colors duration-link hover:text-text hover:underline";

export function Footer() {
  return (
    <footer className="colophon">
      <div className="frame">
        <div className="colophon__top">
          <div className="colophon__mark">
            <img
              src="/brand/signature.svg"
              alt="nathwn12"
              width="32"
              height="32"
              draggable={false}
            />
          </div>

          <nav aria-label="Ways out" className="colophon__ways">
            <div className="colophon__col">
              <p className="data colophon__label">Contact</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className={LINK_FLOOR}>
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
            </div>

            <div className="colophon__col">
              <p className="data colophon__label">Documents</p>
              <a
                href={RESUME_PATH}
                download={RESUME_FILENAME}
                className="colophon__doc"
              >
                Résumé (PDF)
              </a>
              <a href={CV_PATH} download={CV_FILENAME} className="colophon__doc">
                CV (PDF)
              </a>
            </div>

            <div className="colophon__col">
              <p className="data colophon__label">Source</p>
              <a
                href="https://github.com/nathwn12/nathwn12.github.io"
                target="_blank"
                rel="noopener noreferrer"
                className="colophon__doc"
              >
                Source on GitHub
              </a>
              <ThemeToggle />
            </div>
          </nav>
        </div>

        <div className="colophon__imprint">
          <p className="data">© {YEAR} Nathaniel Nikolai Ladero.</p>
          <p className="data">Philippines, remote.</p>
          <p className="data">
            Set in Instrument Serif, Archivo and JetBrains Mono.
          </p>
        </div>
      </div>
    </footer>
  );
}
