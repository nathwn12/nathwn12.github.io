/**
 * Witness for the visual audit's route coverage.
 *
 * The driver (scripts/visual-audit.mjs) and the build
 * (scripts/prerender-routes.mjs) both read src/lib/routes.ts. This test derives
 * the path set independently through Vite's own transform and compares it with
 * the list the driver exposes, so a second, hardcoded route list cannot creep
 * back in unnoticed. It names the exact route on divergence and sets no metric
 * threshold: this is coverage, not a judgement of the audit's measurements.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { transformWithOxc } from "vite";
import { describe, expect, test } from "vitest";
import { ROUTES as driverRoutes } from "../scripts/visual-audit.mjs";

/** Independently read the build's route table, the same way the build does. */
async function tableRoutes(): Promise<string[]> {
  const source = await readFile(
    path.resolve(import.meta.dirname, "..", "src", "lib", "routes.ts"),
    "utf8",
  );
  const { code } = await transformWithOxc(source, "routes.ts");
  const { ROUTES } = await import(
    `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
  );
  return ROUTES.map((route: { path: string }) => route.path);
}

describe("visual audit route coverage", () => {
  test("the driver audits exactly the routes the build prerenders", async () => {
    const expected = await tableRoutes();
    const actual = [...driverRoutes].sort();
    const wanted = [...expected].sort();

    const missing = wanted.filter((route) => !actual.includes(route));
    const extra = actual.filter((route) => !wanted.includes(route));

    for (const route of missing) {
      console.log(`route ${route}: in the table, missing from the driver`);
    }
    for (const route of extra) {
      console.log(`route ${route}: in the driver, absent from the table`);
    }
    for (const route of wanted) {
      console.log(`route ${route}: covered`);
    }

    expect(missing, "routes in the table but not the driver").toEqual([]);
    expect(extra, "routes in the driver but not the table").toEqual([]);
    expect(actual).toEqual(wanted);
  });
});
