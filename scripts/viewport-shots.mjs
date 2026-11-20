#!/usr/bin/env node
/** Fresh viewport screenshots: 4 widths x 2 themes x 6 states. */
import { chromium } from "playwright";
import { readFile, mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const OUT = path.resolve(process.argv[2] ?? path.join(process.env.TEMP ?? ".", "opencode", "c2-review"));
const ORIGIN = "http://shots.local";
const ARGS = ["--use-gl=angle", "--use-angle=d3d11", "--ignore-gpu-blocklist"];
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png", ".pdf": "application/pdf", ".txt": "text/plain" };
const WIDTHS = [[2560, 1440, "2560"], [1440, 900, "1440"], [768, 1024, "768"], [390, 844, "390"]];
const STATES = ["person", "method", "work", "experience", "contact", "index"];

await mkdir(OUT, { recursive: true });
for (const file of await readdir(OUT)) {
  if (file.endsWith(".png")) await unlink(path.join(OUT, file));
}

const browser = await chromium.launch({ args: ARGS });
for (const [width, height, tag] of WIDTHS) {
  for (const theme of ["dark", "light"]) {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: theme, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.route(`${ORIGIN}/**`, async (route) => {
      const u = new URL(route.request().url());
      let pa = decodeURIComponent(u.pathname);
      if (pa.endsWith("/")) pa += "index.html";
      else if (!path.extname(pa)) pa += "/index.html";
      try { await route.fulfill({ status: 200, body: await readFile(path.join(DIST, pa)), contentType: MIME[path.extname(pa)] ?? "application/octet-stream" }); }
      catch { await route.fulfill({ status: 404, body: "no" }); }
    });
    await page.goto(ORIGIN, { waitUntil: "load" });
    await page.waitForSelector("main h1", { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1600);
    for (const state of STATES) {
      if (state === "index") {
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
      } else {
        await page.evaluate((id) => {
          const el = document.getElementById(id);
          window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
        }, state);
      }
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(OUT, `view-${tag}-${theme}-${state}.png`) });
    }
    await context.close();
  }
}
await browser.close();
console.log(`shots -> ${OUT}`);
