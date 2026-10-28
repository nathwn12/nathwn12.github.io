import path from "node:path";

/**
 * Resolve the file a route path is emitted to, and refuse anything that could
 * land outside the build output.
 *
 * Route paths come from src/lib/routes.ts — code, not user input — but the
 * first implementation built a `URL` from the path, and the URL parser
 * percent-DECODES: `/%2e%2e/outside` became `../outside` and resolved outside
 * dist/. `path.resolve()` never decodes, and the explicit rejections below
 * keep encoded, backslashed and parent segments out before anything is
 * resolved at all.
 *
 * Pure and side-effect free so `tests/crawl-surface.test.ts` can exercise the
 * guard directly instead of mutating the real route table.
 */
export function routeFileFor(distDir, routePath) {
  if (typeof routePath !== "string" || !routePath.startsWith("/")) {
    throw new Error(
      `refusing to emit a route that is not an absolute path: ${String(routePath)}`,
    );
  }

  /* Independent rejections, checked before resolving: percent-encoding hides
     dot segments from a string scan, a backslash is a separator on Windows,
     and a `..` segment climbs out of any destination. */
  if (
    routePath.includes("%") ||
    routePath.includes("\\") ||
    routePath.split("/").includes("..")
  ) {
    throw new Error(`refusing to emit a route with an unsafe segment: ${routePath}`);
  }

  const root = path.resolve(distDir);
  const file = path.resolve(root, "." + routePath, "index.html");
  if (!file.startsWith(root + path.sep)) {
    throw new Error(`refusing to emit a route outside dist/: ${routePath}`);
  }
  return file;
}
