import { describe, expect, test } from "vitest";
import {
  buildDateWindows,
  fetchPackageDownloads,
  NPM_PACKAGES,
  validatePackageNames,
} from "../scripts/npm-downloads.mjs";
import expectedPackages from "../src/content/npm-packages.json";
import snapshot from "../src/content/npm-downloads.json";
import { downloadSnapshotFreshness } from "../src/lib/npm-downloads";
import { fetchPackageMonth } from "../scripts/open-source-stats.mjs";
import { snapshotDate as measuredThrough } from "../scripts/npm-downloads.mjs";
import { monthFigure } from "../src/lib/open-source-stats";
import statsSnapshot from "../src/content/open-source-stats.json";

describe("npm all-time download aggregation", () => {
  test("date windows are contiguous, inclusive, and never overlap", () => {
    const windows = buildDateWindows("2024-01-01", "2025-12-31");
    expect(windows).toEqual([
      { start: "2024-01-01", end: "2024-12-30" },
      { start: "2024-12-31", end: "2025-12-30" },
      { start: "2025-12-31", end: "2025-12-31" },
    ]);
    for (const [index, window] of windows.entries()) {
      const days =
        (Date.parse(`${window.end}T00:00:00Z`) -
          Date.parse(`${window.start}T00:00:00Z`)) /
          86_400_000 +
        1;
      expect(days).toBeLessThanOrEqual(365);
      if (index > 0) {
        const previousEnd = Date.parse(
          `${windows[index - 1]!.end}T00:00:00Z`,
        );
        expect(Date.parse(`${window.start}T00:00:00Z`)).toBe(
          previousEnd + 86_400_000,
        );
      }
    }
  });

  test("the package inventory has exact, unique names", () => {
    expect(NPM_PACKAGES).toEqual(expectedPackages);
    expect(new Set(NPM_PACKAGES).size).toBe(9);
    expect(snapshot.packages.map((item) => item.name)).toEqual(expectedPackages);
    expect(() =>
      validatePackageNames(["puppet-mcp", "puppet-mcp"]),
    ).toThrow(/duplicate/i);
    expect(() => validatePackageNames(["not a package"])).toThrow();
    expect(validatePackageNames(["puppet-mcp", "@nathwn12/janua"])).toEqual([
      "puppet-mcp",
      "@nathwn12/janua",
    ]);
  });

  test("adds exact non-overlapping npm windows for a scoped package", async () => {
    const requested: string[] = [];
    const fetcher = async (input: string | URL | Request) => {
      const url = String(input);
      requested.push(url);
      if (url.startsWith("https://registry.npmjs.org/")) {
        return Response.json({
          name: "@nathwn12/janua",
          maintainers: [{ name: "nathwn12" }],
          time: { created: "2024-01-01T12:00:00Z" },
        });
      }
      const range = url.match(/point\/([^/]+)\/(.+)$/)?.[1] ?? "";
      const [start, end] = range.split(":");
      const encodedName = url.split("/").at(-1);
      return Response.json({
        package: decodeURIComponent(encodedName ?? ""),
        start,
        end,
        downloads: start === "2024-01-01" ? 100 : 50,
      });
    };

    const result = await fetchPackageDownloads(
      "@nathwn12/janua",
      "2024-12-31",
      fetcher as typeof fetch,
    );

    expect(result).toEqual({
      name: "@nathwn12/janua",
      created: "2024-01-01",
      downloads: 150,
      through: "2024-12-31",
    });
    expect(requested).toHaveLength(3);
    expect(requested.some((url) => url.includes("%40nathwn12%2Fjanua"))).toBe(
      true,
    );
  });

  test("rejects a partial or malformed window rather than reporting a total", async () => {
    const fetcher = async (input: string | URL | Request) => {
      const url = String(input);
      if (url.startsWith("https://registry.npmjs.org/")) {
        return Response.json({
          name: "puppet-mcp",
          maintainers: [{ name: "nathwn12" }],
          time: { created: "2024-01-01T00:00:00Z" },
        });
      }
      return Response.json({
        package: "puppet-mcp",
        start: "2024-01-01",
        end: "2024-12-29",
        downloads: 12,
      });
    };
    await expect(
      fetchPackageDownloads("puppet-mcp", "2024-12-31", fetcher as typeof fetch),
    ).rejects.toThrow(/range/i);
  });

  test("marks a valid dated snapshot fresh or stale without relabeling its period", () => {
    const good = {
      source: "npm",
      period: "all available daily package-download data since each package was registered",
      snapshotDate: "2026-11-12",
      total: 150,
      packages: [
        { name: "a", created: "2024-01-01", through: "2026-11-12", downloads: 100 },
        { name: "b", created: "2024-02-01", through: "2026-11-12", downloads: 50 },
      ],
    };
    expect(
      downloadSnapshotFreshness(good, new Date("2026-11-16T12:00:00Z"), [
        "a",
        "b",
      ]),
    ).toEqual({ status: "fresh", ageDays: 4 });
    expect(
      downloadSnapshotFreshness(good, new Date("2026-11-25T12:00:00Z"), [
        "a",
        "b",
      ]),
    ).toEqual({ status: "stale", ageDays: 13 });
    expect(
      downloadSnapshotFreshness(
        { ...good, total: 151 },
        new Date("2026-11-16T12:00:00Z"),
        ["a", "b"],
      ),
    ).toEqual({ status: "unavailable", ageDays: null });
    expect(
      downloadSnapshotFreshness(good, new Date("2026-11-16T12:00:00Z"), [
        "a",
        "c",
      ]),
    ).toEqual({ status: "unavailable", ageDays: null });
  });
});

describe("the committed month figure and the refreshed all-time snapshot", () => {
  test("the month fetch keeps the maintainer guard", async () => {
    const fetcher = async () =>
      Response.json({
        name: "puppet-mcp",
        maintainers: [{ name: "someone-else" }],
        time: { created: "2024-01-01T00:00:00Z" },
      }) as unknown as typeof fetch;
    await expect(fetchPackageMonth("puppet-mcp", fetcher)).rejects.toThrow(
      /incomplete/i,
    );
  });

  test("the month figure is accepted only from whole, matching measurements", () => {
    expect(monthFigure(statsSnapshot, expectedPackages, snapshot)).toBe(
      statsSnapshot.npmMonth,
    );
    expect(
      monthFigure({ ...statsSnapshot, npmMonth: 1 }, expectedPackages, snapshot),
    ).toBeNull();
    expect(
      monthFigure(
        { ...statsSnapshot, packages: statsSnapshot.packages.slice(0, 8) },
        expectedPackages,
        snapshot,
      ),
    ).toBeNull();
  });

  test("the regenerated all-time snapshot keeps order, sum and the settlement buffer", () => {
    expect(snapshot.packages.map((item) => item.name)).toEqual(expectedPackages);
    expect(snapshot.packages.reduce((sum, item) => sum + item.downloads, 0)).toBe(
      snapshot.total,
    );
    expect(measuredThrough(new Date("2026-11-19T12:00:00Z"))).toBe("2026-11-16");
    expect(statsSnapshot.snapshotDate).toBe(snapshot.snapshotDate);
    expect(statsSnapshot.npmAllTime).toBe(snapshot.total);
  });
});
