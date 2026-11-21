/** Render the OG card from the committed design law and the singularity still.
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

/** Copy is read from src/content, never retyped here. */
function stringConst(rel, key) {
  const match = read(rel).match(
    new RegExp(`export const ${key}\\s*=\\s*"([^"]+)"`),
  );
  if (!match) throw new Error(`gen-og: ${rel} has no string ${key}`);
  return match[1];
}
const name = stringConst("src/content/ledger.ts", "name");
const provenance = stringConst("src/content/experience.ts", "provenance");
const escape = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ground = token("ground");
const ink = token("ink");
const inkMuted = token("ink-muted");
const signal = token("signal");

/** The still is the committed graded singularity poster — the hero's identity.
 *  Reading it from public/ keeps the generator self-contained: no temp path,
 *  no dev server, no re-encode. */
const SKY = "/horizon-poster-desktop.webp";

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:"Libre Bodoni";font-style:normal;font-weight:400 700;src:url("http://og.local/fonts/libre-bodoni-latin-var.woff2") format("woff2")}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:400;src:url("http://og.local/fonts/ibm-plex-mono-400-latin.woff2") format("woff2")}
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px;background:${ground};color:${ink}}
.card{position:relative;width:1200px;height:630px;overflow:hidden}
/* The singularity sits low-centre in the void; the top stays open for type. */
.sky{position:absolute;inset:0;background:url("${SKY}") no-repeat;background-size:auto 128%;background-position:25% 55%}
.type{position:absolute;inset:0;padding:56px 64px;display:flex;flex-direction:column}
.eyebrow{font-family:"IBM Plex Mono",monospace;font-size:17px;letter-spacing:.06em;color:${signal}}
h1{font-family:"Libre Bodoni",serif;font-size:76px;font-weight:500;line-height:.92;letter-spacing:-.01em;margin-top:22px;color:${ink};white-space:nowrap}
.foot{font-family:"IBM Plex Mono",monospace;font-size:15px;line-height:1.45;color:${inkMuted};margin-top:auto}
</style></head><body><div class="card">
<div class="sky"></div>
<div class="type">
<div class="eyebrow">${escape(lawName)} / 2026</div>
<h1>${escape(name)}</h1>
<div class="foot">${escape(provenance)}<br>nathwn12.github.io</div>
</div>
</div></body></html>`;

const filename = `og-image-2026-11-21-singularity.png`;
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
    } else if (path === SKY) {
      await route.fulfill({
        status: 200,
        body: readFileSync(join(root, "public", SKY)),
        contentType: "image/webp",
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
