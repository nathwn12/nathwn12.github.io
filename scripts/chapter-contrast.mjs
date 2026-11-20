#!/usr/bin/env node
/**
 * chapter-contrast — text contrast across the descent, judged on pixels.
 *
 * The void is a fixed video layer that recedes and dims with scroll. Text must
 * hold its floor at every depth, over whatever the layer presents there. This
 * driver serves the built dist/ from disk (no server) and samples at 0, 25,
 * 50, 75 and 100 percent at 1440 and 390.
 */
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const ORIGIN = "http://chapter.local";
const ARGS = ["--use-gl=angle", "--use-angle=d3d11", "--ignore-gpu-blocklist"];
const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png",
  ".mp4": "video/mp4", ".webp": "image/webp", ".pdf": "application/pdf",
  ".txt": "text/plain",
};
const VIEWS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const DEPTHS = [0, 0.25, 0.5, 0.75, 1];
const TARGETS = [
  ".stage-nav a", ".stage-mark", ".hud-name h1", ".hud-role p", ".hud-status p",
  ".cluster-corner h2", ".section-index", ".signal-figure", ".figure-label",
  ".spark-name", ".spark-value", ".micro-number", ".micro-label", ".heat-note",
  ".stamp", ".featured-num", ".featured-main h3", ".claim", ".tech",
  ".featured-stats > span", ".index-row a", ".index-claim", ".index-stats",
  ".proof-figure", ".proof-text h3", ".proof-text p", ".proof-note",
  ".spec-key", ".spec-value", ".contact-line", ".mailto", ".ticker span",
];

const lum = (c) => {
  const f = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * f(c[0] / 255) + 0.7152 * f(c[1] / 255) + 0.0722 * f(c[2] / 255);
};
const con = (a, b) => {
  const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (h + 0.05) / (l + 0.05);
};
const parse = (s) => {
  const m = String(s).match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
};

const browser = await chromium.launch({ args: ARGS });
let failures = 0;
let samples = 0;

for (const view of VIEWS) {
  const context = await browser.newContext({
    viewport: { width: view.width, height: view.height },
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await page.route(`${ORIGIN}/**`, async (route) => {
    const u = new URL(route.request().url());
    let pa = decodeURIComponent(u.pathname);
    if (pa.endsWith("/")) pa += "index.html";
    else if (!path.extname(pa)) pa += "/index.html";
    try {
      await route.fulfill({
        status: 200,
        body: await readFile(path.join(DIST, pa)),
        contentType: MIME[path.extname(pa)] ?? "application/octet-stream",
      });
    } catch {
      await route.fulfill({ status: 404, body: "no" });
    }
  });
  await page.goto(ORIGIN, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);

  for (const depth of DEPTHS) {
    await page.evaluate((d) => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      scrollTo({ top: max * d, behavior: "instant" });
    }, depth);
    await page.waitForTimeout(850);

    const targets = await page.evaluate((selectors) => {
      const out = [];
      for (const sel of selectors) {
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect();
          const text = (el.textContent ?? "").trim();
          if (!text || r.width < 20 || r.height < 8) continue;
          if (r.bottom < 56 || r.top > innerHeight - 40 || r.right < 0 || r.left > innerWidth) continue;
          out.push({
            sel,
            color: getComputedStyle(el).color,
            size: parseFloat(getComputedStyle(el).fontSize),
            box: [r.x, r.y, r.width, r.height],
          });
        }
      }
      return out.slice(0, 60);
    }, TARGETS);

    const shot = await page.screenshot({ type: "png" });
    const rows = [];
    for (const t of targets) {
      const [x, y, w, h] = t.box.map(Math.round);
      const W = Math.max(2, Math.min(w, 340));
      const H = Math.max(2, Math.min(h, 80));
      if (x < 0 || y < 0 || x + W > view.width || y + H > view.height) continue;
      const { data, info } = await sharp(shot)
        .extract({ left: x, top: y, width: W, height: H })
        .raw()
        .toBuffer({ resolveWithObject: true });
      const px = [];
      for (let i = 0; i < data.length; i += info.channels) {
        px.push([data[i], data[i + 1], data[i + 2]]);
      }
      px.sort((a, b) => lum(a) - lum(b));
      const dark = px[Math.floor(px.length * 0.04)];
      const light = px[Math.floor(px.length * 0.96)];
      const fg = parse(t.color);
      const bg = lum(fg) > lum(dark) ? dark : light;
      const floor = t.size >= 24 ? 3 : 4.5;
      rows.push({ sel: t.sel, ratio: Number(con(fg, bg).toFixed(2)), floor });
    }
    if (!rows.length) {
      console.log(`FAIL ${view.width} ${Math.round(depth * 100)}% no visible text sampled`);
      failures += 1;
      continue;
    }
    const worst = rows.reduce((a, b) =>
      b.ratio / b.floor < a.ratio / a.floor ? b : a,
    );
    samples += rows.length;
    const ok = worst.ratio >= worst.floor;
    if (!ok) failures += 1;
    console.log(
      `${ok ? "PASS" : "FAIL"} ${view.width} ${Math.round(depth * 100)}% ` +
        `worst=${worst.sel} ${worst.ratio}:1 floor ${worst.floor} | sampled ${rows.length}`,
    );
  }
  await context.close();
}

await browser.close();
console.log(`\nRESULT ${failures ? "FAIL" : "PASS"} ${samples} text samples at five depths, two widths`);
process.exitCode = failures ? 1 : 0;
