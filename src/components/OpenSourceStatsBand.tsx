import npmSnapshot from "../content/npm-downloads.json";
import packageNames from "../content/npm-packages.json";
import stats from "../content/open-source-stats.json";
import {
  downloadSnapshotFreshness,
  type NpmDownloadSnapshot,
} from "../lib/npm-downloads";
import {
  activityCells,
  activitySummary,
  formatThrough,
  githubFigure,
  monthFigure,
  type OpenSourceStatsSnapshot,
} from "../lib/open-source-stats";

const figures = stats as OpenSourceStatsSnapshot;
const npm = npmSnapshot as NpmDownloadSnapshot;
const format = new Intl.NumberFormat("en-US");

const fresh = downloadSnapshotFreshness(npm, new Date(), packageNames).status !== "unavailable";
const month = fresh ? monthFigure(figures, packageNames, npm) : null;
const contributions = githubFigure(figures, "contributions");
const commits = githubFigure(figures, "commits");
const strip = (() => {
  try {
    return activityCells(figures);
  } catch {
    return null;
  }
})();

/** A static band: every value comes from a committed measurement, and a figure
    that cannot be validated renders as unavailable instead of a guess. The
    strip is decorative; its text alternative carries the same facts. */
export function OpenSourceStatsBand() {
  return (
    <div className="oss-band" role="group" aria-labelledby="oss-heading" data-open-source-stats>
      <p id="oss-heading" className="oss-head">Open-source record</p>
      <dl className="oss-grid">
        <div className="oss-item">
          <dt className="oss-label">npm downloads · this month</dt>
          <dd className="oss-value">{month === null ? "unavailable" : format.format(month)}</dd>
        </div>
        <div className="oss-item">
          <dt className="oss-label">GitHub contributions · last twelve months</dt>
          <dd className="oss-value">{contributions === null ? "unavailable" : format.format(contributions)}</dd>
        </div>
        <div className="oss-item">
          <dt className="oss-label">GitHub commits · last twelve months</dt>
          <dd className="oss-value">{commits === null ? "unavailable" : format.format(commits)}</dd>
        </div>
      </dl>
      {strip ? (
        <div className="oss-strip-wrap">
          <p className="oss-label">daily GitHub activity</p>
          <div className="oss-strip" aria-hidden="true">
            {strip.map((cell) => (
              <span key={cell.date} className="oss-cell" data-level={cell.level} />
            ))}
          </div>
          <p className="oss-note">{activitySummary(strip)}</p>
        </div>
      ) : (
        <p className="oss-note">Daily GitHub activity unavailable.</p>
      )}
      <p className="oss-note">
        Measured by a committed snapshot through {formatThrough(npm.snapshotDate)}. Sources: npm
        download-count API and GitHub GraphQL.
      </p>
    </div>
  );
}
