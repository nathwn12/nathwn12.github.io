// @vitest-environment jsdom
/**
 * Retired URLs: every one the old site published still reaches the record.
 *
 * The redesign retired `/skills` and `/contact` as destinations, `/thanks` with
 * the relay form it confirmed, and folded three earlier pages into the record.
 * Two things have to hold:
 *
 *   - in the SPA, a retired path canonicalizes to `/` and lands on the band
 *     that absorbed its content (`#atlas`, `#contact`, `#credentials`);
 *   - in `dist/`, each retired path is a redirect stub with a canonical and
 *     `noindex` — not a 200 page that nothing links to, and not a second copy of
 *     the record with the home page's canonical on it.
 *
 *   pnpm vitest run tests/legacy-paths.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  legacyAnchorFor,
  isRetiredPath,
  normalizePath,
  resolveRoute,
  routeByPath,
} from "../src/lib/router";
import { RETIRED_ROUTES, ROUTES, SITE_ORIGIN } from "../src/lib/routes";

const root = resolve(import.meta.dirname, "..");

describe("the live route table", () => {
  test("is exactly the three pages the site serves", () => {
    expect(ROUTES.map((route) => route.path)).toEqual([
      "/",
      "/experience",
      "/projects",
    ]);
  });

  test("does not contain a retired path", () => {
    const live = ROUTES.map((route) => route.path);
    for (const route of RETIRED_ROUTES) {
      expect(live, route.path).not.toContain(route.path);
    }
  });
});

describe("a retired path canonicalizes into the record", () => {
  test.each(RETIRED_ROUTES.map((route) => [route.path, route] as const))(
    "%s is recognised as retired",
    (routePath, route) => {
      expect(isRetiredPath(routePath)).toBe(true);
      expect(isRetiredPath(`${routePath}/`)).toBe(true);
      expect(routeByPath(routePath)?.path).toBe("/");
      expect(resolveRoute(routePath).path).toBe("/");
      expect(resolveRoute(routePath).id).toBe("record");
      expect(legacyAnchorFor(routePath)).toBe(
        route.target.startsWith("/#") ? route.target.slice(2) : "",
      );
    },
  );

  test("every retired anchor names a band the record actually renders", () => {
    /* The stub sends the visitor to `/#atlas`, `/#contact` or `/#credentials`;
       a band that no longer exists would scroll nowhere. The record's own
       component list is the authority on which bands exist. */
    const record = readFileSync(
      resolve(root, "src", "components", "Record.tsx"),
      "utf8",
    );
    const bands: Record<string, string> = {
      atlas: "<AtlasBand",
      contact: "<Contact",
      credentials: "<CredentialsBand",
      proof: "<ProofBand",
      work: "<WorkBand",
      forward: "<ForwardBand",
    };
    for (const route of RETIRED_ROUTES) {
      const anchor = route.target.startsWith("/#") ? route.target.slice(2) : "";
      if (!anchor) continue;
      expect(bands[anchor], `${route.path} targets unknown band #${anchor}`).toBeDefined();
      expect(record, `${route.path} targets #${anchor}, which the record does not render`).toContain(
        bands[anchor],
      );
    }
  });

  test("normalizes a query string off a retired path", () => {
    expect(normalizePath("/skills/?tab=all")).toBe("/skills");
  });

  test("an unknown path still resolves to the 404 route", () => {
    expect(resolveRoute("/definitely-not-a-route").id).toBe("notfound");
  });
});

describe("the static build", () => {
  test.each(RETIRED_ROUTES.map((route) => [route.path, route] as const))(
    "emits a stub at dist%s pointing at %s",
    (routePath, route) => {
      const file = resolve(root, "dist", routePath.slice(1), "index.html");
      expect(existsSync(file), `${routePath} was not emitted`).toBe(true);
      const html = readFileSync(file, "utf8");
      expect(html).toContain(`url=${route.target}`);
      expect(html).toContain(`<link rel="canonical" href="${route.canonical}"`);
      expect(html).toContain('content="noindex, follow"');
    },
  );

  test("the sitemap lists only the live routes", () => {
    const sitemap = readFileSync(resolve(root, "public", "sitemap.xml"), "utf8");
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(new Set(locs)).toEqual(
      new Set(ROUTES.map((route) => (route.path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${route.path}`))),
    );
    for (const route of RETIRED_ROUTES) {
      expect(locs).not.toContain(`${SITE_ORIGIN}${route.path}`);
    }
  });
});
