// One-off social-card rasterizer for the Ledger direction: inline SVG →
// sharp → public/og-image-2026-10.png. Flat ledgers green field, bone type,
// no chrome, no gradient, no photograph. The PNG is committed, so CI/build
// never needs sharp — keep sharp OUT of the build pipeline.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="Georgia, 'DejaVu Serif', 'Times New Roman', serif">
  <rect width="1200" height="630" fill="#1D4B33"/>
  <text x="72" y="92" font-size="24" font-weight="500" fill="#F1F3EC">nathwn12</text>
  <text x="72" y="248" font-size="104" letter-spacing="-4" fill="#F1F3EC">Nathaniel Nikolai</text>
  <text x="72" y="358" font-size="104" letter-spacing="-4" fill="#F1F3EC">Ladero</text>
  <text x="72" y="452" font-size="30" fill="#F1F3EC">Payment backends that hold up</text>
  <text x="72" y="492" font-size="30" fill="#F1F3EC">under production load.</text>
  <text x="72" y="576" font-size="24" fill="#C3CDBB">Open to backend roles.</text>
  <text x="1128" y="576" font-size="22" text-anchor="end" fill="#C3CDBB">nathwn12.github.io</text>
</svg>`;

const outFile = join(process.cwd(), "public", "og-image-2026-10.png");

await mkdirSync(dirname(outFile), { recursive: true });
await sharp(Buffer.from(SVG)).png().toFile(outFile);

const meta = await sharp(outFile).metadata();
if (meta.width !== 1200 || meta.height !== 630) {
  throw new Error(
    `og-image rendered ${meta.width}x${meta.height}, expected 1200x630`,
  );
}
console.log(`OK: wrote ${resolve(outFile)} (${meta.width}x${meta.height})`);
