import { useId, useState } from "react";
import {
  CV_FILENAME,
  CV_PATH,
  RESUME_FILENAME,
  RESUME_PATH,
} from "../lib/contact";
import { SectionLink, RouteLink } from "../lib/router";
import {
  CONTACT_CTA,
  contractLine,
  figures,
  measurement,
  measurementSwitch,
  name,
  queryFigure,
  standfirst,
  statusLine,
} from "../content/ledger";
import { employer } from "../content/experience";

/**
 * FirstScreen — identity on the left, one measurement on the right.
 *
 * The whole page's idea is in this screen: a claim, and the figure that backs
 * it. The measurement panel is the site's one live thing — a two-state control
 * that shows the same query before and after the provider change, on one
 * linear scale from zero to the before value, so the 60:1 ratio is felt rather
 * than only read.
 *
 * Both states are legible without touching the control: each button carries its
 * own value ("Before · 60 s", "After · <1 s"), the scale is labelled at both
 * ends, and the bar shows the selected magnitude against the full track. It is
 * a real two-button control with aria-pressed, it works from the keyboard, and
 * with JavaScript disabled the panel still shows the shipped "after" state and
 * its figure, because that is the default render.
 *
 * Composition: the right half is a compact instrument — label, figure, source,
 * one scale, the two-state control, and the note that traces the figure to the
 * experience page — top-aligned with the name so the two halves share one top
 * edge and the name stays the largest thing on the screen.
 */
export function FirstScreen() {
  const [state, setState] = useState<"before" | "after">("after");
  const groupId = useId();

  const scale = state === "before" ? 1 : 1 / 60;
  const value =
    state === "before" ? queryFigure.before : queryFigure.after;
  const source =
    state === "before" ? measurement.beforeName : measurement.afterName;
  const note =
    state === "before" ? measurement.beforeNote : measurement.afterNote;

  /* The track runs from zero to the "before" value, so the accent bar's length
     is a proportion of the slowest case, not of the current selection. */
  const scaleMax = queryFigure.before;

  const label = (text: string, figure: string | null) =>
    figure ? `${text} · ${figure}` : text;

  return (
    <section className="band band--first" aria-labelledby="identity-heading">
      <div className="frame">
        <div className="grid gap-y-10 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-7">
            <h1 id="identity-heading" className="h1">
              {name}
            </h1>

            <p className="lede mt-4 max-w-[46ch]">{standfirst}</p>

            <p className="meta muted mt-4">
              {contractLine} · {employer.location} ·{" "}
              <span className="whitespace-nowrap">{employer.period}</span>
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-2">
              <SectionLink section="contact" className="button">
                {CONTACT_CTA}
              </SectionLink>
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
            </div>

            <p className="meta muted mt-5">
              <span
                aria-hidden="true"
                className="mr-2 inline-block size-2 bg-accent align-middle"
              />
              {statusLine}
            </p>
          </div>

          <div className="lg:col-span-5 lg:pl-4">
            <div className="measure">
              <div>
                <p className="meta muted">{measurement.label}</p>
                <p className="figure mt-2" aria-live="polite">
                  {value ?? "—"}
                </p>
                <p className="meta mt-2">
                  {source}
                  <span className="muted"> · {note}</span>
                </p>
              </div>

              <div>
                <div
                  aria-hidden="true"
                  className="measure__track"
                  role="presentation"
                >
                  <div className="measure__bar measure__bar--ghost" />
                  <div
                    className="measure__bar measure__bar--accent"
                    style={{ transform: `scaleX(${scale})` }}
                  />
                </div>
                {scaleMax ? (
                  <p className="measure__scale" aria-hidden="true">
                    <span>0 s</span>
                    <span>{scaleMax}</span>
                  </p>
                ) : null}
              </div>

              <div
                className="measure__switch"
                role="group"
                aria-labelledby={`${groupId}-label`}
              >
                <span id={`${groupId}-label`} className="sr-only">
                  {measurementSwitch.groupLabel}
                </span>
                <button
                  type="button"
                  aria-pressed={state === "before"}
                  onClick={() => setState("before")}
                >
                  {label(measurementSwitch.before, queryFigure.before)}
                </button>
                <button
                  type="button"
                  aria-pressed={state === "after"}
                  onClick={() => setState("after")}
                >
                  {label(measurementSwitch.after, queryFigure.after)}
                </button>
              </div>

              <p className="meta muted">
                {figures.paymentsPercent
                  ? `${figures.paymentsPercent} faster on production traffic. `
                  : ""}
                <RouteLink href="/experience" className="accent-link">
                  The timings are on the experience page.
                </RouteLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
