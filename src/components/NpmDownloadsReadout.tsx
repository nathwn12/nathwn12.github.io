import snapshot from "../content/npm-downloads.json";
import packageNames from "../content/npm-packages.json";
import {
  downloadSnapshotFreshness,
  type NpmDownloadSnapshot,
} from "../lib/npm-downloads";

const data = snapshot as NpmDownloadSnapshot;

const freshness = downloadSnapshotFreshness(
  data,
  new Date(),
  packageNames,
);

const number = new Intl.NumberFormat("en-US");
const date = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export function NpmDownloadsReadout() {
  const available = freshness.status !== "unavailable";
  return (
    <section
      className="mt-6 border-t border-[color:var(--rec-rule)] pt-4"
      aria-labelledby="npm-downloads-heading"
      data-npm-downloads
      data-freshness={freshness.status}
    >
      <h2
        id="npm-downloads-heading"
        className="data text-[color:var(--rec-ink-muted)]"
      >
        All-time npm package downloads
      </h2>
      <p className="mt-1 font-mono text-[clamp(1.75rem,1.2rem+1.6vw,2.25rem)] leading-none tabular-nums text-[color:var(--rec-measure)]">
        {available ? number.format(data.total) : "Unavailable"}
      </p>
      <p className="mt-2 max-w-[46ch] text-[0.8125rem] leading-[1.5] text-[color:var(--rec-ink-muted)]">
        {available
          ? `Sum of downloads for ${data.packages.length} packages, from each package's npm registration date through ${date(data.snapshotDate)}. Source: npm download-count API.`
          : "No complete npm download snapshot is available."}
      </p>
      <p
        className="data data--sm mt-2 text-[color:var(--rec-ink-muted)]"
        role="status"
        aria-live="polite"
      >
        {freshness.status === "fresh" && `Snapshot through ${date(data.snapshotDate)}`}
        {freshness.status === "stale" &&
          `Update delayed; last complete snapshot through ${date(data.snapshotDate)}`}
        {freshness.status === "unavailable" &&
          "Download data unavailable; no complete total is shown"}
      </p>
      {available && (
        <>
          <p className="mt-2 max-w-[46ch] text-[0.8125rem] leading-[1.5] text-[color:var(--rec-ink-muted)]">
            Package download events are summed; this is not a count of unique
            people or installs. Refreshed weekly when npm data is available.
          </p>
          <p className="data mt-4 text-[color:var(--rec-ink-muted)]">
            Included packages
          </p>
          <ul className="data data--sm mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {data.packages.map(({ name }) => (
              <li key={name} className="min-w-0">
                <a
                  href={`https://www.npmjs.com/package/${encodeURIComponent(name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-[color:var(--rec-signal)] underline decoration-1 underline-offset-[0.2em]"
                >
                  {name}
                  <span className="sr-only"> on npm, opens in a new tab</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
