import { credentials } from "../content/credentials";
import { Seam } from "./Readout";

/**
 * CredentialsBand — four verified credentials, one row each.
 *
 * A hairline list, not a grid of badges: the credential, its issuer and date in
 * mono, its identifier, and the issuer's own verification page. Every
 * verification link opens in a new tab with `rel="noopener noreferrer"`.
 *
 * The link column has one left edge. The track is sized to its widest label and
 * the links start in it, so all four rows share an x and the column still ends
 * on the frame; right-aligning them (the old `justify-self-end`) gave each row
 * whatever left edge its own label's width allowed, which is two left edges in
 * four rows. The visible text is `Verify` on every row — the issuer is already
 * on the row's meta line two lines above it — and each link's accessible name
 * names the credential and its issuer, so a uniform column does not cost a link
 * that says nothing about where it goes. `whitespace-nowrap` is the belt to that
 * brace: a label can never wrap a row taller than its siblings.
 *
 * The meta line is the cover's fact-row shape: one row of cells separated by
 * hairlines from `sm` up, each cell nowrap. Below `sm` the row folds and the
 * separators go with it — a rule at the start of a wrapped line is a stranded
 * mark, not a separator.
 */

export function CredentialsBand() {
  return (
    <>
      <Seam />
      <section
        id="credentials"
        aria-labelledby="credentials-heading"
        className="pt-[var(--rec-rhythm)] pb-0 md:pt-[var(--rec-rhythm-lg)]"
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
                className="grid gap-x-8 gap-y-2 border-b border-[color:var(--rec-rule)] py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_max-content] md:items-baseline"
              >
                <div>
                  <p className="font-semibold tracking-[-0.01em] text-[color:var(--rec-ink)]">
                    {cert.title}
                  </p>
                  <ul className="data data--sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[color:var(--rec-ink-muted)] sm:gap-x-5">
                    {[cert.issuer, cert.date, `ID ${cert.id}`]
                      .filter(Boolean)
                      .map((field, index) => (
                        <li
                          key={field}
                          className={
                            index === 0
                              ? "whitespace-nowrap"
                              : "whitespace-nowrap sm:border-l sm:border-[color:var(--rec-rule)] sm:pl-5"
                          }
                        >
                          {field}
                        </li>
                      ))}
                  </ul>
                </div>
                <a
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Verify ${cert.title} at ${cert.issuer}`}
                  className="data data--sm inline-flex min-h-11 items-center whitespace-nowrap text-[color:var(--rec-signal)] underline decoration-[color:var(--rec-rule-strong)] decoration-1 underline-offset-[0.3em] transition-[color,text-decoration-color,border-color] duration-150 hover:decoration-[color:var(--rec-signal)] md:justify-self-start"
                >
                  Verify
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

