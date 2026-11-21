/** Measure settled-frame pacing and CLS from the built dist.
 *  Usage: node scripts/frame-probe.mjs <distDir>  (run from the worktree root) */
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";

const DIST = path.resolve(process.argv[2] ?? "dist");
const { chromium } = createRequire(path.resolve(DIST, "..", "package.json"))(
  "playwright",
);
const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png",
  ".pdf": "application/pdf",
};
const VIEWS = [
  [2560, 1440, "2560x1440"],
  [390, 844, "390x844"],
  [430, 932, "430x932"],
];

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=d3d11", "--ignore-gpu-blocklist"],
});
const report = [];

for (const [width, height, tag] of VIEWS) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.route("http://probe.local/**", async (route) => {
    const url = new URL(route.request().url());
    let file = decodeURIComponent(url.pathname);
    if (file.endsWith("/")) file += "index.html";
    else if (!path.extname(file)) file += "/index.html";
    try {
      const body = await readFile(path.join(DIST, file));
      await route.fulfill({
        status: 200, body,
        contentType: MIME[path.extname(file)] ?? "application/octet-stream",
      });
    } catch {
      await route.fulfill({ status: 404, body: "no" });
    }
  });
  await page.goto("http://probe.local", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);

  const result = await page.evaluate(async () => {
    const shifts = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) shifts.push(entry.value);
      }
    }).observe({ type: "layout-shift", buffered: true });

    const deltas = [];
    await new Promise((resolve) => {
      let last = null;
      let count = 0;
      const step = (now) => {
        if (last !== null) deltas.push(now - last);
        last = now;
        if (++count < 120) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
    deltas.sort((a, b) => a - b);
    const quantile = (p) =>
      deltas[Math.min(deltas.length - 1, Math.floor(p * deltas.length))];
    return {
      frames: deltas.length,
      p95: +quantile(0.95).toFixed(2),
      max: +deltas.at(-1).toFixed(2),
      over20: deltas.filter((delta) => delta > 20).length,
      long: deltas.filter((delta) => delta > 33).length,
      cls: +shifts.reduce((sum, value) => sum + value, 0).toFixed(4),
    };
  });
  report.push({ tag, ...result });
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 2));
