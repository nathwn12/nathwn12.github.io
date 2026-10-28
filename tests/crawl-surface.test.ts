import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { routeFileFor } from "../scripts/route-path.mjs";
import { REDIRECTS, ROUTES, canonicalFor } from "../src/lib/routes";

/**
 * Crawler and machine-reader surface: the files a search engine, a link
 * unfurler, or an AI agent reads without running JavaScript.
 *
 * These run against the sources AND the built `dist/` (the `test` script
 * builds first), because the two failure modes are different: llms.txt can
 * drift into describing a site that was never deployed, a sitemap can
 * advertise a route whose HTML the build never emitted, and a redirect stub
 * can point at a page that no longer exists.
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
    expect(llms.toLowerCase()).not.toContain("terminal");
  });

  test("states the same availability claim as the site, remote included", () => {
    /* One string, owner-confirmed on 2026-10-28: backend roles, remote. No
       hybrid, salary, or notice-period term was confirmed, so none is stated. */
    expect(llms).toContain("Open to backend roles — remote.");
    expect(llms).not.toContain("Open to backend roles.");
    expect(llms).toContain("2026-10-28");
  });

  test("lists exactly the three live site URLs", () => {
    const siteStart = llms.indexOf("## Site");
    const siteEnd = llms.indexOf("## Last updated");
    const site = llms.slice(siteStart, siteEnd);
    for (const route of ROUTES) {
      expect(site, route.path).toContain(canonicalFor(route.path));
    }
    expect(site).not.toContain("/experience");
    expect(site).not.toContain("/skills");
    expect(site).not.toContain("/projects");
    expect(site).not.toContain("/contact");
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

  test("lists exactly the three live routes and nothing else", () => {
    expect(new Set(locs.map(routeOf))).toEqual(
      new Set(ROUTES.map((route) => route.path)),
    );
    for (const retired of REDIRECTS) {
      expect(locs.map(routeOf), retired.from).not.toContain(retired.from);
    }
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
  test.each(ROUTES.map((route) => route.path))(
    "emits dist%s/index.html as a real, self-canonical page",
    (routePath) => {
      const file = distFile(routePath);
      expect(existsSync(file), `${routePath} was not prerendered`).toBe(true);

      const html = readFileSync(file, "utf8");
      const route = ROUTES.find((entry) => entry.path === routePath);
      expect(route).toBeDefined();
      // A real SPA entry, not an empty placeholder.
      expect(html).toContain('id="root"');
      expect(html).toMatch(/<script type="module"/);
      // Each route answers as itself, not as a copy of the cover.
      expect(html).toContain(
        `<link rel="canonical" href="${canonicalFor(routePath)}" />`,
      );
      expect(html).toContain(`<title>${route!.title}</title>`);
      expect(html).toContain(
        `<meta property="og:url" content="${canonicalFor(routePath)}" />`,
      );
    },
  );

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

describe("retired paths", () => {
  test.each(REDIRECTS.map((redirect) => [redirect.from, redirect.to, redirect.canonical]))(
    "emits a meta-refresh stub at %s pointing to %s",
    (from, to, canonical) => {
      const file = distFile(from);
      expect(existsSync(file), `${from} has no stub`).toBe(true);
      const html = readFileSync(file, "utf8");
      expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${to}" />`);
      expect(html).toContain(`<link rel="canonical" href="${canonical}" />`);
      expect(html).toContain('<meta name="robots" content="noindex" />');
      // Minimal: no app entry, no script at all.
      expect(html).not.toContain('id="root"');
      expect(html).not.toMatch(/<script/i);
    },
  );

  test("every stub target is a live route or the home contact anchor", () => {
    const livePaths = new Set(ROUTES.map((route) => route.path));
    for (const redirect of REDIRECTS) {
      const path = redirect.to.split("#")[0] || "/";
      expect(livePaths, redirect.from).toContain(path);
    }
  });
});

describe("prerender route containment", () => {
  const distDir = resolve(root, "dist");

  test("refuses the percent-encoded parent segment URL resolution would decode", () => {
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
    expect(routeFileFor(distDir, "/record")).toBe(
      resolve(distDir, "record", "index.html"),
    );
    expect(routeFileFor(distDir, "/")).toBe(resolve(distDir, "index.html"));
  });
});
