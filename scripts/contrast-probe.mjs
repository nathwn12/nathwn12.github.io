#!/usr/bin/env node
/** Composited text contrast at 2560/1440/390, both themes. */
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const ORIGIN = "http://contrast.local";
const ARGS = ["--use-gl=angle", "--use-angle=d3d11", "--ignore-gpu-blocklist"];
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png", ".pdf": "application/pdf", ".txt": "text/plain" };
const lum = (c) => { const f = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * f(c[0] / 255) + 0.7152 * f(c[1] / 255) + 0.0722 * f(c[2] / 255); };
const con = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x); return (h + 0.05) / (l + 0.05); };
const parse = (s) => { const m = s.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/); return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0]; };

const browser = await chromium.launch({ args: ARGS });
for (const width of [2560, 1440, 390]) {
  for (const theme of ["dark", "light"]) {
    const height = width >= 2000 ? 1440 : width >= 1000 ? 900 : 844;
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
    await page.waitForTimeout(1200);
    const targets = await page.evaluate(() => [".stage-title", ".stage-claim", ".stage-voice", ".stage-kicker", ".singularity__num", ".singularity__label"].map((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { sel, color: getComputedStyle(el).color, size: parseFloat(getComputedStyle(el).fontSize), box: [r.x, r.y, r.width, r.height] };
    }).filter(Boolean));
    const shot = await page.screenshot({ type: "png" });
    const rows = [];
    for (const t of targets) {
      const [x, y, w, h] = t.box.map(Math.round);
      const W = Math.max(2, Math.min(w, 320)); const H = Math.max(2, Math.min(h, 100));
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
    const worst = rows.reduce((a, b) => (b.ratio / b.floor < a.ratio / a.floor ? b : a), rows[0]);
    const pass = rows.every((r) => r.ratio >= r.floor);
    console.log(`${pass ? "PASS" : "FAIL"} ${width} ${theme} worst=${worst.sel} ${worst.ratio}:1 floor ${worst.floor} | ${rows.map((r) => `${r.sel}=${r.ratio}`).join(" ")}`);
    await context.close();
  }
}
await browser.close();
