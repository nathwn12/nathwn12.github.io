/** Render the OG card from the committed design law and the content record.
 *  Usage: node scripts/gen-og.mjs   (run from the worktree root) */
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

const root = process.cwd();
const read = (rel) => readFileSync(join(root, rel), "utf8");
const { chromium } = createRequire(join(root, "package.json"))("playwright");

/** Colors come from tokens.css, the only place a color is written. */
const tokens = read("src/styles/tokens.css");
function token(name) {
  const match = tokens.match(
    new RegExp(`--color-${name}\\s*:\\s*(#[0-9a-fA-F]+)\\b`),
  );
  if (!match) throw new Error(`gen-og: missing --color-${name}`);
  return match[1];
}

/** The card's title comes from the design law's frontmatter. */
const lawName = read("DESIGN.md").match(/^name:\s*(.+)$/m)?.[1]?.trim();
if (!lawName) throw new Error("gen-og: DESIGN.md has no name");

/** Copy and figures are read from src/content, never retyped here. */
function stringConst(rel, key) {
  const match = read(rel).match(
    new RegExp(`export const ${key}\\s*=\\s*"([^"]+)"`),
  );
  if (!match) throw new Error(`gen-og: ${rel} has no string ${key}`);
  return match[1];
}
const name = stringConst("src/content/ledger.ts", "name");
const provenance = stringConst("src/content/experience.ts", "provenance");
const stats = JSON.parse(read("src/content/open-source-stats.json"));
const downloads = stats.npmAllTime.toLocaleString("en-US");
const escape = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ground = token("ground");
const ink = token("ink");
const inkMuted = token("ink-muted");
const signal = token("signal");
const measure = token("measure");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:"Libre Bodoni";font-style:normal;font-weight:400 700;src:url("http://og.local/fonts/libre-bodoni-latin-var.woff2") format("woff2")}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:400;src:url("http://og.local/fonts/ibm-plex-mono-400-latin.woff2") format("woff2")}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:600;src:url("http://og.local/fonts/ibm-plex-mono-600-latin.woff2") format("woff2")}
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px;background:${ground};color:${ink}}
.card{width:1200px;height:630px;padding:64px 80px;display:flex;flex-direction:column;font-family:"Libre Bodoni",serif}
.eyebrow{font-family:"IBM Plex Mono",monospace;font-size:18px;letter-spacing:.06em;color:${signal}}
h1{font-size:92px;font-weight:500;line-height:.92;letter-spacing:-.01em;margin-top:36px}
.prov{font-family:"IBM Plex Mono",monospace;font-size:16px;line-height:1.45;color:${inkMuted};margin-top:28px}
.rule{height:1px;background:${inkMuted};opacity:.35;margin-top:auto}
.figure{font-family:"IBM Plex Mono",monospace;font-size:72px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums;color:${measure};margin-top:28px}
.label{font-family:"IBM Plex Mono",monospace;font-size:16px;letter-spacing:.06em;color:${inkMuted};margin-top:12px}
.footer{display:flex;justify-content:space-between;font-family:"IBM Plex Mono",monospace;font-size:16px;letter-spacing:.06em;color:${inkMuted};margin-top:28px}
.cta{color:${signal}}
</style></head><body><div class="card">
<div class="eyebrow">${escape(lawName)} / 2026</div>
<h1>${escape(name)}</h1>
<div class="prov">${escape(provenance)}</div>
<div class="rule"></div>
<div class="figure">${downloads}</div>
<div class="label">npm downloads / all time · measured ${stats.snapshotDate}</div>
<div class="footer"><span>nathwn12.github.io</span><span class="cta">Email me</span></div>
</div></body></html>`;

const filename = `og-image-${new Date().toISOString().slice(0, 10)}.png`;
const outFile = join(root, "public", filename);
mkdirSync(dirname(outFile), { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.route("http://og.local/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith("/fonts/")) {
      await route.fulfill({
        status: 200,
        body: readFileSync(join(root, "public", path)),
        contentType: "font/woff2",
      });
    } else {
      await route.fulfill({ status: 200, body: html, contentType: "text/html" });
    }
  });
  await page.goto("http://og.local/", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: outFile });
} finally {
  await browser.close();
}

const meta = await sharp(outFile).metadata();
if (meta.width !== 1200 || meta.height !== 630) {
  throw new Error(`gen-og: rendered ${meta.width}x${meta.height}, expected 1200x630`);
}
console.log(`OK: wrote ${resolve(outFile)} (${meta.width}x${meta.height})`);
