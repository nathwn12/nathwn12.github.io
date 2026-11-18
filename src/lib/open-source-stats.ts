import type { NpmDownloadSnapshot } from "./npm-downloads";

export interface OpenSourceStatsSnapshot {
  source: string;
  generatedAt: string;
  snapshotDate: string;
  npmMonth: number;
  npmAllTime: number;
  packages: { name: string; month: number; allTime: number }[];
  github: {
    contributions: number;
    commits: number;
    pullRequests: number;
    calendarRange: [string, string];
  };
  activity: { date: string; value: number }[];
}

export interface ActivityCell {
  date: string;
  value: number;
  level: number;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const STRIP_DAYS = 30;

const isCount = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;

const nextDate = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);

/**
 * The this-month npm figure is shown only when the whole measurement agrees:
 * the same settlement date as the committed all-time snapshot, the exact
 * package inventory in order, per-package months summing to the total, and the
 * all-time figures matching the other committed snapshot. Anything else is
 * `null`, which the readout renders as "unavailable" — never a guess and never
 * a partial sum.
 */
export function monthFigure(
  value: unknown,
  expectedNames: readonly string[],
  npmSnapshot: NpmDownloadSnapshot,
): number | null {
  if (!value || typeof value !== "object") return null;
  const stats = value as Partial<OpenSourceStatsSnapshot>;
  if (
    typeof stats.snapshotDate !== "string" ||
    !DATE.test(stats.snapshotDate) ||
    stats.snapshotDate !== npmSnapshot.snapshotDate ||
    !isCount(stats.npmMonth) ||
    !isCount(stats.npmAllTime) ||
    stats.npmAllTime !== npmSnapshot.total ||
    !Array.isArray(stats.packages) ||
    stats.packages.length !== expectedNames.length
  ) {
    return null;
  }
  const committed = new Map(npmSnapshot.packages.map((item) => [item.name, item.downloads]));
  if (
    stats.packages.some(
      (item, index) =>
        !item ||
        item.name !== expectedNames[index] ||
        !isCount(item.month) ||
        !isCount(item.allTime) ||
        committed.get(item.name) !== item.allTime,
    )
  ) {
    return null;
  }
  if (stats.packages.reduce((sum, item) => sum + item.month, 0) !== stats.npmMonth) {
    return null;
  }
  return stats.npmMonth;
}

/** One 12-month GitHub figure, or null when the committed value is not a count. */
export function githubFigure(
  value: unknown,
  key: "contributions" | "commits" | "pullRequests",
): number | null {
  if (!value || typeof value !== "object") return null;
  const github = (value as Partial<OpenSourceStatsSnapshot>).github;
  if (!github || typeof github !== "object") return null;
  return isCount(github[key]) ? github[key] : null;
}

/**
 * The daily strip, oldest first. A date inside the window that the committed
 * calendar does not carry throws: a missing day is missing data, never a
 * zero-activity day. Levels are thirds of the active days, so a busy month
 * still shows contrast and a zero stays the empty tone.
 */
export function activityCells(value: unknown): ActivityCell[] {
  if (!value || typeof value !== "object") throw new Error("no committed activity calendar");
  const stats = value as Partial<OpenSourceStatsSnapshot>;
  if (!Array.isArray(stats.activity) || stats.activity.length !== STRIP_DAYS) {
    throw new Error(`the activity calendar must hold ${STRIP_DAYS} days`);
  }
  const days = stats.activity;
  for (const day of days) {
    if (!day || typeof day.date !== "string" || !DATE.test(day.date)) {
      throw new Error("the activity calendar holds an invalid date");
    }
    if (!isCount(day.value)) throw new Error(`invalid activity count for ${day.date}`);
  }
  const cursor = days.reduce((previous, day) => {
    if (previous && nextDate(previous, 1) !== day.date) {
      throw new Error(`the activity calendar is missing ${nextDate(previous, 1)}`);
    }
    return day.date;
  }, "" as string);
  if (!cursor || !DATE.test(cursor)) throw new Error("the activity calendar is empty");
  if (
    !Array.isArray(stats.github?.calendarRange) ||
    stats.github.calendarRange[1] !== cursor
  ) {
    throw new Error("the activity calendar and its stated range disagree");
  }

  const active = days
    .map((day) => day.value)
    .filter((value) => value > 0)
    .sort((a, b) => a - b);
  const at = (fraction: number) =>
    active[Math.min(active.length - 1, Math.floor(fraction * active.length))] ?? 0;
  const [low, high] = [at(1 / 3), at(2 / 3)];
  const level = (value: number) =>
    value === 0 ? 0 : value <= low ? 1 : value <= high ? 2 : 3;
  return days.map((day) => ({ ...day, level: level(day.value) }));
}

/**
 * The GitHub figures and the npm figures are written by the same daily job into
 * one committed measurement, so they share one honesty contract. Ten days holds
 * a week of missed scheduled runs and the three-day npm settlement offset; past
 * that the readout degrades rather than presenting an ageing number as current.
 */
export const MAX_GITHUB_FRESH_DAYS = 10;

export function githubSnapshotAgeDays(value: unknown, now = new Date()): number | null {
  if (!value || typeof value !== "object") return null;
  const snapshotDate = (value as Partial<OpenSourceStatsSnapshot>).snapshotDate;
  if (typeof snapshotDate !== "string" || !DATE.test(snapshotDate)) return null;
  const snapshotMs = Date.parse(`${snapshotDate}T00:00:00Z`);
  const todayMs = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  if (
    !Number.isFinite(snapshotMs) ||
    new Date(snapshotMs).toISOString().slice(0, 10) !== snapshotDate ||
    snapshotMs > todayMs
  ) {
    return null;
  }
  return (todayMs - snapshotMs) / DAY_MS;
}

/** The measurement date, formatted without retyping a figure in a component. */
export function formatThrough(snapshotDate: string): string {
  return new Date(`${snapshotDate}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** The accessible text alternative for the strip, stated once beside it. */
export function activitySummary(cells: readonly ActivityCell[]): string {
  const active = cells.filter((cell) => cell.value > 0).length;
  return `${active} active days from ${cells[0]!.date} through ${cells[cells.length - 1]!.date}`;
}
