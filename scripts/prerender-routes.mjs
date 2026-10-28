import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transformWithEsbuild } from "vite";
import { routeFileFor } from "./route-path.mjs";

/**
 * Emit a real HTML file for every route: dist/<path>/index.html.
 *
 * GitHub Pages serves dist/index.html for `/` and dist/404.html for anything
 * that has no file — with the SPA fallback, every deep link returns HTTP 404
 * while still rendering. A real dist/<path>/index.html answers 200 instead,
 * which is what a crawler, a link preview, and a `HEAD` request all need.
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

try {
  await stat(indexHtml);

  const { ROUTES, THANKS_ROUTE } = await loadRoutes();
  const paths = [...ROUTES.map((route) => route.path), THANKS_ROUTE.path];

  for (const routePath of paths) {
    /* `/` is dist/index.html itself — copying it onto itself is a no-op that
       some filesystems report as an error. */
    if (routePath === "/") continue;

    const file = routeFileFor(distDir, routePath);
    await mkdir(path.dirname(file), { recursive: true });
    await copyFile(indexHtml, file);
    console.log(`OK: copied dist/index.html → dist${routePath}/index.html`);
  }
} catch (err) {
  console.error(
    "prerender-routes: failed to emit per-route HTML:",
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
}
