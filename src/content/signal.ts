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

/** Fixed-bottom readout: measured pushes and milestones, then plain claims. */
const pushes = [...probe.repos]
  .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))
  .slice(0, 4)
  .map((repo) => `pushed ${repo.name} / ${repo.pushedAt.slice(5)}`);
const milestones = [...packages]
  .sort((a, b) => b.month - a.month)
  .slice(0, 3)
  .map((item) => `${item.name} ${fmt(item.month)} in 30 days`);
const voices = [
  "one binary, two engines",
  "the real screen, no cursor moved",
  "spec in, tests out, then review",
  "bounded tools for a real browser",
  "built and maintained solo",
];

export const signal = {
  snapshotDate: downloads.snapshotDate,
  stamp: `npm measured ${through} · github annual through ${githubThrough}`,
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
  ticker: [...pushes, ...milestones, ...voices],
} as const;

/** The method as a spec sheet: short imperatives, no lede over one line. */
export const specLines = [
  { key: "INVESTIGATE", value: "code before changing it" },
  { key: "SPEC", value: "written brief, then tests, then review" },
  { key: "RUN", value: "local models beside hosted tools" },
  { key: "BUILD", value: "bounded ways into a real browser" },
  { key: "VERIFY", value: "what the model actually did" },
] as const;
