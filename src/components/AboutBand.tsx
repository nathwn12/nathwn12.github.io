import type { CSSProperties } from "react";
import { credentials } from "../content/credentials";
import {
  aboutDetail,
  aboutStatement,
  employer,
  tenureSpan,
} from "../content/experience";
import { coreStackList } from "../content/hero";
import { RouteLink } from "../lib/router";

const reveal = (delay: number): CSSProperties =>
  ({ "--d": `${delay}ms` }) as CSSProperties;

/**
 * About (paper): one statement, the four fact columns, the core stack, and the
 * four verifiable credentials. "Worked: Remote" is bound to the closed tenure —
 * it is a fact about the Xentra years, never a current location preference.
 */
export function AboutBand() {
  return (
    <section className="about band field-paper" aria-labelledby="about-heading">
      <div className="wrap">
        <h2 className="head" id="about-heading" data-reveal>
          About
        </h2>

        <div className="about-top">
          <div className="about-copy">
            <p className="about-statement" data-reveal style={reveal(60)}>
              {aboutStatement}
            </p>
            <p className="about-detail" data-reveal style={reveal(80)}>
              {aboutDetail}
            </p>
          </div>
          <p className="about-more" data-reveal style={reveal(100)}>
            <RouteLink className="text-link" href="/record">
              Read the full record
            </RouteLink>
          </p>
        </div>

        <dl className="about-facts" data-reveal style={reveal(140)}>
          <div>
            <dt>Based in</dt>
            <dd>Philippines</dd>
          </div>
          <div>
            <dt>Worked</dt>
            <dd>Remote</dd>
          </div>
          <div>
            <dt>Tenure</dt>
            <dd className="num">{tenureSpan}</dd>
          </div>
          <div>
            <dt>Former role</dt>
            <dd>
              {employer.role}, {employer.company}
            </dd>
          </div>
          <div className="wide">
            <dt>Core stack</dt>
            <dd>{coreStackList.join(", ")}</dd>
          </div>
        </dl>

        <div className="credentials">
          <h3 data-reveal>Credentials</h3>
          <ul className="credential-list" data-reveal style={reveal(80)}>
            {credentials.map((credential) => (
              <li key={credential.id}>
                <span className="cert">{credential.title}</span>
                <span className="issuer">
                  {credential.issuer}, {credential.date}
                </span>
                <a
                  className="verify link"
                  href={credential.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Verify ${credential.title} at ${credential.issuer}`}
                >
                  Verify
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
