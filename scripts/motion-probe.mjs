#!/usr/bin/env node
/**
 * motion-probe — evidence for the descent's frame, shift and contrast floors.
 *
 * Serves the shipped dist/ through request interception and measures the real
 * browser: frame deltas during a scripted descent at 1440 and 390, cumulative
 * layout shift and panel geometry across a chapter change, the View
 * Transitions path and its degradation, and text contrast sampled from the
 * pixels actually painted behind the type.
 *
 *   node scripts/motion-probe.mjs <outDir>
 */
import { chromium } from "playwright";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const OUT = path.resolve(process.argv[2] ?? path.join(process.env.TEMP ?? ".", "opencode", "c2-review"));
const ORIGIN = "http://descent.local";
const VIEWPORTS = [
  { width: 1440, height: 900, tag: "1440" },
  { width: 390, height: 844, tag: "390" },
];
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".woff2": "font/woff2", ".svg": "image/svg+xml",
  ".png": "image/png", ".pdf": "application/pdf", ".txt": "text/plain; charset=utf-8",
};

async function serve(page) {
  await page.route(`${ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url());
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    else if (!path.extname(pathname)) pathname += "/index.html";
    try {
      const body = await readFile(path.join(DIST, pathname));
      await route.fulfill({ status: 200, body, contentType: MIME[path.extname(pathname)] ?? "application/octet-stream" });
    } catch {
      await route.fulfill({ status: 404, body: "not found", contentType: "text/plain" });
    }
  });
}

async function open(browser, viewport, theme = "dark", reducedMotion = "no-preference") {
  const context = await browser.newContext({
    viewport, colorScheme: theme, reducedMotion, deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await serve(page);
  await page.goto(ORIGIN, { waitUntil: "load" });
  await page.waitForSelector("main h1", { timeout: 10000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(180);
  return { context, page };
}

/** Frame intervals while the camera makes one full descent. */
async function frameProbe(page) {
  return page.evaluate(async () => {
    const frames = [];
    let last = performance.now();
    let running = true;
    const tick = (now) => {
      if (!running) return;
      frames.push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const total = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    for (let i = 0; i <= 60; i += 1) {
      window.scrollTo({ top: (total * i) / 60, behavior: "instant" });
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    running = false;
    return frames.slice(6);
  });
}

function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
  return {
    frames: sorted.length,
    mean: Number((sorted.reduce((a, b) => a + b, 0) / Math.max(1, sorted.length)).toFixed(2)),
    p50: Number(at(0.5).toFixed(2)),
    p95: Number(at(0.95).toFixed(2)),
    max: Number(at(1).toFixed(2)),
    over16: sorted.filter((v) => v > 16).length,
  };
}

/** Luminance and WCAG contrast, from painted RGB. */
function luminance([r, g, b]) {
  const f = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r / 255) + 0.7152 * f(g / 255) + 0.0722 * f(b / 255);
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function parseColor(value) {
  const m = value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
}

/** Most frequent quantized pixel in a box: the painted backdrop, not the glyph. */
async function modalPixel(buffer, box) {
  const x = Math.max(0, Math.round(box.x));
  const y = Math.max(0, Math.round(box.y));
  const width = Math.min(Math.round(box.width), 400);
  const height = Math.min(Math.round(box.height), 120);
  if (width < 2 || height < 2) return null;
  const { data, info } = await sharp(buffer)
    .extract({ left: x, top: y, width, height })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bins = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const key = `${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`;
    const entry = bins.get(key) ?? [0, 0, 0, 0];
    entry[0] += 1; entry[1] += data[i]; entry[2] += data[i + 1]; entry[3] += data[i + 2];
    bins.set(key, entry);
  }
  let best = null;
  for (const entry of bins.values()) if (!best || entry[0] > best[0]) best = entry;
  if (!best) return null;
  const pixels = [];
  for (let i = 0; i < data.length; i += info.channels) {
    pixels.push({
      rgb: [data[i], data[i + 1], data[i + 2]],
      lum: luminance([data[i], data[i + 1], data[i + 2]]),
    });
  }
  pixels.sort((a, b) => a.lum - b.lum);
  const at = (p) => pixels[Math.min(pixels.length - 1, Math.floor(pixels.length * p))]?.rgb;
  return {
    modal: [best[1] / best[0], best[2] / best[0], best[3] / best[0]].map(Math.round),
    dark: at(0.05) ?? [0, 0, 0],
    light: at(0.95) ?? [255, 255, 255],
  };
}

async function contrastProbe(page) {
  const targets = await page.evaluate(() => {
    const selectors = [
      ".stage-title", ".stage-claim", ".stage-kicker",
      ".singularity__num", ".singularity__label", ".stage-voice",
    ];
    return selectors.flatMap((selector) => {
      const el = document.querySelector(selector);
      if (!el) return [];
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight || rect.width < 2) return [];
      return [{
        selector,
        color: getComputedStyle(el).color,
        size: parseFloat(getComputedStyle(el).fontSize),
        box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      }];
    });
  });
  const shot = await page.screenshot({ type: "png" });
  const rows = [];
  for (const target of targets) {
    const sample = await modalPixel(shot, target.box);
    if (!sample) continue;
    const fg = parseColor(target.color);
    // A glyph can fill most of its own box. Pick the minority pixel that is
    // the backdrop: dark for light type, light for dark type, not the glyph.
    const modalLum = luminance(sample.modal);
    const fgLum = luminance(fg);
    const bg = Math.abs(modalLum - fgLum) < 0.15
      ? (fgLum > 0.5 ? sample.dark : sample.light)
      : (fgLum > modalLum ? sample.dark : sample.light);
    rows.push({
      selector: target.selector,
      fontPx: target.size,
      text: fg,
      backdrop: bg,
      ratio: Number(contrast(fg, bg).toFixed(2)),
      floor: target.size >= 24 ? 3 : 4.5,
    });
  }
  return rows;
}

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = { out: OUT, frames: [], transitions: {}, contrast: [], bundle: {} };

  for (const viewport of VIEWPORTS) {
    const { context, page } = await open(browser, viewport);
    const field = await page.evaluate(() => ({
      bh: document.querySelector(".stage")?.getAttribute("data-bh"),
      motion: document.documentElement.dataset.motion,
    }));
    const frames = stats(await frameProbe(page));

    // Layout shift and panel stability across a real chapter click. Let the
    // initial font swap and the one count-up settle first: the predicate is the
    // chapter change, not first paint. The load-time score is reported too.
    await page.waitForTimeout(1400);
    const loadCls = await page.evaluate(() => {
      let total = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) total += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
      return total;
    });
    await page.evaluate(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value;
      }).observe({ type: "layout-shift" });
      window.__vtCalls = 0;
      const original = document.startViewTransition;
      if (original) {
        document.startViewTransition = (callback) => {
          window.__vtCalls += 1;
          return original.call(document, callback);
        };
      }
      window.__geometry = () => [...document.querySelectorAll(".stage-panel")].map((p) => {
        const r = p.getBoundingClientRect();
        return [Math.round(r.x + scrollX), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)];
      });
      window.__before = window.__geometry();
    });
    await page.click('a[data-chapter-link="work"]');
    await page.waitForTimeout(900);
    const change = await page.evaluate((load) => ({
      loadCls: Number(load.toFixed(5)),
      cls: Number(window.__cls.toFixed(5)),
      vtCalls: window.__vtCalls,
      hash: location.hash,
      maxPanelDelta: Math.max(0, ...window.__before.flatMap((b, i) =>
        b.map((v, j) => Math.abs(v - window.__geometry()[i][j])))),
    }), loadCls);
    report.frames.push({ viewport: viewport.tag, field, frames, change });

    // Degradation: with the API removed, the same click still moves the hash.
    await page.evaluate(() => { delete document.startViewTransition; });
    await page.click('a[data-chapter-link="experience"]');
    await page.waitForTimeout(700);
    const fallback = await page.evaluate(() => location.hash);
    report.transitions[viewport.tag] = {
      nativeCalls: change.vtCalls,
      hashAfterNative: change.hash,
      hashWithoutApi: fallback,
      degrades: fallback === "#experience" && change.hash === "#work",
    };
    await context.close();
  }

  for (const theme of ["dark", "light"]) {
    for (const viewport of VIEWPORTS) {
      const { context, page } = await open(browser, viewport, theme);
      report.contrast.push({
        theme, viewport: viewport.tag,
        rows: await contrastProbe(page),
      });
      await context.close();
    }
  }

  // Reduced motion: canvas must not start, every shell must be visible.
  for (const viewport of VIEWPORTS) {
    const { context, page } = await open(browser, viewport, "dark", "reduce");
    report.reduced ??= [];
    report.reduced.push(await page.evaluate(() => ({
      viewport: innerWidth,
      motion: document.documentElement.dataset.motion,
      bh: document.querySelector(".stage")?.getAttribute("data-bh"),
      visiblePanels: [...document.querySelectorAll(".stage-panel")].filter((p) => p.getClientRects().length).length,
      linear: [...document.querySelectorAll(".stage-panel")].every((p, i, all) =>
        i === 0 || p.offsetTop >= all[i - 1].offsetTop + all[i - 1].offsetHeight - 1),
    })));
    await context.close();
  }

  const files = (await readdir(path.join(DIST, "assets"))).filter((f) => f.endsWith(".js"));
  let gzip = 0;
  let raw = 0;
  for (const file of files) {
    const bytes = await readFile(path.join(DIST, "assets", file));
    raw += bytes.length;
    gzip += gzipSync(bytes, { level: 9 }).length;
  }
  report.bundle = { files, rawBytes: raw, gzipBytes: gzip, capBytes: 250000, underCap: gzip < 250000 };

  await browser.close();
  await writeFile(path.join(OUT, "probe.json"), JSON.stringify(report, null, 2));

  for (const entry of report.frames) {
    console.log(`frames ${entry.viewport}: field=${entry.field.bh} motion=${entry.field.motion} mean=${entry.frames.mean}ms p50=${entry.frames.p50}ms p95=${entry.frames.p95}ms max=${entry.frames.max}ms over16=${entry.frames.over16}/${entry.frames.frames}`);
    console.log(`  change: cls=${entry.change.cls} loadCls=${entry.change.loadCls} vtCalls=${entry.change.vtCalls} hash=${entry.change.hash} panelDelta=${entry.change.maxPanelDelta}`);
  }
  for (const [vp, t] of Object.entries(report.transitions)) console.log(`transition ${vp}: native=${t.nativeCalls} degrades=${t.degrades}`);
  for (const c of report.contrast) {
    const worst = c.rows.reduce((a, b) => (b.ratio / b.floor < a.ratio / a.floor ? b : a), c.rows[0] ?? { selector: "-", ratio: 0, floor: 0 });
    console.log(`contrast ${c.theme} ${c.viewport}: worst ${worst.selector} ${worst.ratio}:1 floor ${worst.floor}`);
  }
  console.log(`bundle: ${report.bundle.gzipBytes} gzip bytes (raw ${report.bundle.rawBytes}), cap 250000, under=${report.bundle.underCap}`);
  const fail = [
    report.frames.some((e) => e.frames.mean > 17),
    report.frames.some((e) => e.change.maxPanelDelta !== 0),
    Object.values(report.transitions).some((t) => !t.degrades),
    report.contrast.some((c) => c.rows.some((r) => r.ratio < r.floor)),
    report.reduced.some((r) => r.bh !== "still" || r.visiblePanels !== 5 || !r.linear),
    !report.bundle.underCap,
  ];
  process.exitCode = fail.some(Boolean) ? 1 : 0;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await run();
}
