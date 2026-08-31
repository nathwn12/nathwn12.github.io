// One-off OG-image rasterizer: inline SVG (1200x630 terminal card) → sharp →
// public/og-image.png. The PNG is committed, so CI/build never needs sharp —
// keep sharp OUT of the build pipeline.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="Courier New, monospace">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 H 0 V 40" fill="none" stroke="#8ae234" stroke-opacity="0.05"/>
    </pattern>
  </defs>
  <!-- card background -->
  <rect width="1200" height="630" fill="#300a24"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <!-- terminal window -->
  <rect x="100" y="80" width="1000" height="470" rx="12" fill="#26081c" stroke="#8ae234" stroke-opacity="0.35" stroke-width="2"/>
  <!-- titlebar -->
  <rect x="100" y="80" width="1000" height="54" fill="#3d0f2e"/>
  <rect x="100" y="125" width="1000" height="9" fill="#3d0f2e"/>
  <circle cx="136" cy="107" r="8" fill="#f57900"/>
  <circle cx="164" cy="107" r="8" fill="#729fcf"/>
  <circle cx="192" cy="107" r="8" fill="#8ae234"/>
  <text x="1070" y="116" text-anchor="end" font-size="22" fill="#8ae234">bash — nathan@portfolio</text>
  <!-- body -->
  <text x="140" y="210" font-size="30" fill="#8ae234" font-weight="bold">$ whoami</text>
  <text x="140" y="300" font-size="64" fill="#d3d7cf" font-weight="bold">NATHANIEL</text>
  <text x="140" y="382" font-size="64" fill="#8ae234" font-weight="bold">NIKOLAI LADERO</text>
  <text x="140" y="450" font-size="26" fill="#b0b7bd" letter-spacing="4">BACKEND DEVELOPER — 3 YRS PRODUCTION FINTECH</text>
  <text x="140" y="515" font-size="24" fill="#729fcf">status: OPEN TO WORK</text>
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