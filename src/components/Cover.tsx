import type { CSSProperties } from "react";
import {
  availability,
  coreStack,
  heroClaim,
} from "../content/hero";
import {
  commitTotal,
  employer,
  formerRoleLine,
  repositoryCount,
  tenureSpan,
} from "../content/experience";
import {
  CONTACT_EMAIL,
  CV_PATH,
  MAILTO,
  RESUME_PATH,
} from "../lib/contact";
import { RouteLink } from "../lib/router";

const load = (delay: number): CSSProperties =>
  ({ "--d": `${delay}ms` }) as CSSProperties;

const line = (index: number): CSSProperties =>
  ({ "--i": index }) as CSSProperties;

/**
 * The cover: the whole argument in one green field. Name, claim, the stack and
 * the former role, both documents and the email; availability and the recovered
 * commit fact on the right. The only motion is the masked two-line name rise
 * and a short rail of load rises; both resolve under reduced motion.
 */
export function Cover() {
  return (
    <section className="hero field-green" aria-labelledby="name">
      <div className="hero-body wrap">
        <div className="hero-title">
          <h1 className="hero-name" id="name" aria-label="Nathaniel Nikolai Ladero">
            <span className="line">
              <span className="wide" style={line(0)} aria-hidden="true">
                Nathaniel Nikolai
              </span>
              <span className="narrow" style={line(0)} aria-hidden="true">
                Nathaniel
              </span>
            </span>
            <span className="line">
              <span className="wide" style={line(1)} aria-hidden="true">
                Ladero
              </span>
              <span className="narrow" style={line(1)} aria-hidden="true">
                Nikolai Ladero
              </span>
            </span>
          </h1>
          <p className="hero-claim" data-load style={load(360)}>
            {heroClaim}
          </p>
        </div>

        <div className="hero-lower">
          <div>
            <p className="hero-stack" data-load style={load(440)}>
              {coreStack}
            </p>
            <p className="hero-former" data-load style={load(480)}>
              {formerRoleLine}.
              <span className="former-when">
                {tenureSpan}, {employer.location.toLowerCase()}.
              </span>
            </p>
            <div className="hero-actions" data-load style={load(520)}>
              <a className="btn btn-solid" href={RESUME_PATH} download>
                Résumé (PDF)
              </a>
              <a className="text-link" href={CV_PATH} download>
                CV (PDF)
              </a>
              <a className="text-link" href={MAILTO}>
                Email Nathaniel
                <span className="sr-only"> at {CONTACT_EMAIL}</span>
              </a>
            </div>
          </div>

          <div className="hero-side" data-load style={load(600)}>
            <p className="hero-avail">{availability}</p>
            <p className="hero-fact">
              <strong>{commitTotal.toLocaleString("en-US")}</strong> commits
              across <strong>{repositoryCount}</strong> repositories,{" "}
              <span className="num">2023–2026</span>.
            </p>
            <RouteLink className="text-link hero-record-link" href="/record">
              Read the record
            </RouteLink>
          </div>
        </div>
      </div>
    </section>
  );
}
