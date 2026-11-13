import { credentials } from "../content/credentials";
import { Seam } from "./Readout";

/**
 * CredentialsBand — four verified credentials, one row each.
 *
 * A hairline list, not a grid of badges: the credential, its issuer and date in
 * mono, its identifier, and the issuer's own verification page. Every
 * verification link opens in a new tab with `rel="noopener noreferrer"`, and
 * its visible text names the credential it verifies — never "verify" alone,
 * which is a link that says nothing about where it goes.
 */

export function CredentialsBand() {
  return (
    <>
      <Seam />
      <section
        id="credentials"
        aria-labelledby="credentials-heading"
        className="py-[var(--rec-rhythm)] md:py-[var(--rec-rhythm-lg)]"
      >
        <div className="frame">
          <h2
            id="credentials-heading"
            className="font-display text-[length:var(--rec-text-title)] leading-[var(--rec-leading-title)] font-normal! tracking-[var(--rec-tracking-claim)]! text-[color:var(--rec-ink)]"
          >
            Credentials
          </h2>

          <ul className="mt-6 border-t border-[color:var(--rec-rule)]">
            {credentials.map((cert) => (
              <li
                key={cert.id}
                className="grid gap-x-8 gap-y-2 border-b border-[color:var(--rec-rule)] py-4 md:grid-cols-[minmax(0,1fr)_11rem] md:items-baseline"
              >
                <div>
                  <p className="font-semibold tracking-[-0.01em] text-[color:var(--rec-ink)]">
                    {cert.title}
                  </p>
                  <p className="data data--sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[color:var(--rec-ink-muted)]">
                    <span>{cert.issuer}</span>
                    {cert.date ? <span>{cert.date}</span> : null}
                    <span>ID {cert.id}</span>
                  </p>
                </div>
                <a
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="data data--sm inline-flex min-h-11 items-center text-[color:var(--rec-signal)] underline decoration-[color:var(--rec-rule-strong)] decoration-1 underline-offset-[0.3em] transition-[color,text-decoration-color,border-color] duration-150 hover:decoration-[color:var(--rec-signal)] md:justify-self-end"
                >
                  Verify at {cert.issuer}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
