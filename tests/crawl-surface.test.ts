import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, test } from "vitest";
import { routeFileFor } from "../scripts/route-path.mjs";
import {
  canonicalFor,
  NOT_FOUND_ROUTE,
  RETIRED_ROUTES,
  ROUTES,
  SITE_ORIGIN,
} from "../src/lib/routes";

/**
 * Crawler and machine-reader surface: the files a search engine, a link
 * unfurler, or an AI agent reads without running JavaScript.
 *
 * These run against the sources AND the built `dist/` (the `test` script
 * builds first), because the two failure modes are different: llms.txt can
 * drift into describing a site that was never deployed, and a sitemap can
 * advertise a route whose HTML the build never emitted.
 *
 * The per-route head is the part that used to be wrong in the only way that
 * matters to a crawler: every emitted file was a byte copy of the home page, so
 * `/experience` and `/projects` each declared the home page's title,
 * description, canonical and og:url. Each assertion below can go red.
 */

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");
const distDir = resolve(root, "dist");

function distHtml(routePath: string): string {
  const file =
    routePath === "/"
      ? resolve(distDir, "index.html")
      : resolve(distDir, routePath.slice(1), "index.html");
  return readFileSync(file, "utf8");
}

/** Read an attribute exactly as a browser would, entities decoded. */
function attr(html: string, pattern: RegExp): string | null {
  const raw = html.match(pattern)?.[1];
  if (raw === undefined) return null;
  return raw
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

const titleOf = (html: string) => attr(html, /<title>([\s\S]*?)<\/title>/);
const metaName = (html: string, name: string) =>
  attr(html, new RegExp(`<meta name="${name}" content="([^"]*)"`));
const metaProperty = (html: string, property: string) =>
  attr(html, new RegExp(`<meta property="${property}" content="([^"]*)"`));
const canonicalOf = (html: string) =>
  attr(html, /<link rel="canonical" href="([^"]*)"/);

const RESUME_URL = `${SITE_ORIGIN}/Nathaniel-Nikolai-Ladero-Resume.pdf`;
const CV_URL = `${SITE_ORIGIN}/Nathaniel-Nikolai-Ladero-CV.pdf`;

describe("every live route is a real page with its own head", () => {
  test.each(ROUTES.map((route) => [route.path, route] as const))(
    "dist%s/index.html carries its own title, description, canonical and og:url",
    (routePath, route) => {
      const html = distHtml(routePath);

      // A real SPA entry, not an empty placeholder.
      expect(html).toContain('id="root"');
      expect(html).toMatch(/<script type="module"/);

      expect(titleOf(html)).toBe(route.title);
      expect(metaName(html, "description")).toBe(route.metaDescription);
      expect(canonicalOf(html)).toBe(canonicalFor(routePath));
      expect(metaProperty(html, "og:url")).toBe(canonicalFor(routePath));
      expect(metaProperty(html, "og:description")).toBe(route.metaDescription);
    },
  );

  test("og:title and twitter:title match each route's own <title> exactly", () => {
    for (const route of ROUTES) {
      const html = distHtml(route.path);
      const title = titleOf(html);
      expect(title, route.path).toBe(route.title);
      expect(metaProperty(html, "og:title"), route.path).toBe(title);
      expect(metaName(html, "twitter:title"), route.path).toBe(title);
    }
  });

  test("the canonicals are three distinct URLs, not three copies of /", () => {
    const canonicals = ROUTES.map((route) => canonicalOf(distHtml(route.path)));
    expect(new Set(canonicals).size).toBe(ROUTES.length);
    expect(canonicals).toContain(`${SITE_ORIGIN}/`);
    expect(canonicals).toContain(`${SITE_ORIGIN}/experience`);
    expect(canonicals).toContain(`${SITE_ORIGIN}/projects`);
  });

  test("each title names the route and the person", () => {
    for (const route of ROUTES) {
      const title = titleOf(distHtml(route.path))!;
      expect(title, route.path).toContain("Nathaniel Nikolai Ladero");
      if (route.path !== "/") {
        expect(title.startsWith(route.label.charAt(0) + route.label.slice(1).toLowerCase()));
      }
    }
  });
});

describe("retired paths are redirect stubs", () => {
  test.each(RETIRED_ROUTES.map((route) => [route.path, route] as const))(
    "dist%s is a redirect stub",
    (routePath, route) => {
      const file = routeFileFor(distDir, routePath);
      expect(existsSync(file), `${routePath} has no emitted file`).toBe(true);

      const html = readFileSync(file, "utf8");
      // A redirect, not a second copy of the record.
      expect(html).toMatch(
        new RegExp(
          `<meta http-equiv="refresh" content="0; url=${route.target.replace(
            /[.*+?^${}()|[\]\\/]/g,
            "\\$&",
          )}"`,
        ),
      );
      expect(canonicalOf(html)).toBe(route.canonical);
      expect(metaName(html, "robots")).toBe("noindex, follow");
      expect(html).not.toContain('id="root"');
      expect(html).not.toMatch(/<script type="module"/);
      // A visible way out for anything that ignores the refresh.
      expect(html).toContain(`href="${route.target}"`);
    },
  );

  test("no retired path is advertised in the sitemap", () => {
    const sitemap = read("public/sitemap.xml");
    for (const route of RETIRED_ROUTES) {
      expect(sitemap).not.toContain(`<loc>${SITE_ORIGIN}${route.path}</loc>`);
    }
  });
});

describe("the 404 body", () => {
  const html = read("dist/404.html");

  test("is noindex, claims no canonical, and is titled as a 404", () => {
    expect(metaName(html, "robots")).toBe("noindex, follow");
    expect(canonicalOf(html)).toBeNull();
    expect(titleOf(html)).toBe(NOT_FOUND_ROUTE.title);
    expect(metaName(html, "description")).toBe(NOT_FOUND_ROUTE.metaDescription);
  });

  test("still boots the app so an unknown path renders the not-found page", () => {
    expect(html).toContain('id="root"');
    expect(html).toMatch(/<script type="module"/);
  });
});

describe("llms.txt", () => {
  const llms = read("public/llms.txt");

  test("states the confirmed availability string byte-identically", () => {
    // Case-insensitive, so the shipped capitalised line is actually matched.
    expect(llms).toMatch(/Open to backend roles \u2014 remote\./i);
    expect(llms).toMatch(/\bremote\b/i);
    // The plain-hyphen form is retired; this guard can fire on it.
    expect(llms).not.toMatch(/Open to backend roles\s*-\s*remote/i);
    // The old unresolved phrasing is retired.
    expect(llms).not.toMatch(/open to work/i);
  });

  test("links both downloadable documents by absolute URL", () => {
    expect(llms).toContain(RESUME_URL);
    expect(llms).toContain(CV_URL);
  });

  test("lists this build's real routes and no retired one", () => {
    for (const route of ROUTES) {
      expect(llms, route.path).toContain(canonicalFor(route.path));
    }
    for (const route of RETIRED_ROUTES) {
      expect(llms, route.path).not.toMatch(
        new RegExp(`${SITE_ORIGIN}${route.path}(?:\\s|$)`, "m"),
      );
    }
  });

  test("does not describe the site as a terminal interface", () => {
    expect(llms.toLowerCase()).not.toContain("terminal");
  });

  test("keeps the required sections in order and the last-updated date", () => {
    expect(llms).toContain("2026-10-28");
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

  test("is well-formed XML", () => {
    const dom = new JSDOM(sitemap, { contentType: "text/xml" });
    expect(dom.window.document.querySelector("parsererror")).toBeNull();
    expect(dom.window.document.documentElement.nodeName).toBe("urlset");
    expect(dom.window.document.querySelectorAll("url").length).toBe(
      ROUTES.length,
    );
  });

  test("lists exactly the live routes and nothing else", () => {
    expect(new Set(locs.map(routeOf))).toEqual(
      new Set(ROUTES.map((route) => route.path)),
    );
  });

  test("every listed URL resolves to an emitted page whose canonical agrees", () => {
    for (const loc of locs) {
      const routePath = routeOf(loc);
      const file =
        routePath === "/"
          ? resolve(distDir, "index.html")
          : resolve(distDir, routePath.slice(1), "index.html");
      expect(existsSync(file), `${loc} has no emitted file at ${file}`).toBe(
        true,
      );
      expect(canonicalOf(readFileSync(file, "utf8"))).toBe(loc);
    }
  });

  test("carries the build date as lastmod", () => {
    const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(
      (match) => match[1],
    );
    expect(lastmods).toHaveLength(locs.length);
    for (const lastmod of lastmods) expect(lastmod).toBe("2026-10-28");
  });
});

describe("robots.txt", () => {
  const robots = read("public/robots.txt");

  test("allows the site and points at the sitemap", () => {
    expect(robots).toMatch(/User-agent: \*/);
    expect(robots).toMatch(/Allow: \//);
    expect(robots).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
  });
});

describe("the build ships the documents and the fallback", () => {
  test("keeps the 404 fallback and the two PDFs", () => {
    expect(existsSync(resolve(distDir, "404.html"))).toBe(true);
    expect(
      existsSync(resolve(distDir, "Nathaniel-Nikolai-Ladero-Resume.pdf")),
    ).toBe(true);
    expect(
      existsSync(resolve(distDir, "Nathaniel-Nikolai-Ladero-CV.pdf")),
    ).toBe(true);
  });

  test("ships llms.txt, sitemap.xml and robots.txt", () => {
    for (const file of ["llms.txt", "sitemap.xml", "robots.txt"]) {
      expect(existsSync(resolve(distDir, file)), file).toBe(true);
    }
  });
});

describe("prerender route containment", () => {
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
