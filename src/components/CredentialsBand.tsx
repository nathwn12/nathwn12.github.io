import { credentials } from "../content/credentials";
import { Reveal } from "./Reveal";

/**
 * CredentialsBand — four verified credentials, one line each.
 *
 * The title and issuer are the content; the credential id and the issuer's
 * verification URL are the proof. Every link opens the issuer's public
 * verification page in a new tab, and its visible text says which credential
 * it verifies — never "verify" alone.
 */
export function CredentialsBand() {
  return (
    <section id="credentials" className="band" aria-labelledby="credentials-heading">
      <div className="frame">
        <Reveal>
          <h2 id="credentials-heading" className="h2">
            Credentials
          </h2>
        </Reveal>

        <ul className="mt-6 grid gap-x-10 md:grid-cols-2">
          {credentials.map((cert, index) => {
            const year = cert.date ? cert.date.split(" ").pop() : undefined;
            return (
              <Reveal
                key={cert.id}
                as="li"
                delayMs={index * 30}
                className="py-2.5"
              >
                <p className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
                  {cert.title}
                </p>
                <p className="meta muted mt-1">
                  {cert.issuer}
                  {year ? ` · ${year}` : ""} · ID {cert.id}
                </p>
                <a
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="accent-link meta inline-flex min-h-11 items-center"
                >
                  Verify {cert.title} at {cert.issuer}
                </a>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
