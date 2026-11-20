#!/usr/bin/env node
/**
 * bug-probe — the no-bugs predicate.
 *
 * Loads the shipped dist/ at five widths in both themes and checks console and
 * page errors, 404s, overflow, overlap, hash/back/forward, keyboard order,
 * reduced motion, WebGL failure and load CLS. One JSON artifact.
 *
 *   node scripts/bug-probe.mjs <outDir>
 */
import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const OUT = path.resolve(process.argv[2] ?? path.join(process.env.TEMP ?? ".", "opencode", "c2-bugs"));
const ORIGIN = "http://bugs.local";
const ARGS = ["--use-gl=angle", "--use-angle=d3d11", "--ignore-gpu-blocklist"];
const WIDTHS = [320, 390, 768, 1440, 2560];
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

async function open(browser, width, theme = "dark", reducedMotion = "no-preference", before) {
  const height = width >= 2000 ? 1440 : width >= 1000 ? 900 : 844;
  const context = await browser.newContext({
    viewport: { width, height }, deviceScaleFactor: 1, colorScheme: theme, reducedMotion,
  });
  const page = await context.newPage();
  const errors = [];
  const failed = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 180)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 160)}`); });
  page.on("response", (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  if (before) await before(page);
  await serve(page);
  await page.goto(ORIGIN, { waitUntil: "load" });
  await page.waitForSelector("main h1", { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  return { context, page, errors, failed };
}

async function geometry(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const text = [...document.querySelectorAll("main *")]
      .filter((el) => el.children.length === 0)
      .filter((el) => el.getClientRects().length > 0)
      .filter((el) => !el.closest(".singularity"))
      .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1))
      .map((el) => ({ el, r: el.getBoundingClientRect() }));
    const overlaps = [];
    for (let i = 0; i < text.length; i += 1) {
      for (let j = i + 1; j < text.length; j += 1) {
        const a = text[i].r; const b = text[j].r;
        if (text[i].el.contains(text[j].el) || text[j].el.contains(text[i].el)) continue;
        const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ix > 2 && iy > 2) overlaps.push([text[i].el.className || text[i].el.tagName, text[j].el.className || text[j].el.tagName]);
      }
    }
    const links = [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
    const internalMissing = links
      .filter((h) => h && h.startsWith("#"))
      .filter((h) => h.length > 1 && !document.getElementById(h.slice(1)));
    return {
      overflow: de.scrollWidth - de.clientWidth,
      navs: document.querySelectorAll("nav").length,
      headings: document.querySelectorAll(".stage-panel h1, .stage-panel h2").length,
      panels: document.querySelectorAll(".stage-panel").length,
      overlaps: overlaps.slice(0, 8),
      overlapCount: overlaps.length,
      internalMissing,
      links: links.length,
      bh: document.querySelector(".stage")?.dataset.bh,
      stillOpacity: getComputedStyle(document.querySelector(".bh-still")).opacity,
    };
  });
}

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ARGS });
  const report = { created: new Date().toISOString(), widths: [], hash: {}, keyboard: {}, reduced: [], webglFail: {}, cls: {}, checks: {} };

  for (const width of WIDTHS) {
    for (const theme of ["dark", "light"]) {
      const { context, page, errors, failed } = await open(browser, width, theme);
      const g = await geometry(page);
      report.widths.push({ width, theme, ...g, errors, failed });
      await context.close();
    }
  }

  // Hash routing, back and forward at 1440.
  {
    const { context, page, errors } = await open(browser, 1440);
    const ids = ["person", "method", "work", "experience", "contact"];
    const forward = [];
    for (const id of ids) {
      await page.click(`a[data-chapter-link="${id}"]`);
      await page.waitForTimeout(420);
      forward.push(await page.evaluate(() => ({ hash: location.hash, active: document.querySelector('[aria-current="true"]')?.getAttribute("data-chapter-link") })));
    }
    const back = [];
    for (let i = 0; i < 4; i += 1) {
      await page.goBack();
      await page.waitForTimeout(350);
      back.push(await page.evaluate(() => ({ hash: location.hash, active: document.querySelector('[aria-current="true"]')?.getAttribute("data-chapter-link") })));
    }
    const fwd = [];
    for (let i = 0; i < 2; i += 1) {
      await page.goForward();
      await page.waitForTimeout(350);
      fwd.push(await page.evaluate(() => ({ hash: location.hash, active: document.querySelector('[aria-current="true"]')?.getAttribute("data-chapter-link") })));
    }
    report.hash = { forward, back, fwd, errors };
    await context.close();
  }

  // Keyboard tab order and focus ring at 1440.
  {
    const { context, page } = await open(browser, 1440);
    const expected = await page.evaluate(() =>
      [...document.querySelectorAll("a[href], button, [tabindex]:not([tabindex='-1'])")]
        .filter((el) => el.getClientRects().length > 0)
        .map((el) => el.getAttribute("data-chapter-link") ?? el.getAttribute("aria-label") ?? el.textContent.trim().slice(0, 24)));
    const seen = [];
    for (let i = 0; i < 14; i += 1) {
      await page.keyboard.press("Tab");
      seen.push(await page.evaluate(() => {
        const el = document.activeElement;
        const s = getComputedStyle(el);
        return {
          name: el.getAttribute("data-chapter-link") ?? el.getAttribute("aria-label") ?? (el.textContent ?? "").trim().slice(0, 24),
          outline: s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 1,
        };
      }));
    }
    report.keyboard = { expected: expected.slice(0, 14), seen };
    await context.close();
  }

  // Reduced motion.
  for (const width of [390, 2560]) {
    const { context, page } = await open(browser, width, "dark", "reduce");
    report.reduced.push(await page.evaluate(() => ({
      width: innerWidth,
      motion: document.documentElement.dataset.motion,
      bh: document.querySelector(".stage")?.dataset.bh,
      canvasDisplay: getComputedStyle(document.querySelector("canvas.bh-canvas")).display,
      panelsVisible: [...document.querySelectorAll(".stage-panel")].filter((p) => p.getClientRects().length).length,
      panelAnimation: getComputedStyle(document.querySelector(".stage-panel")).animationName,
    })));
    await context.close();
  }

  // WebGL failure path.
  {
    const { context, page } = await open(browser, 1440, "dark", "no-preference", async (p) => {
      await p.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
          if (String(type).includes("webgl")) return null;
          return original.call(this, type, ...rest);
        };
      });
    });
    report.webglFail = await page.evaluate(() => ({
      bh: document.querySelector(".stage")?.dataset.bh,
      canvasDisplay: getComputedStyle(document.querySelector("canvas.bh-canvas")).display,
      stillOpacity: getComputedStyle(document.querySelector(".bh-still")).opacity,
      stillHorizon: Boolean(document.querySelector(".bh-still__horizon")),
    }));
    await context.close();
  }

  // Load CLS at 390.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await serve(page);
    await page.goto(ORIGIN, { waitUntil: "load" });
    await page.waitForTimeout(2600);
    report.cls = await page.evaluate(() => Number(window.__cls.toFixed(5)));
    await context.close();
  }

  await browser.close();
  const widthFails = report.widths.filter((w) => w.errors.length || w.failed.length || w.overflow > 0 || w.navs !== 1 || w.headings !== 5 || w.overlapCount > 0 || w.internalMissing.length);
  const hashFail = report.hash.forward.some((f, i) => f.active !== ["person", "method", "work", "experience", "contact"][i])
    || report.hash.back.some((b) => b.active !== b.hash.replace("#", ""));
  const keyboardFail = report.keyboard.seen.some((s) => !s.outline)
    || report.keyboard.seen.map((s) => s.name).join("|") !== report.keyboard.expected.join("|");
  const reducedFail = report.reduced.some((r) => r.motion !== "off" || r.bh !== "still" || r.canvasDisplay !== "none" || r.panelsVisible !== 5 || r.panelAnimation !== "none");
  const webglFail = report.webglFail.bh !== "still" || report.webglFail.canvasDisplay !== "none" || report.webglFail.stillOpacity === "0";
  report.checks = {
    widths: !widthFails.length,
    hash: !hashFail,
    keyboard: !keyboardFail,
    reduced: !reducedFail,
    webgl: !webglFail,
    cls: report.cls === 0,
  };
  await writeFile(path.join(OUT, "bugs.json"), JSON.stringify(report, null, 2));

  for (const w of report.widths) {
    const bad = w.errors.length || w.failed.length || w.overflow > 0 || w.overlapCount > 0;
    console.log(`${bad ? "FAIL" : "PASS"} ${w.width} ${w.theme} overflow=${w.overflow} nav=${w.navs} headings=${w.headings} overlap=${w.overlapCount} errors=${w.errors.length} 404=${w.failed.length}`);
    if (w.overlaps.length) console.log(`  overlaps=${JSON.stringify(w.overlaps.slice(0, 3))}`);
    if (w.errors.length) console.log(`  errors=${JSON.stringify(w.errors.slice(0, 2))}`);
    if (w.failed.length) console.log(`  failed=${JSON.stringify(w.failed.slice(0, 2))}`);
  }
  console.log(`hash forward=${JSON.stringify(report.hash.forward.map((f) => f.hash))} back=${JSON.stringify(report.hash.back.map((b) => b.hash))} fwd=${JSON.stringify(report.hash.fwd.map((f) => f.hash))}`);
  console.log(`keyboard match=${keyboardFail ? "FAIL" : "PASS"} seen=${JSON.stringify(report.keyboard.seen.map((s) => s.name))}`);
  console.log(`reduced=${reducedFail ? "FAIL" : "PASS"} ${JSON.stringify(report.reduced)}`);
  console.log(`webgl=${webglFail ? "FAIL" : "PASS"} ${JSON.stringify(report.webglFail)}`);
  console.log(`cls=${report.cls}`);
  console.log(`checks=${JSON.stringify(report.checks)}`);
  const failedCheck = Object.values(report.checks).some((v) => !v);
  process.exitCode = failedCheck ? 1 : 0;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await run();
}
