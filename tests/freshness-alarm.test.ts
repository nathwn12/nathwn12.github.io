import { describe, expect, test } from "vitest";
import stats from "../src/content/open-source-stats.json";
import npmSnapshot from "../src/content/npm-downloads.json";
import packageNames from "../src/content/npm-packages.json";
import {
  githubSnapshotAgeDays,
  MAX_GITHUB_FRESH_DAYS,
} from "../src/lib/open-source-stats";
import { downloadSnapshotFreshness } from "../src/lib/npm-downloads";

describe("the committed freshness alarm", () => {
  // DELIBERATELY TIME-DEPENDENT: unlike the injected-date tests in
  // tests/open-source-stats.test.ts, this one reads the committed snapshots
  // against the real clock. It is the alarm that goes red when the daily
  // refresh dies; doctoring the committed date must make it fail. Its comment
  // is the reason it may age, and why the refresh job excludes ONLY this file
  // from its pre-measure gate: the monitor must never block its own recovery.
  // PR CI runs the full `bun run check`, so this alarm still fails there.
  test("the committed snapshots are still inside the daily refresh contract", () => {
    const now = new Date();
    expect(downloadSnapshotFreshness(npmSnapshot, now, packageNames).status).toBe(
      "fresh",
    );
    const age = githubSnapshotAgeDays(stats, now);
    expect(age).not.toBeNull();
    expect(age!).toBeLessThanOrEqual(MAX_GITHUB_FRESH_DAYS);
  });
});
