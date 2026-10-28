/**
 * Local font integration — Inter, one family, one file.
 *
 * The redesign retired Newsreader: the record is set in a single grotesque and
 * spends the 132 kB the second face cost on nothing at all. Inter ships from
 * `public/fonts` as a latin WOFF2 with its official OFL 1.1 licence; there is no
 * remote font request and no package dependency. The hash pins the owner-
 * approved staged file, so a swap cannot slip in unnoticed, and `font-display:
 * swap` is asserted because a blocking swap would move the first paint.
 *
 * Every assertion below can go red.
 *
 *   pnpm vitest run tests/fonts.test.ts
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");
const bytes = (rel: string) => readFileSync(resolve(root, rel));

const CSS = read("src/index.css");
const HTML = read("index.html");

/** The staged 2026-10-24 asset, pinned by SHA-256. */
const INTER_HASH =
  "3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62";

function faceBlock(family: string): string {
  const pattern = new RegExp(
    `@font-face\\s*\\{[^}]*font-family:\\s*"${family}";[^}]*\\}`,
    "s",
  );
  const match = CSS.match(pattern);
  if (!match) throw new Error(`missing @font-face for ${family}`);
  return match[0];
}

describe("the font is local, licensed, and correctly declared", () => {
  test("the latin WOFF2 ships at its approved hash", () => {
    const digest = createHash("sha256")
      .update(bytes("public/fonts/inter-latin.woff2"))
      .digest("hex");
    expect(digest).toBe(INTER_HASH);
    expect(
      bytes("public/fonts/inter-latin.woff2").toString("ascii", 0, 4),
    ).toBe("wOF2");
  });

  test("Inter sets both display and text at weight 400-700", () => {
    const face = faceBlock("Inter");
    expect(face).toContain('url("/fonts/inter-latin.woff2") format("woff2")');
    expect(face).toContain("font-weight: 400 700");
    expect(face).toContain("font-display: swap");
    expect(face).toContain("unicode-range: U+0000-00FF");
    expect(face).toContain("U+FFFD");
    expect(CSS).toContain('--font-sans: "Inter"');
    expect(CSS).toContain('--font-display: "Inter"');
    // The mono slot stays an alias of the body face — never a second family.
    expect(CSS).toContain('--font-mono: "Inter"');
  });

  test("index.html preloads the one shipped WOFF2", () => {
    const preloads = [
      ...HTML.matchAll(/<link rel="preload" as="font"[^>]*href="([^"]+)"/g),
    ].map((match) => match[1]);
    expect(preloads).toEqual(["/fonts/inter-latin.woff2"]);
  });

  test("no retired face is still served or referenced", () => {
    for (const retired of ["fraunces", "public-sans", "newsreader"]) {
      expect(CSS.toLowerCase()).not.toContain(retired);
      expect(HTML.toLowerCase()).not.toContain(retired);
    }
    expect(
      existsSync(resolve(root, "public/fonts/newsreader-latin.woff2")),
    ).toBe(false);
  });

  test("no remote font request anywhere in the shipped sources", () => {
    for (const source of [CSS, HTML]) {
      expect(source).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    }
  });

  test("the OFL 1.1 licence ships with the font", () => {
    const licence = read("public/fonts/OFL-Inter.txt");
    expect(licence).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(licence).toContain("The Inter Project Authors");
  });

  test("the colophon credits the shipped family", () => {
    expect(read("src/components/Footer.tsx")).toContain("Set in Inter.");
  });
});
