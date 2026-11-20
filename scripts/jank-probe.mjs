#!/usr/bin/env node
/**
 * jank-probe — the frozen hillclimb oracle.
 *
 * One command. Three runs per viewport, median reported. Serves dist/ through
 * request interception and scrolls the full document with trusted mouse.wheel,
 * then measures a chapter click. Reports frame pacing, long tasks, CLS and the
 * main-thread work counted by CDP.
 *
 *   node scripts/jank-probe.mjs <label> <outDir> [gpu|swiftshader] [full|reduce]
 *
 * Sensitivity: swiftshader/full must separate from swiftshader/reduce. If it
 * does not, the harness is blind to shader cost and must not be trusted.
 */
import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const LABEL = process.argv[2] ?? "run";
const OUT = path.resolve(process.argv[3] ?? path.join(process.env.TEMP ?? ".", "opencode", "c2-jank"));
const MODE = process.argv[4] ?? "gpu";
const REDUCED = (process.argv[5] ?? "full") === "reduce";
const ORIGIN = "http://jank.local";
const ARGS = MODE === "gpu"
  ? ["--use-gl=angle", "--use-angle=d3d11", "--ignore-gpu-blocklist"]
  : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".woff2": "font/woff2", ".svg": "image/svg+xml",
  ".png": "image/png", ".pdf": "application/pdf", ".txt": "text/plain; charset=utf-8",
};
const ALL_VIEWPORTS = [
  { width: 2560, height: 1440, tag: "2560" },
  { width: 1440, height: 900, tag: "1440" },
  { width: 390, height: 844, tag: "390" },
];
const only = (process.env.PROBE_VIEWPORTS ?? "").split(",").filter(Boolean);
const VIEWPORTS = only.length
  ? ALL_VIEWPORTS.filter((v) => only.includes(v.tag))
  : ALL_VIEWPORTS;
const RUNS = 3;

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

function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
  return {
    n: sorted.length,
    mean: Number((sorted.reduce((a, b) => a + b, 0) / Math.max(1, sorted.length)).toFixed(2)),
    p50: Number(at(0.5).toFixed(2)),
    p95: Number(at(0.95).toFixed(2)),
    max: Number(at(1).toFixed(2)),
    over20: sorted.filter((v) => v > 20).length,
  };
}

const median = (values) => {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

async function sampler(page) {
  await page.evaluate(() => {
    window.__jank = { frames: [], running: true, cls: 0, long: 0 };
    let last = performance.now();
    const tick = (now) => {
      if (!window.__jank.running) return;
      window.__jank.frames.push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__jank.cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      window.__jank.long += list.getEntries().length;
    }).observe({ type: "longtask", buffered: true });
  });
}

async function stopSampler(page) {
  return page.evaluate(() => {
    window.__jank.running = false;
    const c = document.querySelector("canvas.bh-canvas");
    return {
      frames: window.__jank.frames.slice(8),
      cls: Number(window.__jank.cls.toFixed(5)),
      longTasks: window.__jank.long,
      canvas: c ? [c.width, c.height] : null,
      quality: window.__stageQuality ?? null,
      navs: document.querySelectorAll("nav").length,
    };
  });
}

async function metrics(session, name) {
  const snapshot = await session.send("Performance.getMetrics");
  return snapshot.metrics.find((m) => m.name === name)?.value ?? 0;
}

async function scrollRun(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    reducedMotion: REDUCED ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  await serve(page);
  await page.goto(ORIGIN, { waitUntil: "load" });
  await page.waitForSelector("main h1", { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);

  const session = await context.newCDPSession(page);
  await session.send("Performance.enable");
  const renderer = await page.evaluate(() => {
    const c = document.createElement("canvas");
    const g = c.getContext("webgl");
    const e = g?.getExtension("WEBGL_debug_renderer_info");
    return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : "no-ext";
  });

  await sampler(page);
  const total = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  const before = {
    recalc: await metrics(session, "RecalcStyleCount"),
    recalcMs: await metrics(session, "RecalcStyleDuration"),
    layout: await metrics(session, "LayoutCount"),
    layoutMs: await metrics(session, "LayoutDuration"),
    script: await metrics(session, "ScriptDuration"),
    task: await metrics(session, "TaskDuration"),
  };
  const steps = 60;
  const step = Math.ceil(total / steps);
  for (let i = 0; i < steps; i += 1) {
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    await page.mouse.wheel(0, step);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
  }
  await page.waitForTimeout(300);
  const after = {
    recalc: await metrics(session, "RecalcStyleCount"),
    recalcMs: await metrics(session, "RecalcStyleDuration"),
    layout: await metrics(session, "LayoutCount"),
    layoutMs: await metrics(session, "LayoutDuration"),
    script: await metrics(session, "ScriptDuration"),
    task: await metrics(session, "TaskDuration"),
  };
  const raw = await stopSampler(page);
  const cost = {
    recalc: Math.round(after.recalc - before.recalc),
    recalcMs: Number(((after.recalcMs - before.recalcMs) * 1000).toFixed(1)),
    layout: Math.round(after.layout - before.layout),
    layoutMs: Number(((after.layoutMs - before.layoutMs) * 1000).toFixed(1)),
    scriptMs: Number(((after.script - before.script) * 1000).toFixed(1)),
    taskMs: Number(((after.task - before.task) * 1000).toFixed(1)),
  };
  await context.close();
  return { renderer, pacing: stats(raw.frames), cls: raw.cls, longTasks: raw.longTasks, canvas: raw.canvas, quality: raw.quality, navs: raw.navs, cost, errors };
}

async function clickRun(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    reducedMotion: REDUCED ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  await serve(page);
  await page.goto(ORIGIN, { waitUntil: "load" });
  await page.waitForSelector("main h1", { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const session = await context.newCDPSession(page);
  await session.send("Performance.enable");
  await page.evaluate(() => {
    window.__jank = { frames: [], running: true, long: 0 };
    let last = performance.now();
    const tick = (now) => {
      if (!window.__jank.running) return;
      window.__jank.frames.push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    new PerformanceObserver((list) => {
      window.__jank.long += list.getEntries().length;
    }).observe({ type: "longtask", buffered: true });
  });
  const longBefore = await metrics(session, "LongTaskCount");
  await page.click('a[data-chapter-link="work"]');
  await page.waitForTimeout(900);
  const raw = await page.evaluate(() => {
    window.__jank.running = false;
    return { frames: window.__jank.frames.slice(4), long: window.__jank.long, hash: location.hash };
  });
  const longAfter = await metrics(session, "LongTaskCount");
  await context.close();
  return {
    pacing: stats(raw.frames),
    over33: raw.frames.filter((v) => v > 33).length,
    longTasks: raw.long,
    cdpLong: Math.round(longAfter - longBefore),
    hash: raw.hash,
  };
}

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ARGS });
  const report = { label: LABEL, mode: MODE, reduced: REDUCED, args: ARGS, created: new Date().toISOString(), viewports: [] };

  for (const viewport of VIEWPORTS) {
    const scrolls = [];
    const clicks = [];
    for (let i = 0; i < RUNS; i += 1) {
      scrolls.push(await scrollRun(browser, viewport));
      clicks.push(await clickRun(browser, viewport));
    }
    const medianOf = (pathFn) => median(scrolls.map(pathFn));
    const result = {
      viewport: viewport.tag,
      renderer: scrolls[0].renderer,
      scroll: {
        p50: medianOf((r) => r.pacing.p50),
        p95: medianOf((r) => r.pacing.p95),
        max: medianOf((r) => r.pacing.max),
        over20: medianOf((r) => r.pacing.over20),
        frames: medianOf((r) => r.pacing.n),
        longTasks: medianOf((r) => r.longTasks),
        cls: medianOf((r) => r.cls),
        canvas: scrolls[0].canvas,
        quality: scrolls[0].quality,
        navs: scrolls[0].navs,
        cost: {
          recalc: medianOf((r) => r.cost.recalc),
          recalcMs: medianOf((r) => r.cost.recalcMs),
          layout: medianOf((r) => r.cost.layout),
          layoutMs: medianOf((r) => r.cost.layoutMs),
          scriptMs: medianOf((r) => r.cost.scriptMs),
          taskMs: medianOf((r) => r.cost.taskMs),
        },
      },
      click: {
        p50: median(clicks.map((r) => r.pacing.p50)),
        p95: median(clicks.map((r) => r.pacing.p95)),
        max: median(clicks.map((r) => r.pacing.max)),
        over33: median(clicks.map((r) => r.over33)),
        longTasks: median(clicks.map((r) => r.longTasks)),
        cdpLong: median(clicks.map((r) => r.cdpLong)),
        hash: clicks[0].hash,
      },
      errors: scrolls.flatMap((r) => r.errors).slice(0, 3),
    };
    report.viewports.push(result);
    const s = result.scroll;
    const c = result.click;
    console.log(`${LABEL} ${viewport.tag} ${MODE}${REDUCED ? "/reduce" : ""} renderer=${result.renderer.slice(0, 64)}`);
    console.log(`  scroll p50=${s.p50} p95=${s.p95} max=${s.max} over20=${s.over20}/${s.frames} long=${s.longTasks} cls=${s.cls} canvas=${s.canvas} q=${JSON.stringify(s.quality)}`);
    console.log(`  work recalc=${s.cost.recalc}(${s.cost.recalcMs}ms) layout=${s.cost.layout}(${s.cost.layoutMs}ms) script=${s.cost.scriptMs}ms task=${s.cost.taskMs}ms`);
    console.log(`  click p50=${c.p50} p95=${c.p95} max=${c.max} over33=${c.over33} long=${c.longTasks} cdpLong=${c.cdpLong} hash=${c.hash}`);
    if (result.errors.length) console.log(`  errors=${JSON.stringify(result.errors)}`);
  }
  await browser.close();
  const file = path.join(OUT, `${LABEL}.json`);
  await writeFile(file, JSON.stringify(report, null, 2));
  console.log(`artifact: ${file}`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await run();
}
