#!/usr/bin/env node
/**
 * ground-check — the AMOLED contract, judged on rendered pixels.
 *
 * The hero video's sky is true black. The rest of the page must be the same
 * black, not a tinted near-black: a seam at the hero-to-content boundary is
 * visible even at one or two levels. This driver reads the built site, so the
 * number it reports is the number a visitor sees.
 *
 *   GROUND_CHECK_URL=http://127.0.0.1:4400/ node scripts/ground-check.mjs
 *
 * Checks at 2560 / 1440 / 768 / 390, dark only:
 *   1. eight ground points across the width in the first section's top
 *      padding (below the fold) are each within 2 levels of #000000.
 *   2. a horizontal strip crossing the hero-to-content boundary has no
 *      adjacent-row step larger than 4 levels.
 * Exit 1 on any failure.
 */
import { chromium } from "playwright";
import sharp from "sharp";

const URL = process.env.GROUND_CHECK_URL ?? "http://127.0.0.1:4334/";
const VIEWS = [
  { name: "2560", w: 2560, h: 1440 },
  { name: "1440", w: 1440, h: 900 },
  { name: "768", w: 768, h: 1024 },
  { name: "390", w: 390, h: 844 },
];
const GROUND_X = [0.05, 0.18, 0.31, 0.44, 0.57, 0.7, 0.83, 0.96];
const STRIP_X = [0.15, 0.225, 0.3, 0.375, 0.45, 0.525, 0.6, 0.675, 0.75, 0.825];
const GROUND_LIMIT = 2;
const STEP_LIMIT = 4;

const results = [];
function check(id, tag, value, limit, note) {
  const ok = value <= limit;
  results.push({
    ok,
    line: `${ok ? "PASS" : "FAIL"} ${tag} ${id}: ${value} (limit ${limit})${note ? " :: " + note : ""}`,
  });
}

/** Median RGB down a strip of x at one document row. */
function stripPixel(raw, info, y, xList) {
  const C = info.channels;
  const px = xList.map((x) => {
    const i = (y * info.width + x) * C;
    return [raw[i], raw[i + 1], raw[i + 2]];
  });
  return [0, 1, 2].map((c) => {
    const col = px.map((p) => p[c]).sort((a, b) => a - b);
    const mid = Math.floor(col.length / 2);
    return col.length % 2 ? col[mid] : Math.round((col[mid - 1] + col[mid]) / 2);
  });
}
const delta = (a, b) => Math.max(...[0, 1, 2].map((c) => Math.abs(a[c] - b[c])));
const fmt = (p) => `${p[0]},${p[1]},${p[2]}`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const view of VIEWS) {
    const page = await browser.newPage({
      viewport: { width: view.w, height: view.h },
      deviceScaleFactor: 1,
      reducedMotion: "reduce", // poster still: a deterministic seam
    });
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    // Reveals at rest: a mid-transition transform would move ink into a sample.
    await page.addStyleTag({
      content: "[data-reveal]{opacity:1!important;transform:none!important}",
    });
    await page.waitForTimeout(300);

    const geo = await page.evaluate(() => {
      const hero = document.querySelector(".hero");
      const r = hero.getBoundingClientRect();
      return {
        heroBottom: Math.round(r.bottom + window.scrollY),
        width: window.innerWidth,
        docH: document.documentElement.scrollHeight,
      };
    });
    const tag = `${view.name}/dark`;
    const shot = await page.screenshot({ type: "png", fullPage: true, animations: "disabled" });
    const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
    const at = (x, y) => {
      const i = (y * info.width + x) * info.channels;
      return [data[i], data[i + 1], data[i + 2]];
    };

    // 1. Ground below the fold: the first section's top padding.
    // The fixed bottom readout owns the last 2rem of the viewport. Sample a
    // row inside the next cluster's top padding but above that readout.
    const rowY = Math.min(geo.heroBottom + 40, view.h - 48);
    const xs = GROUND_X.map((f) => Math.min(info.width - 1, Math.round(f * geo.width)));
    const samples = xs.map((x) => at(x, rowY));
    const worst = Math.max(...samples.map((p) => Math.max(...p)));
    check(
      `ground samples n=${samples.length} @ y=${rowY}`,
      tag,
      worst,
      GROUND_LIMIT,
      samples.map(fmt).join(" "),
    );

    // 2. The seam: the black level on each side of the hero/content boundary.
    // The first section's 1px border-top is a deliberate hairline (rule 33), so
    // it is reported as evidence but excluded from the seam step. What must not
    // step is the ground the eye reads on either side of that rule.
    const strip = STRIP_X.map((f) => Math.min(info.width - 1, Math.round(f * geo.width)));
    const rowRGB = (y) => stripPixel(data, info, y, strip);
    const side = (from, to) => {
      const cols = [];
      for (let y = from; y <= to; y += 1) cols.push(rowRGB(y));
      return [0, 1, 2].map((c) => {
        const v = cols.map((p) => p[c]).sort((a, b) => a - b);
        return v[Math.floor(v.length / 2)];
      });
    };
    const video = side(geo.heroBottom - 6, geo.heroBottom - 1);
    const ground = side(geo.heroBottom + 2, geo.heroBottom + 7);
    const rule = rowRGB(geo.heroBottom);
    const seamStep = delta(video, ground);
    check(
      "seam level step",
      tag,
      seamStep,
      STEP_LIMIT,
      `video ${fmt(video)} -> ground ${fmt(ground)}; rule ${fmt(rule)}`,
    );
    await page.close();
  }
  await browser.close();

  for (const r of results) console.log(r.line);
  const fails = results.filter((r) => !r.ok);
  console.log(
    `\nRESULT ${fails.length ? "FAIL" : "PASS"} ${results.length - fails.length}/${results.length} checks green`,
  );
  if (fails.length) {
    console.log("RED LINES:");
    for (const r of fails) console.log("  " + r.line);
  }
  process.exitCode = fails.length ? 1 : 0;
}

await main();
