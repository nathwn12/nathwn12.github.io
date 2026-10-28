import { availability } from "../content/hero";
import {
  CONTACT_EMAIL,
  CV_PATH,
  GITHUB_URL,
  MAILTO,
  RESUME_PATH,
} from "../lib/contact";

const YEAR = 2026;

/**
 * Contact (paper): the availability line, four ledger rows (both documents,
 * email, GitHub), one note, and the colophon. No form and no relay: a mailto
 * link is the whole mechanism.
 */
export function ContactBand() {
  return (
    <section
      className="contact-band field-paper"
      id="contact"
      tabIndex={-1}
      aria-labelledby="contact-heading"
    >
      <div className="wrap">
        <h2 className="sr-only" id="contact-heading">
          Contact
        </h2>
        <p className="contact-lede" data-reveal>
          {availability}
        </p>

        <ul className="contact-rows">
          <li>
            <a href={RESUME_PATH} download>
              <span className="big">Résumé</span>
            </a>
          </li>
          <li>
            <a href={CV_PATH} download>
              <span className="big">CV</span>
            </a>
          </li>
          <li>
            <a href={MAILTO}>
              <span className="big">Email</span>
            </a>
          </li>
          <li>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <span className="big">GitHub</span>
            </a>
          </li>
        </ul>

        <p className="contact-note" data-reveal>
          Both documents are PDFs. Write to{" "}
          <a className="link" href={MAILTO}>
            {CONTACT_EMAIL}
          </a>
          . I read every note and usually answer within a day or two.
        </p>

        <footer className="site-foot">
          <span>Nathaniel Nikolai Ladero, backend developer.</span>
          <span>
            Philippines, remote. <span className="num">{YEAR}</span>.
          </span>
        </footer>
      </div>
    </section>
  );
}
