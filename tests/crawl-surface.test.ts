import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { routeFileFor } from "../scripts/route-path.mjs";
import { ROUTES, THANKS_ROUTE } from "../src/lib/routes";

/**
 * Crawler and machine-reader surface: the files a search engine, a link
 * unfurler, or an AI agent reads without running JavaScript.
 *
 * These run against the sources AND the built `dist/` (the `test` script
 * builds first), because the two failure modes are different: llms.txt can
 * drift into describing a site that was never deployed, and a sitemap can
 * advertise a route whose HTML the build never emitted.
 */

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");
const distFile = (routePath: string) =>
  routePath === "/"
    ? resolve(root, "dist", "index.html")
    : resolve(root, "dist", routePath.slice(1), "index.html");

const RESUME_URL = "https://nathwn12.github.io/Nathaniel-Nikolai-Ladero-Resume.pdf";
const CV_URL = "https://nathwn12.github.io/Nathaniel-Nikolai-Ladero-CV.pdf";

describe("llms.txt", () => {
  const llms = read("public/llms.txt");

  test("links both downloadable documents by absolute URL", () => {
    expect(llms).toContain(RESUME_URL);
    expect(llms).toContain(CV_URL);
  });

  test("does not describe the site as a terminal interface", () => {
    // The terminal design was never deployed; the live site is an editorial
    // portfolio. An agent reading a stale design claim gets the wrong picture.
    expect(llms.toLowerCase()).not.toContain("terminal");
  });

  test("states open-to-work availability and the last-updated date", () => {
    expect(llms).toContain("Open to work.");
    expect(llms).toContain("2026-10-28");
  });

  test("keeps the required sections in order", () => {
    const headings = [
      "## Summary",
      "## Availability",
      "## Evidence",
      "## Experience",
      "## Skills",
      "## Education",
      "## Certifications",
      "## Documents",
      "## Contact",
      "## Site",
      "## Last updated",
    ];
    let cursor = -1;
    for (const heading of headings) {
      const at = llms.indexOf(heading);
      expect(at, `${heading} missing from llms.txt`).toBeGreaterThan(-1);
      expect(at, `${heading} is out of order`).toBeGreaterThan(cursor);
      cursor = at;
    }
  });
});

describe("sitemap.xml", () => {
  const sitemap = read("public/sitemap.xml");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );
  const routeOf = (loc: string) => {
    const { pathname } = new URL(loc);
    return pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  };

  test("lists exactly the navigable routes and nothing else", () => {
    /* `/thanks` is emitted by the build but stays out of the sitemap: it is a
       form confirmation, not a destination anyone should land on from search. */
    expect(new Set(locs.map(routeOf))).toEqual(
      new Set(ROUTES.map((route) => route.path)),
    );
    expect(locs).not.toContain("https://nathwn12.github.io/thanks");
  });

  test("every listed URL resolves to an HTML file the build emitted", () => {
    for (const loc of locs) {
      const file = distFile(routeOf(loc));
      expect(existsSync(file), `${loc} has no emitted file at ${file}`).toBe(
        true,
      );
    }
  });

  test("carries the build date as lastmod", () => {
    const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(
      (match) => match[1],
    );
    expect(lastmods).not.toHaveLength(0);
    for (const lastmod of lastmods) expect(lastmod).toBe("2026-10-28");
  });
});

describe("prerendered routes", () => {
  test.each([
    ...ROUTES.map((route) => route.path),
    THANKS_ROUTE.path,
  ])("emits dist%s/index.html as a real page", (routePath) => {
    const file = distFile(routePath);
    expect(existsSync(file), `${routePath} was not prerendered`).toBe(true);

    const html = readFileSync(file, "utf8");
    // A real SPA entry, not an empty placeholder: mount point plus module.
    expect(html).toContain('id="root"');
    expect(html).toMatch(/<script type="module"/);
  });

  test("keeps the 404 fallback and the document downloads", () => {
    expect(existsSync(resolve(root, "dist", "404.html"))).toBe(true);
    expect(
      existsSync(resolve(root, "dist", "Nathaniel-Nikolai-Ladero-Resume.pdf")),
    ).toBe(true);
    expect(
      existsSync(resolve(root, "dist", "Nathaniel-Nikolai-Ladero-CV.pdf")),
    ).toBe(true);
  });
});

describe("prerender route containment", () => {
  const distDir = resolve(root, "dist");

  test("refuses the percent-encoded parent segment URL resolution would decode", () => {
    /* `new URL("/%2e%2e/outside/", dist)` percent-DECODES to ../outside and
       escapes dist/. The guard must refuse the encoded form before resolving. */
    expect(() => routeFileFor(distDir, "/%2e%2e/outside")).toThrow(
      /unsafe segment: \/%2e%2e\/outside/,
    );
  });

  test("refuses parent segments, backslashes, and non-absolute paths", () => {
    for (const badPath of [
      "/../outside",
      "/a/../../outside",
      "/..\\outside",
      "/a/%2e%2e/b",
      "experience",
    ]) {
      expect(() => routeFileFor(distDir, badPath), badPath).toThrow();
    }
  });

  test("accepts real route paths and keeps them inside dist", () => {
    expect(routeFileFor(distDir, "/experience")).toBe(
      resolve(distDir, "experience", "index.html"),
    );
    expect(routeFileFor(distDir, "/")).toBe(resolve(distDir, "index.html"));
  });
});
