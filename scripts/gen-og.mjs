// Social-card rasterizer: inline SVG (1200x630) → sharp → committed PNGs in
// public/.
//
// Two cards, one per palette:
//
//   og-image-2026-10.png     the light card, kept as the October card.
//   og-image-2026-11-13.png  the current dark card. The date in the filename is
//                            the cache-buster: a crawler that already fetched
//                            an older card is pointed at a new URL, not at the
//                            same URL with new pixels.
//
// The dark card reads its colours from `src/styles/tokens.css` `:root`, so it
// cannot drift from the site: change a token and re-run this script. It uses
// the same role split the page does — ground, ink, muted ink, the raised
// surface the scale track sits on, the measure colour for the figure and the
// signal colour for the exit.
//
// The PNGs are committed, so CI/build never needs sharp: keep sharp OUT of the
// build pipeline.
import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const css = readFileSync(
  new URL("../src/styles/tokens.css", import.meta.url),
  "utf8",
);

/** Hex colour tokens from the dark theme block, keyed by their custom property. */
function darkTokens() {
  const block = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1];
  if (!block) {
    throw new Error("src/styles/tokens.css has no :root block");
  }
  const found = {};
  for (const match of block.matchAll(/(--rec-[a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)) {
    found[match[1]] = match[2].toLowerCase();
  }
  return found;
}

const dark = darkTokens();
for (const token of [
  "--rec-ground",
  "--rec-ink",
  "--rec-ink-muted",
  "--rec-measure",
  "--rec-panel-2",
  "--rec-signal",
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

/* The dark card: the identity line, the stack, and the one figure that carries
   the record — the worst-case payment query after the provider change. The bar
   encodes the same 60:1 comparison the cover's panel does: the accent sliver
   against a 60-second track. Colours come from tokens.css, so a palette edit
   flows into the card on the next run. */
const DARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif">
  <rect width="1200" height="630" fill="${dark["--rec-ground"]}"/>
  <rect x="80" y="64" width="1040" height="4" fill="${dark["--rec-ink"]}"/>

  <text x="80" y="142" font-size="22" font-weight="400" fill="${dark["--rec-ink-muted"]}">Nathaniel Nikolai Ladero</text>

  <text x="80" y="250" font-size="56" font-weight="700" letter-spacing="-2" fill="${dark["--rec-ink"]}">Software developer.</text>
  <text x="80" y="316" font-size="56" font-weight="700" letter-spacing="-2" fill="${dark["--rec-ink"]}">C# and .NET,</text>
  <text x="80" y="382" font-size="56" font-weight="700" letter-spacing="-2" fill="${dark["--rec-ink"]}">in production since 2023.</text>

  <text x="80" y="424" font-size="19" font-weight="400" fill="${dark["--rec-ink-muted"]}">Payment, cash-management and access-control systems — and thirteen open-source tools.</text>

  <rect x="80" y="452" width="1040" height="18" fill="${dark["--rec-panel-2"]}"/>
  <rect x="80" y="452" width="17" height="18" fill="${dark["--rec-measure"]}"/>

  <text x="80" y="494" font-size="15" font-weight="400" fill="${dark["--rec-ink-muted"]}">0 s</text>
  <text x="1120" y="494" font-size="15" font-weight="400" text-anchor="end" fill="${dark["--rec-ink-muted"]}">60 s</text>

  <text x="80" y="536" font-size="20" font-weight="400" fill="${dark["--rec-ink-muted"]}">Worst-case payment query, after the provider change</text>
  <text x="1120" y="544" font-size="42" font-weight="700" text-anchor="end" fill="${dark["--rec-measure"]}">&lt;1 s</text>

  <text x="80" y="592" font-size="18" font-weight="400" fill="${dark["--rec-ink-muted"]}">nathwn12.github.io</text>
  <text x="1120" y="592" font-size="18" font-weight="600" text-anchor="end" fill="${dark["--rec-signal"]}">Email me</text>
</svg>`;

const cards = [
  ["og-image-2026-11-13.png", DARK_SVG],
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
