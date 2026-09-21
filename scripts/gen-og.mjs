// One-off OG-image rasterizer: inline SVG (1200x630 brutalist ink card) →
// sharp → public/og-image.png. The card is flat dark ink paper — ink ground
// (#0e0e0d) with paper text (#f2f2ef), a single 2px paper rule at the top, one
// accent line, no window chrome: no titlebar, no traffic-light dots, no rounded
// corners, no grid, no glow. Colors are the site's DARK theme tokens (see
// src/index.css `html[data-theme="dark"]` + DESIGN.md §1). Type is monospace,
// left-aligned on the same 80px margin as the shipped page. The PNG is
// committed, so CI/build never needs sharp — keep sharp OUT of the build pipeline.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="Consolas, 'Courier New', 'DejaVu Sans Mono', monospace">
  <!-- ink ground -->
  <rect width="1200" height="630" fill="#0e0e0d"/>
  <!-- the one structural rule: full-width 2px paper rule -->
  <rect x="0" y="0" width="1200" height="2" fill="#edede8"/>
  <!-- type -->
  <text x="80" y="96" font-size="24" font-weight="400" fill="#a3a39c">$ whoami</text>
  <text x="80" y="200" font-size="68" font-weight="700" fill="#f2f2ef">NATHANIEL</text>
  <text x="80" y="282" font-size="68" font-weight="700" fill="#f2f2ef">NIKOLAI LADERO</text>
  <text x="80" y="350" font-size="20" font-weight="400" letter-spacing="4" fill="#c9c9c3">BACKEND DEVELOPER — 3 YRS PRODUCTION FINTECH</text>
  <text x="80" y="420" font-size="24" font-weight="400" fill="#ff6a2b">status: OPEN TO WORK</text>
  <text x="1120" y="584" font-size="18" font-weight="400" text-anchor="end" fill="#a3a39c">nathwn12.github.io</text>
</svg>`;

const outFile = join(process.cwd(), "public", "og-image.png");

await mkdirSync(dirname(outFile), { recursive: true });
await sharp(Buffer.from(SVG)).png().toFile(outFile);

const meta = await sharp(outFile).metadata();
if (meta.width !== 1200 || meta.height !== 630) {
  throw new Error(
    `og-image.png rendered ${meta.width}x${meta.height}, expected 1200x630`,
  );
}
console.log(`OK: wrote ${resolve(outFile)} (${meta.width}x${meta.height})`);
