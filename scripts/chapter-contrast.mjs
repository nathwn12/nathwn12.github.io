#!/usr/bin/env node
/** Contrast of chapter text over the live field, at a scrolled chapter. */
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const ORIGIN = "http://chapter.local";
const ARGS = ["--use-gl=angle", "--use-angle=d3d11", "--ignore-gpu-blocklist"];
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png", ".pdf": "application/pdf", ".txt": "text/plain" };
const lum = (c) => { const f = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * f(c[0] / 255) + 0.7152 * f(c[1] / 255) + 0.0722 * f(c[2] / 255); };
const con = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x); return (h + 0.05) / (l + 0.05); };
const parse = (s) => { const m = s.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/); return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0]; };

const browser = await chromium.launch({ args: ARGS });
for (const width of [2560, 1440]) {
  for (const theme of ["dark", "light"]) {
    const height = width >= 2000 ? 1440 : 900;
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: theme });
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
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    for (const id of ["work", "experience"]) {
      await page.evaluate((chapter) => {
        const el = document.getElementById(chapter);
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
      }, id);
      await page.waitForTimeout(950);
      const targets = await page.evaluate((chapter) => {
        const panel = document.getElementById(chapter);
        return [...panel.querySelectorAll(".stage-claim, .stage-rows a, .stage-rows li > span:last-child, .stage-sequence__outcome, .stage-sequence li > p:not(.stage-sequence__date):not(.stage-sequence__outcome):not(.stage-sequence__figure)")]
          .slice(0, 12)
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { sel: el.className || el.tagName, color: getComputedStyle(el).color, size: parseFloat(getComputedStyle(el).fontSize), box: [r.x, r.y, r.width, r.height] };
          })
          .filter((t) => t.box[1] > 0 && t.box[1] < innerHeight - 120 && t.box[2] > 20 && t.box[3] > 8);
      }, id);
      const shot = await page.screenshot({ type: "png" });
      const rows = [];
      for (const t of targets) {
        const [x, y, w, h] = t.box.map(Math.round);
        const W = Math.max(2, Math.min(w, 360)); const H = Math.max(2, Math.min(h, 90));
        if (x < 0 || y < 0 || x + W > width || y + H > height) continue;
        const { data, info } = await sharp(shot).extract({ left: x, top: y, width: W, height: H }).raw().toBuffer({ resolveWithObject: true });
        const px = [];
        for (let i = 0; i < data.length; i += info.channels) px.push([data[i], data[i + 1], data[i + 2]]);
        px.sort((a, b) => lum(a) - lum(b));
        const dark = px[Math.floor(px.length * 0.05)];
        const light = px[Math.floor(px.length * 0.95)];
        const fg = parse(t.color);
        const bg = lum(fg) > lum(dark) ? dark : light;
        rows.push({ sel: t.sel, ratio: Number(con(fg, bg).toFixed(2)), floor: t.size >= 24 ? 3 : 4.5 });
      }
      const worst = rows.reduce((a, b) => (b.ratio / b.floor < a.ratio / a.floor ? b : a), rows[0] ?? { sel: "-", ratio: 99, floor: 1 });
      console.log(`${worst.ratio >= worst.floor ? "PASS" : "FAIL"} ${width} ${theme} ${id} worst=${worst.sel} ${worst.ratio}:1 floor ${worst.floor} | ${rows.map((r) => `${r.sel}=${r.ratio}`).join(" ")}`);
      await page.screenshot({ path: `C:/Users/nathan/AppData/Local/Temp/opencode/c2-review/chapter-${width}-${theme}-${id}.png` });
    }
    await context.close();
  }
}
await browser.close();
