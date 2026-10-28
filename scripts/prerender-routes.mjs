import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transformWithEsbuild } from "vite";
import { routeFileFor } from "./route-path.mjs";

/**
 * Emit a real HTML file for every route: dist/<path>/index.html.
 *
 * GitHub Pages serves dist/index.html for `/` and dist/404.html for anything
 * that has no file — with an SPA fallback, every deep link answers HTTP 404
 * while still rendering. A real dist/<path>/index.html answers 200 instead,
 * which is what a crawler, a link preview, and a HEAD request all need.
 *
 * Each route copy gets its own title, description, canonical URL, and Open
 * Graph URL, so a shared /record or /work link unfurls as itself rather than as
 * the cover.
 *
 * Retired public paths are written as minimal stubs at their old URL: a
 * `<meta http-equiv="refresh">` to the replacement plus a canonical link. No
 * JavaScript, no navigation — an existing link never dies.
 *
 * The route and redirect lists are read from src/lib/routes.ts — the same
 * module the app's router imports — so adding a route cannot leave the build
 * output behind. Every destination goes through `routeFileFor`
 * (scripts/route-path.mjs), which fails the build on any path that could leave
 * dist/.
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function canonicalFor(routePath) {
  return routePath === "/" ? "https://nathwn12.github.io/" : `https://nathwn12.github.io${routePath}`;
}

/** Rewrite one route's shareable head in the copied entry HTML. */
function routeHtml(html, route) {
  const canonical = canonicalFor(route.path);
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(route.title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escapeHtml(route.metaDescription)}" />`,
    )
    .replace(
      /<link rel="canonical" href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${canonical}" />`,
    )
    .replace(
      /<meta property="og:url" content="[^"]*"\s*\/?>/,
      `<meta property="og:url" content="${canonical}" />`,
    )
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${escapeHtml(route.title)}" />`,
    )
    .replace(
      /<meta property="og:description" content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${escapeHtml(route.metaDescription)}" />`,
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`,
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:description" content="${escapeHtml(route.metaDescription)}" />`,
    );
}

function redirectStub(redirect) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="0; url=${redirect.to}" />
    <link rel="canonical" href="${redirect.canonical}" />
    <title>Moved to ${redirect.to}</title>
  </head>
  <body>
    <p>This page moved to <a href="${redirect.to}">${redirect.to}</a>.</p>
  </body>
</html>
`;
}

try {
  await stat(indexHtml);
  const entry = await readFile(indexHtml, "utf8");
  const { ROUTES, REDIRECTS } = await loadRoutes();

  for (const route of ROUTES) {
    if (route.path === "/") continue;
    const file = routeFileFor(distDir, route.path);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, routeHtml(entry, route));
    console.log(`OK: prerendered dist${route.path}/index.html`);
  }

  for (const redirect of REDIRECTS) {
    const file = routeFileFor(distDir, redirect.from);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, redirectStub(redirect));
    console.log(`OK: redirected dist${redirect.from}/index.html → ${redirect.to}`);
  }
} catch (err) {
  console.error(
    "prerender-routes: failed to emit per-route HTML:",
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
}
