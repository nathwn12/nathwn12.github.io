import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transformWithEsbuild } from "vite";
import { routeFileFor } from "./route-path.mjs";

/**
 * Emit a real HTML file per route, with that route's own head.
 *
 * GitHub Pages serves dist/index.html for `/` and dist/404.html for anything
 * that has no file — with the SPA fallback, every deep link returns HTTP 404
 * while still rendering. A real dist/<path>/index.html answers 200 instead,
 * which is what a crawler, a link preview, and a `HEAD` request all need.
 *
 * Copying index.html verbatim was not enough: every emitted route then shipped
 * the home page's `<title>`, description, canonical and `og:url`, so a crawler
 * saw three copies of one page. This script rewrites the head of each output
 * from the route table itself, and writes the retired paths as redirect stubs
 * (meta refresh + canonical + noindex) instead of a second copy of the record.
 *
 * The route list is read from src/lib/routes.ts — the same module the app's
 * router imports — so adding a route cannot leave the build output behind.
 * Every destination goes through `routeFileFor` (scripts/route-path.mjs),
 * which fails the build on any path that could leave dist/.
 * This script runs after `vite build` (so dist/index.html exists) and after
 * copy-404.mjs (which still owns dist/404.html and the document copies).
 */

const distDir = fileURLToPath(new URL("../dist/", import.meta.url));
const indexHtml = path.join(distDir, "index.html");

/**
 * Import the route table without a bundler or a TypeScript loader: transpile
 * the module with Vite's own esbuild transform and import the result from a
 * `data:` URL. src/lib/routes.ts is dependency-free data by design, so the
 * transpiled output has no imports to resolve and the data URL is valid.
 */
async function loadRoutes() {
  const source = await readFile(
    new URL("../src/lib/routes.ts", import.meta.url),
    "utf8",
  );
  const { code } = await transformWithEsbuild(source, "routes.ts", {
    loader: "ts",
    format: "esm",
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
  );
}

/** HTML attribute/text escaping — a `&` in a title must not open an entity. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Replace exactly one tag in the template, and fail loudly if the template no
 * longer carries it. A silently-skipped rewrite would ship the home page's
 * canonical on every route, which is the defect this script exists to stop.
 */
function replaceOnce(html, pattern, replacement, label) {
  const matches = html.match(new RegExp(pattern.source, "g")) ?? [];
  if (matches.length !== 1) {
    throw new Error(
      `expected exactly one ${label} in dist/index.html, found ${matches.length}`,
    );
  }
  return html.replace(pattern, replacement);
}

const setTitle = (html, title) =>
  replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`, "<title>");

const setMetaName = (html, name, content) =>
  replaceOnce(
    html,
    new RegExp(`<meta name="${name}" content="[^"]*"\\s*/?>`),
    `<meta name="${name}" content="${escapeHtml(content)}" />`,
    `meta[name=${name}]`,
  );

const setMetaProperty = (html, property, content) =>
  replaceOnce(
    html,
    new RegExp(`<meta property="${property}" content="[^"]*"\\s*/?>`),
    `<meta property="${property}" content="${escapeHtml(content)}" />`,
    `meta[property=${property}]`,
  );

const setCanonical = (html, href) =>
  replaceOnce(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${escapeHtml(href)}" />`,
    "canonical link",
  );

/** Drop the canonical link (a 404 must not claim one) and add noindex. */
const dropCanonical = (html) =>
  replaceOnce(html, /<link rel="canonical" href="[^"]*"\s*\/?>\n?\s*/, "", "canonical link");

/** Drop og:url — a page with no canonical has no URL to advertise. */
const dropOgUrl = (html) =>
  replaceOnce(
    html,
    /<meta property="og:url" content="[^"]*"\s*\/?>\n?\s*/,
    "",
    "meta[property=og:url]",
  );

const setRobots = (html, content) => {
  if (/<meta name="robots" content="[^"]*"\s*\/?>/.test(html)) {
    return replaceOnce(
      html,
      /<meta name="robots" content="[^"]*"\s*\/?>/,
      `<meta name="robots" content="${escapeHtml(content)}" />`,
      "meta[name=robots]",
    );
  }
  return html.replace(
    /(<meta name="viewport" content="[^"]*"\s*\/?>)/,
    `$1\n    <meta name="robots" content="${escapeHtml(content)}" />`,
  );
};

/** The head of one emitted live route. */
function withRouteHead(html, route, { ogTitle, canonical }) {
  let out = html;
  out = setTitle(out, route.title);
  out = setMetaName(out, "description", route.metaDescription);
  out = setMetaName(out, "twitter:title", ogTitle);
  out = setMetaName(out, "twitter:description", route.metaDescription);
  out = setMetaProperty(out, "og:title", ogTitle);
  out = setMetaProperty(out, "og:description", route.metaDescription);
  out = setMetaProperty(out, "og:url", canonical);
  out = setCanonical(out, canonical);
  return out;
}

/** A retired path: a redirect stub, not a second copy of the record. */
function stubHtml(route, notFoundTitle) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(`Moved — ${notFoundTitle}`)}</title>
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href="${escapeHtml(route.canonical)}" />
    <meta http-equiv="refresh" content="0; url=${escapeHtml(route.target)}" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#F2F1EC" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#101315" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
    <style>
      body {
        margin: 0;
        padding: 2.5rem 1.25rem;
        background: #f2f1ec;
        color: #16181a;
        font: 400 1rem/1.55 Inter, Arial, system-ui, sans-serif;
      }
      a { color: #0a5c60; text-underline-offset: 0.22em; }
    </style>
  </head>
  <body>
    <p>${escapeHtml(route.reason)}</p>
    <p><a href="${escapeHtml(route.target)}">Continue to ${escapeHtml(route.target)}</a></p>
  </body>
</html>
`;
}

try {
  await stat(indexHtml);

  const { ROUTES, RETIRED_ROUTES, NOT_FOUND_ROUTE, canonicalFor } =
    await loadRoutes();

  const template = await readFile(indexHtml, "utf8");

  /* Every live route gets a page whose head is its own. `/` is dist/index.html
     itself; the rest are written from the same template. */
  for (const route of ROUTES) {
    const canonical = canonicalFor(route.path);
    /* Social titles mirror the document title exactly: same casing, same
       separator. A label-prefixed social title drifts from the page a share
       actually lands on. */
    const ogTitle = route.title;
    const html = withRouteHead(template, route, { ogTitle, canonical });

    const file = routeFileFor(distDir, route.path);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, html);
    console.log(`OK: wrote dist${route.path === "/" ? "" : route.path}/index.html`);
  }

  /* Retired URLs: 200 with a meta refresh, a canonical and noindex. */
  for (const route of RETIRED_ROUTES) {
    const file = routeFileFor(distDir, route.path);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, stubHtml(route, "Nathaniel Nikolai Ladero"));
    console.log(`OK: wrote redirect stub dist${route.path}/index.html`);
  }

  /* The 404 body: the app shell (so the SPA still renders the not-found page)
     with noindex, and no canonical claiming it is the home page. */
  const notFound = setMetaProperty(
    setMetaProperty(
      setMetaName(
        setMetaName(
          setTitle(template, NOT_FOUND_ROUTE.title),
          "description",
          NOT_FOUND_ROUTE.metaDescription,
        ),
        "twitter:title",
        NOT_FOUND_ROUTE.title,
      ),
      "og:title",
      NOT_FOUND_ROUTE.title,
    ),
    "og:description",
    NOT_FOUND_ROUTE.metaDescription,
  );
  const notFoundOut = setRobots(
    dropOgUrl(dropCanonical(notFound)),
    "noindex, follow",
  );
  await writeFile(path.join(distDir, "404.html"), notFoundOut);
  console.log("OK: wrote dist/404.html (noindex, no canonical)");
} catch (err) {
  console.error(
    "prerender-routes: failed to emit per-route HTML:",
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
}
