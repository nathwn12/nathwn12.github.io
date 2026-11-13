import { figures } from "../content/ledger";
import { provenance } from "../content/experience";
import { RouteLink } from "../lib/router";
import { countUp } from "../lib/motion";
import { Seam, useOnEnter } from "./Readout";
import { MarqueeFigures } from "./MarqueeFigures";

/**
 * ProofBand — the record, as measured.
 *
 * Seven figures exist on this page and they say it once each:
 *   • the strip carries the three results the band is actually about — the
 *     payment latency, the read latency, and the zero security findings — each
 *     counting up once, the first time the band is seen, and each rendering its
 *     final value in the DOM from the first paint, so a visitor with no
 *     JavaScript, no motion, or a screen reader gets the number and not a zero;
 *   • the provenance sentence carries the recovery story, once, in prose: the
 *     ledger was rebuilt by scanning twenty-one internal repositories after the
 *     company closed, and 1,182 commits across 17 repositories came back;
 *   • the marquee is the ambient repeat of the whole set.
 *
 * The seven-on-one-strip version stated the inventory twice inside 400px — the
 * count of commits in a cell and again in the sentence directly beneath it —
 * and then a third time as the marquee crossed. A figure repeated in the same
 * eyeful reads as a page that does not know what it has said.
 *
 * The strip is one grid with two rows — every value on the first, every label on
 * the second — so the figures share a baseline even when a label wraps, and each
 * figure opens on its own hairline, aligned with the others.
 */

interface Figure {
  /** The final value, exactly as it must read with motion off. */
  value: string;
  /** What the number counts up to. */
  target: number;
  /** Which format the tween writes. */
  format: "grouped" | "plain" | "percent" | "percentPlus";
  label: string;
  /** True for the three results the strip states; the rest are the marquee's. */
  proof?: boolean;
}

const percentNumber = (text: string | null): number | null =>
  text ? Number(text.replace(/[^\d.]/g, "")) : null;

const payments = percentNumber(figures.paymentsPercent);
const readLatency = percentNumber(figures.readLatency);

/** The seven figures, in the order they are read. A null is dropped, not faked. */
const RECORD_FIGURE_CANDIDATES: Array<Figure | null> = [
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
        proof: true,
      }
    : null,
  readLatency !== null
    ? {
        value: `−${readLatency}%+`,
        target: readLatency,
        format: "percentPlus" as const,
        label: "read latency on high-traffic tables",
        proof: true,
      }
    : null,
  {
    value: "0",
    target: 0,
    format: "plain" as const,
    label: "high or critical Snyk findings",
    proof: true,
  },
];

/** The seven, for the marquee: the ambient repeat of the whole set. A null is
 *  dropped rather than faked, so a figure that cannot be derived is absent. */
export const RECORD_FIGURES: Figure[] = RECORD_FIGURE_CANDIDATES.filter(
  (figure): figure is Figure => figure !== null,
);

/** The three results that were measured in production: what the strip states. */
export const PROOF_FIGURES: Figure[] = RECORD_FIGURES.filter(
  (figure) => figure.proof,
);

/** Hardcoded, because Tailwind only sees a class it can read in the source. */
const COLUMNS = ["sm:col-start-1", "sm:col-start-2", "sm:col-start-3"] as const;

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
        className="py-[var(--rec-rhythm)] md:py-[var(--rec-rhythm-lg)]"
      >
        <div className="frame">
          <h2
            id="proof-heading"
            className="font-display text-[length:var(--rec-text-claim)] leading-[var(--rec-leading-claim)] font-normal! tracking-[var(--rec-tracking-claim)]! text-[color:var(--rec-ink)]"
          >
            What the record shows
          </h2>

          {/* Below `sm` each figure is its own ruled row; from `sm` up the
              wrappers dissolve (`contents`) and the dl itself is the grid, so a
              wrapped label cannot push its number off the shared baseline. */}
          <dl
            ref={stripRef}
            className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-3 sm:grid-rows-[auto_auto] sm:gap-y-3"
          >
            {PROOF_FIGURES.map((figure, index) => (
              <div
                key={figure.label}
                className="border-t border-[color:var(--rec-rule)] py-4 sm:contents"
              >
                <dd
                  data-target={figure.target}
                  data-format={figure.format}
                  className={`font-mono text-[length:clamp(1.75rem,1.2rem+1.6vw,2.25rem)] leading-none tracking-[-0.02em] tabular-nums text-[color:var(--rec-measure)] sm:row-start-1 sm:self-end sm:border-t sm:border-[color:var(--rec-rule)] sm:pt-4 ${COLUMNS[index]}`}
                >
                  {figure.value}
                </dd>
                <dt className="mt-3 max-w-[26ch] text-[0.8125rem] leading-[1.4] text-[color:var(--rec-ink-muted)] sm:row-start-2 sm:mt-0 sm:self-start">
                  {figure.label}
                </dt>
              </div>
            ))}
          </dl>

          {/* The recovery story, once, in prose — and the way into the detail
              route on the frame's own right edge. A rule above it, no box: the
              band is a column of the record, not a card on it. */}
          <div className="mt-8 grid gap-x-12 gap-y-4 border-t border-[color:var(--rec-rule)] pt-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-baseline">
            <p className="max-w-[62ch] text-[0.9375rem] leading-[1.55] text-[color:var(--rec-ink-muted)]">
              {provenance}
            </p>
            <RouteLink
              href="/experience"
              className="data inline-flex min-h-11 items-center border-b border-[color:var(--rec-rule-strong)] text-[color:var(--rec-signal)] transition-[color,border-color] duration-150 hover:border-[color:var(--rec-signal)]"
            >
              Read the delivered record
            </RouteLink>
          </div>
        </div>
      </section>

      <MarqueeFigures
        items={RECORD_FIGURES.map((figure) => ({
          value: figure.value,
          label: figure.label,
        }))}
      />
    </>
  );
}
