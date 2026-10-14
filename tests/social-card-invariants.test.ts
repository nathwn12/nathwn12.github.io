import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "..");
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function socialImageUrls(): string[] {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const urls: string[] = [];
  for (const match of html.matchAll(
    /<(?:meta\s+property="og:image"\s+content="([^"]+)"|meta\s+name="twitter:image"\s+content="([^"]+)")/g,
  )) {
    urls.push(match[1] ?? match[2]);
  }
  return urls;
}

describe("social card invariants", () => {
  test("index.html declares at least one social image", () => {
    expect(socialImageUrls().length).toBeGreaterThan(0);
  });  test.each(socialImageUrls())("social image %s resolves to a 1200x630 PNG under public/", (url) => {
    const file = resolve(root, "public", basename(new URL(url).pathname));
    expect(existsSync(file)).toBe(true);
    const bytes = readFileSync(file);
    expect(bytes.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    expect(bytes.readUInt32BE(16)).toBe(1200);
    expect(bytes.readUInt32BE(20)).toBe(630);
  });
});
