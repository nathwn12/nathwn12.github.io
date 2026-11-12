import { figures } from "../content/ledger";
import { provenance } from "../content/experience";
import { RouteLink } from "../lib/router";
import { countUp } from "../lib/motion";
import { Seam, useOnEnter } from "./Readout";
import { MarqueeFigures } from "./MarqueeFigures";

/**
 * ProofBand — the record, as measured.
 *
 * Seven readouts on one hairline strip: the recovered commits, the repositories
 * that carry them, the tools, the packages, and the three results that were
 * measured in production. Each one counts up once, the first time the band is
 * seen — and each one renders its final value in the DOM from the first paint,
 * so a visitor with no JavaScript, no motion, or a screen reader gets the
 * number and not a zero. The script starts the count from zero; the document
 * never contains a placeholder.
 *
 * The provenance sentence sits under the strip in its own hairline panel rather
 * than as a caption, because it is the strongest sentence on the page: the
 * ledger was rebuilt by scanning twenty-one internal repositories after the
 * company closed, and the figures above are what came back.
 *
 * The marquee repeats the same seven figures across the seam below the band. It
 * is the only looping thing on the site, its duplicate copy is `aria-hidden`,
 * and it stops on hover, on focus, and entirely when motion is off.
 */

interface Figure {
  /** The final value, exactly as it must read with motion off. */
  value: string;
  /** What the number counts up to. */
  target: number;
  /** Which format the tween writes. */
  format: "grouped" | "plain" | "percent" | "percentPlus";
  label: string;
}

const percentNumber = (text: string | null): number | null =>
  text ? Number(text.replace(/[^\d.]/g, "")) : null;

const payments = percentNumber(figures.paymentsPercent);
const readLatency = percentNumber(figures.readLatency);

/** The seven figures, in the order they are read. A null is dropped, not faked. */
export const PROOF_FIGURES: Figure[] = [
  figures.commits
    ? {
        value: figures.commits,
        target: Number(figures.commits.replace(/,/g, "")),
        format: "grouped" as const,
        label: "commits recovered",
      }
    : null,
  figures.repositories
    ? {
        value: figures.repositories,
        target: Number(figures.repositories),
        format: "plain" as const,
        label: "repositories carrying the work",
      }
    : null,
  {
    value: String(figures.projectCount),
    target: figures.projectCount,
    format: "plain" as const,
    label: "open-source tools published",
  },
  {
    value: String(figures.packageCount),
    target: figures.packageCount,
    format: "plain" as const,
    label: "packages in the atlas",
  },
  payments !== null
    ? {
        value: `−${payments}%`,
        target: payments,
        format: "percent" as const,
        label: "payment latency, after the provider change",
      }
    : null,
  readLatency !== null
    ? {
        value: `−${readLatency}%+`,
        target: readLatency,
        format: "percentPlus" as const,
        label: "read latency on high-traffic tables",
      }
    : null,
  {
    value: "0",
    target: 0,
    format: "plain" as const,
    label: "high or critical Snyk findings",
  },
].filter((figure): figure is Figure => figure !== null);

/** Write a counted value in the figure's own format. */
function formatFigure(format: Figure["format"], value: number): string {
  if (format === "grouped") return Math.round(value).toLocaleString("en-US");
  if (format === "percent") return `−${Math.round(value)}%`;
  if (format === "percentPlus") return `−${Math.round(value)}%+`;
  return String(Math.round(value));
}

export function ProofBand() {
  const stripRef = useOnEnter<HTMLDListElement>(() => {
    const strip = stripRef.current;
    if (!strip) return;
    for (const cell of strip.querySelectorAll<HTMLElement>("[data-target]")) {
      const target = Number(cell.dataset.target ?? "0");
      const format = (cell.dataset.format ?? "plain") as Figure["format"];
      countUp(cell, target, (value) => formatFigure(format, value));
    }
  });

  return (
    <>
      <Seam />
      <section
        id="proof"
        aria-labelledby="proof-heading"
        className="py-[var(--rec-band)] md:py-[var(--rec-band-lg)]"
      >
        <div className="frame">
          <h2
            id="proof-heading"
            className="font-display text-[length:var(--rec-text-claim)] leading-[var(--rec-leading-claim)] font-normal! tracking-[var(--rec-tracking-claim)]! text-[color:var(--rec-ink)]"
          >
            What the record shows
          </h2>

          <dl
            ref={stripRef}
            className="mt-8 grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-7"
          >
            {PROOF_FIGURES.map((figure) => (
              <div
                key={figure.label}
                className="flex flex-col-reverse gap-3 border-t border-[color:var(--rec-rule)] py-4"
              >
                <dt className="max-w-[22ch] text-[0.8125rem] leading-[1.4] text-[color:var(--rec-ink-muted)]">
                  {figure.label}
                </dt>
                <dd
                  data-target={figure.target}
                  data-format={figure.format}
                  className="font-mono text-[length:clamp(1.5rem,1.1rem+1.2vw,2rem)] leading-none tracking-[-0.02em] tabular-nums text-[color:var(--rec-measure)]"
                >
                  {figure.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 border border-[color:var(--rec-rule)] p-5 md:p-6">
            <p className="max-w-[72ch] text-[0.9375rem] leading-[1.55] text-[color:var(--rec-ink-muted)]">
              {provenance}
            </p>
            <p>
              <RouteLink
                href="/experience"
                className="data mt-2 inline-flex min-h-11 items-center text-[color:var(--rec-signal)] underline decoration-[color:var(--rec-rule-strong)] decoration-1 underline-offset-[0.3em] transition-[color,text-decoration-color,border-color] duration-150 hover:decoration-[color:var(--rec-signal)]"
              >
                Read the delivered record
              </RouteLink>
            </p>
          </div>
        </div>
      </section>

      <MarqueeFigures
        items={PROOF_FIGURES.map((figure) => ({
          value: figure.value,
          label: figure.label,
        }))}
      />
    </>
  );
}
