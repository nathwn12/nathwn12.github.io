import downloads from "./npm-downloads.json";
import stats from "./open-source-stats.json";
import probe from "./repos.probe.json";
import npmPackages from "./npm-packages.json";
import {
  activityCells,
  activitySummary,
  formatThrough,
  githubFigure,
  monthFigure,
} from "../lib/open-source-stats";
import type { NpmDownloadSnapshot } from "../lib/npm-downloads";

/**
 * The signal cluster reads only committed snapshots. Nothing here is fetched,
 * guessed or retyped: a figure that the snapshots do not carry is absent.
 */
export const fmt = (value: number): string => value.toLocaleString("en-US");

const month = monthFigure(stats, npmPackages, downloads as NpmDownloadSnapshot);
if (month === null) {
  throw new Error("content/signal.ts: npm month and all-time snapshots disagree");
}

const commits = githubFigure(stats, "commits");
const contributions = githubFigure(stats, "contributions");
const pullRequests = githubFigure(stats, "pullRequests");
if (commits === null || contributions === null || pullRequests === null) {
  throw new Error("content/signal.ts: the committed GitHub figures are incomplete");
}

const cells = activityCells(stats);
const through = formatThrough(downloads.snapshotDate);
const githubThrough = formatThrough(stats.github.calendarRange[1]);

export interface SignalPackage {
  name: string;
  month: number;
  allTime: number;
  daily: number[];
  window: string;
}

const packages: SignalPackage[] = downloads.packages.map((item) => {
  const measured = stats.packages.find((entry) => entry.name === item.name);
  return {
    name: item.name,
    month: measured?.month ?? 0,
    allTime: item.downloads,
    daily: item.daily.map((day) => day.downloads),
    window: `${item.daily[0].day} — ${item.daily[item.daily.length - 1].day}`,
  };
});

/** The wide strip's curated line: non-figure milestones only. A number here
 *  would restate signal's own daily windows, so the notes name the work —
 *  hand-mcp's release week and the harness he drives daily, both from the
 *  committed content record. */
const milestones = [
  "hand-mcp published this week",
  "the OpenCode harness, driven daily",
];

export const signal = {
  snapshotDate: downloads.snapshotDate,
  stamp: `npm measured ${through} · GitHub annual through ${githubThrough}`,
  allTime: downloads.total,
  month,
  packages,
  cells,
  activityText: activitySummary(cells),
  github: {
    commits,
    contributions,
    pullRequests,
    range: `${stats.github.calendarRange[0]} — ${stats.github.calendarRange[1]}`,
  },
  repos: probe.repos.length,
  packageCount: npmPackages.length,
  /** One line that fits the wide strip; the chapters carry the rest. */
  ticker: milestones.slice(0, 2),
} as const;

/** The method as a spec sheet: short imperatives, no lede over one line. */
export const specLines = [
  { key: "INVESTIGATE", value: "code before changing it" },
  { key: "SPEC", value: "written brief, then tests, then review" },
  { key: "RUN", value: "local models beside hosted tools" },
  { key: "BUILD", value: "bounded ways into a real browser" },
  { key: "VERIFY", value: "what the model actually did" },
] as const;
