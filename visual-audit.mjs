import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";

const OUT = "C:\\Users\\nathan\\AppData\\Local\\Temp\\opencode\\ses_ea4bec5e0ffeaIyt54wT05cu8n\\shoot";
const BASE = "http://localhost:5173";
fs.mkdirSync(OUT, { recursive: true });
const RX1 = new RegExp("^/");
const RX2 = /[^a-z0-9]+/gi;
const slug = (r) => (r === "/" ? "home" : r.replace(RX1, "").replace(RX2, "-"));
const results = [];
const consoleErrors = [];
const browser = await chromium.launch();

/* The page locks to one viewport: `.page-scroll` is the scroll container
   (body is overflow:hidden), so a plain fullPage shot only ever reaches the
   viewport height and the bands below the fold are never captured. Expand the
   scroller and every ancestor that clips before the full-page shot, so the
   document reaches its real height. */
const EXPAND_CSS = `
  html, body { overflow: visible !important; height: auto !important; }
  #root { height: auto !important; }
  #root > div { height: auto !important; min-height: 0 !important; display: block !important; }
  .page-scroll { overflow: visible !important; height: auto !important; max-height: none !important; flex: none !important; }
`;

async function capture(route, w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text().slice(0, 200));
  });
  page.on("pageerror", (err) => errors.push(String(err).slice(0, 200)));
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const tag = `v4-${slug(route)}-${w}x${h}`;

  // Full-page shot with the scroller expanded to its real height.
  await page.addStyleTag({ content: EXPAND_CSS });
  await page.waitForTimeout(400);
  const fullPath = path.join(OUT, `${tag}.png`);
  await page.screenshot({ path: fullPath, fullPage: true });
  const fullMeta = await sharp(fullPath).metadata();

  // Viewport shots at scroll offsets 0 / 50 / 100 % of .page-scroll: reload
  // to drop the expansion, then drive the real scroller.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const scrollShots = [];
  for (const frac of [0, 0.5, 1]) {
    await page.evaluate((f) => {
      const scroller = document.querySelector(".page-scroll");
      if (scroller) scroller.scrollTo(0, f * (scroller.scrollHeight - scroller.clientHeight));
    }, frac);
    await page.waitForTimeout(600);
    const pct = Math.round(frac * 100);
    const shotPath = path.join(OUT, `${tag}-scroll-${pct}.png`);
    await page.screenshot({ path: shotPath });
    const meta = await sharp(shotPath).metadata();
    scrollShots.push({ path: shotPath, width: meta.width, height: meta.height });
  }

  const data = await page.evaluate(() => {
    const textEls = Array.from(document.querySelectorAll("h1,h2,h3,p")).map((el) => {
      const r = el.getBoundingClientRect();
      return { tag: el.tagName.toLowerCase(), left: Math.round(r.left), width: Math.round(r.width), text: (el.innerText || "").slice(0, 80) };
    });
    const rules = [];
    const all = document.querySelectorAll("*");
    for (const el of all) {
      const btw = parseFloat(getComputedStyle(el).borderTopWidth);
      if (btw >= 1 && btw <= 4) {
        const r = el.getBoundingClientRect();
        if (r.width > 100) {
          rules.push({ tag: el.tagName.toLowerCase(), left: Math.round(r.left), right: Math.round(r.left + r.width), width: Math.round(r.width), btw, cls: (typeof el.className === "string" ? el.className : "").slice(0, 80) });
        }
      }
    }
    const scroller = document.querySelector(".page-scroll");
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      scrollerScrollHeight: scroller ? scroller.scrollHeight : null,
      scrollerClientHeight: scroller ? scroller.clientHeight : null,
      textEls,
      rules,
    };
  });
  results.push({
    route,
    viewport: `${w}x${h}`,
    fullPath,
    fullWidth: fullMeta.width,
    fullHeight: fullMeta.height,
    scrollShots,
    consoleErrorCount: errors.length,
    consoleErrorSample: errors.slice(0, 4),
    ...data,
  });
  consoleErrors.push({ route, viewport: `${w}x${h}`, count: errors.length });
  await page.close();
}
/* Dark-theme landing capture (v4 pass): a fresh context with a dark OS
   scheme, so the unpinned visitor starts dark via the pre-paint script —
   the same resolution a dark-OS visitor gets. Full-page (scroller expanded)
   plus the top viewport, tagged `-dark`. */
async function captureDark(route, w, h) {
  const page = await browser.newPage({
    viewport: { width: w, height: h },
    colorScheme: "dark",
  });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text().slice(0, 200));
  });
  page.on("pageerror", (err) => errors.push(String(err).slice(0, 200)));
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const tag = `v4-${slug(route)}-dark-${w}x${h}`;

  await page.addStyleTag({ content: EXPAND_CSS });
  await page.waitForTimeout(400);
  const fullPath = path.join(OUT, `${tag}.png`);
  await page.screenshot({ path: fullPath, fullPage: true });
  const fullMeta = await sharp(fullPath).metadata();

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const shotPath = path.join(OUT, `${tag}-scroll-0.png`);
  await page.screenshot({ path: shotPath });
  const meta = await sharp(shotPath).metadata();

  const theme = await page.evaluate(
    () => document.documentElement.dataset.theme,
  );
  results.push({
    route: `${route} (dark)`,
    viewport: `${w}x${h}`,
    fullPath,
    fullWidth: fullMeta.width,
    fullHeight: fullMeta.height,
    scrollShots: [{ path: shotPath, width: meta.width, height: meta.height }],
    consoleErrorCount: errors.length,
    consoleErrorSample: errors.slice(0, 4),
    appliedTheme: theme,
  });
  consoleErrors.push({ route: `${route} (dark)`, viewport: `${w}x${h}`, count: errors.length });
  await page.close();
}
for (const r of ["/", "/experience", "/projects", "/skills", "/contact"]) await capture(r, 1440, 900);
for (const dims of [[390, 844], [768, 1024], [1280, 800]]) await capture("/", dims[0], dims[1]);
await captureDark("/", 1440, 900);
await captureDark("/", 390, 844);
await browser.close();
console.log(JSON.stringify(results, null, 2));
console.log("CONSOLE_ERRORS:" + JSON.stringify(consoleErrors));
