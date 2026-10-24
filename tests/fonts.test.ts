/**
 * Local font integration — Newsreader (display) + Inter (body).
 *
 * Every face is served from `public/fonts` as a latin WOFF2 with its official
 * OFL 1.1 licence; there is no remote font request and no package dependency.
 * The hashes pin the owner-approved staged files, so a swap cannot slip in
 * unnoticed. Every assertion below can go red.
 *
 *   pnpm vitest run tests/fonts.test.ts
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");
const bytes = (rel: string) => readFileSync(resolve(root, rel));

const CSS = read("src/index.css");
const HTML = read("index.html");

/** The staged 2026-10-24 assets, pinned by SHA-256. */
const ASSETS = {
  "public/fonts/newsreader-latin.woff2":
    "6e4f2958c3a7c4a80acde4e5a679abe7e01bc1e30b92be3c7a8b696ef401d101",
  "public/fonts/inter-latin.woff2":
    "3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62",
  "public/fonts/OFL-Newsreader.txt":
    "fdfad38143ec470553cae82a1e45320bdd1b9ec70415d37bd0171051d8a4ded8",
  "public/fonts/OFL-Inter.txt":
    "5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57",
} as const;

/** One `@font-face` block, by family name. */
function faceBlock(family: string): string {
  const pattern = new RegExp(
    `@font-face\\s*\\{[^}]*font-family:\\s*"${family}";[^}]*\\}`,
    "s",
  );
  const match = CSS.match(pattern);
  if (!match) throw new Error(`missing @font-face for ${family}`);
  return match[0];
}

describe("fonts are local, licensed, and correctly declared", () => {
  test("both latin WOFF2s ship at their approved hashes", () => {
    for (const [path, hash] of Object.entries(ASSETS)) {
      const digest = createHash("sha256").update(bytes(path)).digest("hex");
      expect(digest, path).toBe(hash);
    }
    expect(bytes("public/fonts/newsreader-latin.woff2").toString("ascii", 0, 4)).toBe("wOF2");
    expect(bytes("public/fonts/inter-latin.woff2").toString("ascii", 0, 4)).toBe("wOF2");
  });

  test("Newsreader is the display face at weight 300-700 with optical sizing", () => {
    const face = faceBlock("Newsreader");
    expect(face).toContain('url("/fonts/newsreader-latin.woff2") format("woff2")');
    expect(face).toContain("font-weight: 300 700");
    expect(face).toContain("font-display: swap");
    expect(face).toContain("unicode-range: U+0000-00FF");
    expect(face).toContain("U+FFFD");
    expect(CSS).toContain('--font-display: "Newsreader"');
  });

  test("Inter is the body face at weight 400-700", () => {
    const face = faceBlock("Inter");
    expect(face).toContain('url("/fonts/inter-latin.woff2") format("woff2")');
    expect(face).toContain("font-weight: 400 700");
    expect(face).toContain("font-display: swap");
    expect(face).toContain("unicode-range: U+0000-00FF");
    expect(CSS).toContain('--font-sans:\n    "Inter"');
    // The mono slot stays an alias of the body face — never a third family.
    expect(CSS).toContain('--font-mono: "Inter"');
  });

  test("index.html preloads exactly the two shipped WOFF2s", () => {
    const preloads = [
      ...HTML.matchAll(/<link rel="preload" as="font"[^>]*href="([^"]+)"/g),
    ].map((match) => match[1]);
    expect(preloads).toEqual([
      "/fonts/newsreader-latin.woff2",
      "/fonts/inter-latin.woff2",
    ]);
  });

  test("the replaced faces are no longer served", () => {
    expect(CSS).not.toMatch(/fonts\/fraunces/);
    expect(CSS).not.toMatch(/fonts\/public-sans/);
    expect(CSS).not.toContain('font-family: "Fraunces"');
    expect(CSS).not.toContain('font-family: "Public Sans"');
    expect(HTML).not.toMatch(/fraunces|public-sans/);
  });

  test("no remote font request anywhere in the shipped sources", () => {
    for (const source of [CSS, HTML]) {
      expect(source).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    }
  });

  test("both OFL 1.1 licence files ship with the fonts", () => {
    const inter = read("public/fonts/OFL-Inter.txt");
    const newsreader = read("public/fonts/OFL-Newsreader.txt");
    for (const licence of [inter, newsreader]) {
      expect(licence).toContain("SIL OPEN FONT LICENSE Version 1.1");
    }
    expect(inter).toContain("The Inter Project Authors");
    expect(newsreader).toContain("The Newsreader Project Authors");
  });

  test("the colophon credits the two shipped families", () => {
    expect(read("src/components/PageFoot.tsx")).toContain(
      "Set in Newsreader and\n        Inter.",
    );
  });
});
