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
