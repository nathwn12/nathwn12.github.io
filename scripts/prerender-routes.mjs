import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { routeFileFor } from "./route-path.mjs";

/**
 * The ledger is one page. Retired paths get a redirect stub, not a second
 * copy of the record. GitHub Pages returns HTTP 404 for a path with no file,
 * so a stub is what makes an old deep link answer with a redirect.
 */

const distDir = fileURLToPath(new URL("../dist/", import.meta.url));

const RETIRED = [
  ["/experience", "/#record", "The experience record is now chapter 04."],
  ["/projects", "/#work", "The projects are now chapter 03."],
  ["/skills", "/#method", "The method is now chapter 02."],
  ["/contact", "/#contact", "Contact is now chapter 05."],
  ["/thanks", "/#contact", "The ledger has one contact chapter."],
  ["/about", "/", "The record is now one page."],
  ["/education", "/#record", "The record is now chapter 04."],
  ["/footprint", "/#method", "The method is now chapter 02."],
];

const escape = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function stub(target, reason) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Moved — the record</title>
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href="https://nathwn12.github.io/" />
    <meta http-equiv="refresh" content="0; url=${escape(target)}" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
  </head>
  <body>
    <p>${escape(reason)}</p>
    <p><a href="${escape(target)}">Continue to the record</a></p>
  </body>
</html>
`;
}

try {
  await stat(path.join(distDir, "index.html"));
  for (const [route, target, reason] of RETIRED) {
    const file = routeFileFor(distDir, route);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, stub(target, reason));
    console.log(`OK: wrote redirect stub dist${route}/index.html`);
  }
} catch (err) {
  console.error("prerender-routes: failed to emit redirect stubs:", err);
  process.exit(1);
}
