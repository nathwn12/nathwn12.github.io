// Social-card rasterizer: inline SVG (1200x630) → sharp → committed PNGs in
// public/.
//
// Two cards, one per palette:
//
//   og-image-2026-10.png     the light card, kept as the October card.
//   og-image-2026-10-28.png  the current dark card. The date in the filename is
//                            the cache-buster: a crawler that already fetched
//                            the October card is pointed at a new URL, not at
//                            the same URL with new pixels.
//
// The dark card reads its colours from src/index.css `html[data-theme="dark"]`,
// so it cannot drift from the site: change a token and re-run this script. The
// values are the real dark ground (#101315), ink (#ecebe5), muted (#a3a7a8),
// petrol accent (#8ee6d8) and the raised surface the scale track sits on
// (#23282b). Flat colour, no gradient, no shadow, square corners.
//
// The PNGs are committed, so CI/build never needs sharp: keep sharp OUT of the
// build pipeline.
import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const css = readFileSync(
  new URL("../src/index.css", import.meta.url),
  "utf8",
);

/** Hex colour tokens from the dark theme block, keyed by their custom property. */
function darkTokens() {
  const block = css.match(/html\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/)?.[1];
  if (!block) {
    throw new Error('src/index.css has no html[data-theme="dark"] block');
  }
  const found = {};
  for (const match of block.matchAll(/(--color-[a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)) {
    found[match[1]] = match[2].toLowerCase();
  }
  return found;
}

const dark = darkTokens();
for (const token of [
  "--color-bg",
  "--color-text",
  "--color-text-muted",
  "--color-accent",
  "--color-surface-2",
]) {
  if (!dark[token]) throw new Error(`the dark theme does not define ${token}`);
}

/* The light October card. Its geometry and colours are frozen: the card is
   already published, and this script must reproduce the committed file. */
const LIGHT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif">
  <rect width="1200" height="630" fill="#f2f1ec"/>
  <rect x="80" y="64" width="1040" height="4" fill="#16181a"/>

  <text x="80" y="150" font-size="22" font-weight="400" fill="#4f5457">Nathaniel Nikolai Ladero</text>

  <text x="80" y="268" font-size="76" font-weight="700" letter-spacing="-3" fill="#16181a">Backend developer</text>
  <text x="80" y="348" font-size="76" font-weight="700" letter-spacing="-3" fill="#16181a">for payment systems</text>

  <text x="80" y="404" font-size="24" font-weight="400" fill="#4f5457">Formerly at Xentra Infotech Solutions Inc. · March 2023 to May 2026</text>

  <rect x="80" y="466" width="1040" height="22" fill="#c9c7bd"/>
  <rect x="80" y="466" width="17" height="22" fill="#0a5c60"/>

  <text x="80" y="524" font-size="20" font-weight="400" fill="#4f5457">Worst-case payment query, before and after the provider change</text>
  <text x="1120" y="530" font-size="34" font-weight="700" text-anchor="end" fill="#16181a">98% faster</text>

  <text x="80" y="592" font-size="18" font-weight="400" fill="#4f5457">nathwn12.github.io</text>
  <text x="1120" y="592" font-size="18" font-weight="600" text-anchor="end" fill="#0a5c60">Email me</text>
</svg>`;

/* The dark card: the full name, the approved claim, and the one figure that
   carries the record — the worst-case payment query after the provider change.
   The bar encodes the same 60:1 comparison the first screen's panel does: the
   accent sliver against a 60-second track. */
const DARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif">
  <rect width="1200" height="630" fill="${dark["--color-bg"]}"/>
  <rect x="80" y="64" width="1040" height="4" fill="${dark["--color-text"]}"/>

  <text x="80" y="142" font-size="22" font-weight="400" fill="${dark["--color-text-muted"]}">Nathaniel Nikolai Ladero</text>

  <text x="80" y="250" font-size="52" font-weight="700" letter-spacing="-2" fill="${dark["--color-text"]}">Backend developer for</text>
  <text x="80" y="312" font-size="52" font-weight="700" letter-spacing="-2" fill="${dark["--color-text"]}">payment and cash-management</text>
  <text x="80" y="374" font-size="52" font-weight="700" letter-spacing="-2" fill="${dark["--color-text"]}">systems that ran in production</text>

  <text x="80" y="414" font-size="19" font-weight="400" fill="${dark["--color-text-muted"]}">…and the author of eleven open-source developer tools.</text>

  <rect x="80" y="446" width="1040" height="18" fill="${dark["--color-surface-2"]}"/>
  <rect x="80" y="446" width="17" height="18" fill="${dark["--color-accent"]}"/>

  <text x="80" y="488" font-size="15" font-weight="400" fill="${dark["--color-text-muted"]}">0 s</text>
  <text x="1120" y="488" font-size="15" font-weight="400" text-anchor="end" fill="${dark["--color-text-muted"]}">60 s</text>

  <text x="80" y="530" font-size="20" font-weight="400" fill="${dark["--color-text-muted"]}">Worst-case payment query, after the provider change</text>
  <text x="1120" y="538" font-size="42" font-weight="700" text-anchor="end" fill="${dark["--color-accent"]}">&lt;1 s</text>

  <text x="80" y="592" font-size="18" font-weight="400" fill="${dark["--color-text-muted"]}">nathwn12.github.io</text>
  <text x="1120" y="592" font-size="18" font-weight="600" text-anchor="end" fill="${dark["--color-accent"]}">Email me</text>
</svg>`;

const cards = [
  ["og-image-2026-10.png", LIGHT_SVG],
  ["og-image-2026-10-28.png", DARK_SVG],
];

for (const [name, svg] of cards) {
  const outFile = join(process.cwd(), "public", name);
  mkdirSync(dirname(outFile), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(outFile);

  const meta = await sharp(outFile).metadata();
  if (meta.width !== 1200 || meta.height !== 630) {
    throw new Error(
      `${name} rendered ${meta.width}x${meta.height}, expected 1200x630`,
    );
  }
  console.log(`OK: wrote ${resolve(outFile)} (${meta.width}x${meta.height})`);
}
