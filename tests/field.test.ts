import { describe, expect, test } from "vitest";
import {
  FIELD_EDGE,
  fieldCaption,
  fieldPointById,
  fieldPoints,
  maskPoint,
  placePoint,
} from "../src/content/field";
import npmPackages from "../src/content/npm-packages.json";
import probe from "../src/content/repos.probe.json";
import stats from "../src/content/open-source-stats.json";

const publicRepos = probe.repos.filter(
  (repo) => repo.visibility === "PUBLIC" && !repo.isArchived,
);

describe("the deep field is the record", () => {
  test("one point per shipped package and worked public repo", () => {
    expect(fieldPoints).toHaveLength(npmPackages.length + publicRepos.length);
    expect(new Set(fieldPoints.map((point) => point.id)).size).toBe(
      fieldPoints.length,
    );
  });

  test("every point maps back to a committed content id", () => {
    for (const point of fieldPoints) {
      const sourceId = point.id.slice(point.id.indexOf(":") + 1);
      if (point.kind === "package") expect(npmPackages).toContain(sourceId);
      else expect(publicRepos.map((repo) => repo.name)).toContain(sourceId);
      expect(fieldPointById.get(point.id)).toBe(point);
      expect(point.source).toMatch(/^src\/content\//);
    }
  });

  test("placement is a pure hash of the id", () => {
    expect(placePoint("repo:hand")).toEqual(placePoint("repo:hand"));
    expect(placePoint("repo:hand")).not.toEqual(placePoint("repo:puppet"));
    for (const point of fieldPoints) {
      expect(point.x).toBe(placePoint(point.id).x);
      expect(point.y).toBe(placePoint(point.id).y);
      expect(point.x).toBeGreaterThan(0);
      expect(point.x).toBeLessThan(1);
      expect(point.y).toBeGreaterThan(0);
      expect(point.y).toBeLessThan(1);
    }
  });

  test("size and brightness come from real numbers", () => {
    for (const point of fieldPoints) {
      expect(point.measure).toBeGreaterThanOrEqual(0);
      expect(point.size).toBeGreaterThanOrEqual(0);
      expect(point.size).toBeLessThanOrEqual(1);
      expect(point.brightness).toBeGreaterThanOrEqual(0.35);
      expect(point.brightness).toBeLessThanOrEqual(1);
    }
    // hand-mcp has zero all-time downloads in the snapshot but 326 in 30 days.
    expect(fieldPointById.get("npm:hand-mcp")!.measure).toBe(0);
    expect(fieldPointById.get("repo:hand")!.measure).toBe(1);
  });

  test("a few live points and four spikes are derived, not named", () => {
    const live = fieldPoints.filter((point) => point.live);
    expect(live).toHaveLength(3);
    expect(live.every((point) => point.kind === "package")).toBe(true);
    const spikes = fieldPoints.filter((point) => point.spike);
    expect(spikes).toHaveLength(4);
    const largest = [...fieldPoints]
      .sort((a, b) => b.size - a.size)
      .slice(0, 4)
      .map((point) => point.id)
      .sort();
    expect(spikes.map((point) => point.id).sort()).toEqual(largest);
  });

  test("copy and edge exclusions are deterministic and keep points clear", () => {
    const zone = { left: 100, right: 700, top: 100, bottom: 400 };
    const width = 1440;
    const height = 900;
    let placed = 0;
    for (const point of fieldPoints) {
      const spot = maskPoint(point, width, height, [zone]);
      expect(spot).toEqual(maskPoint(point, width, height, [zone]));
      if (spot.blocked) continue;
      placed += 1;
      const margin = spot.radius + (point.spike ? spot.radius * 5 : 0) + 2;
      expect(
        spot.x > zone.left - margin &&
          spot.x < zone.right + margin &&
          spot.y > zone.top - margin &&
          spot.y < zone.bottom + margin,
      ).toBe(false);
      expect(spot.x - margin).toBeGreaterThanOrEqual(FIELD_EDGE);
      expect(spot.x + margin).toBeLessThanOrEqual(width - FIELD_EDGE);
      expect(spot.y - margin).toBeGreaterThanOrEqual(FIELD_EDGE);
      expect(spot.y + margin).toBeLessThanOrEqual(height - FIELD_EDGE);
    }
    expect(placed).toBeGreaterThan(20);
    const radii = fieldPoints.map(
      (point) => maskPoint(point, width, height, [zone]).radius,
    );
    expect(Math.max(...radii)).toBeGreaterThanOrEqual(6);
    expect(Math.max(...radii) - Math.min(...radii)).toBeGreaterThan(4);
  });

  test("the caption counts the field from its sources", () => {
    expect(fieldCaption).toContain(String(fieldPoints.length));
    expect(fieldCaption).toContain(String(npmPackages.length));
    expect(fieldCaption).toContain(String(publicRepos.length));
    expect(fieldCaption).toContain(stats.snapshotDate);
  });
});
