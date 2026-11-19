import { describe, expect, test } from "vitest";
import stats from "../src/content/open-source-stats.json";
import {
  activityCells,
  activitySummary,
  githubSnapshotAgeDays,
} from "../src/lib/open-source-stats";
import { recentDays } from "../scripts/open-source-stats.mjs";

const DAY_MS = 86_400_000;
const calendarDays = Array.from({ length: 30 }, (_, index) => ({
  date: new Date(Date.parse("2026-10-21T00:00:00Z") + index * DAY_MS)
    .toISOString()
    .slice(0, 10),
  value: index % 3,
}));
const calendar = {
  ...stats,
  activity: calendarDays,
  github: {
    ...stats.github,
    calendarRange: [calendarDays[0]!.date, calendarDays.at(-1)!.date] as [string, string],
  },
};

describe("the open-source measurement contract", () => {
  test("a missing calendar date throws, never reads as a zero-activity day", () => {
    expect(() =>
      recentDays(
        [
          { date: "2026-11-01", contributionCount: 1 },
          { date: "2026-11-03", contributionCount: 2 },
        ],
        3,
      ),
    ).toThrow(/missing 2026-11-02/);
    expect(() =>
      activityCells({
        ...calendar,
        activity: calendarDays.map((day, index) =>
          index === 7 ? { ...day, date: calendarDays[8]!.date } : day,
        ),
      }),
    ).toThrow(/missing/);
  });

  test("the strip has a text alternative and levels from the measured values", () => {
    const cells = activityCells(calendar);
    expect(cells).toHaveLength(30);
    expect(cells.every((cell) => cell.level >= 0 && cell.level <= 3)).toBe(true);
    expect(activitySummary(cells)).toContain("active days from");
    expect(activitySummary(cells)).toContain(calendarDays[0]!.date);
  });

  test("an unmeasured or partial GitHub figure cannot be read as a number", () => {
    expect(githubSnapshotAgeDays(null)).toBeNull();
    expect(githubSnapshotAgeDays({ ...stats, snapshotDate: "not-a-date" })).toBeNull();
    expect(githubSnapshotAgeDays(stats, new Date("2026-01-01T00:00:00Z"))).toBeNull();
  });
});
