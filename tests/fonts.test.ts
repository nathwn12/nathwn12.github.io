/**
 * Local font integration — Newsreader, the one webfont the Ledger direction
 * uses. It is served from `public/fonts` as a latin WOFF2 with its official
 * OFL 1.1 licence; there is no remote font request and no package dependency.
 * The hash pins the owner-approved file, so a swap cannot slip in unnoticed.
 *
 * The Inter file remains on disk (the previous direction's body face) but is
 * not declared, not preloaded, and not requested: the Ledger has one face.
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

/** The approved 2026-10-24 asset, pinned by SHA-256. */
const ASSETS = {
  "public/fonts/newsreader-latin.woff2":
    "6e4f2958c3a7c4a80acde4e5a679abe7e01bc1e30b92be3c7a8b696ef401d101",
  "public/fonts/OFL-Newsreader.txt":
    "fdfad38143ec470553cae82a1e45320bdd1b9ec70415d37bd0171051d8a4ded8",
} as const;

function faceBlock(family: string): string {
  const pattern = new RegExp(
    `@font-face\\s*\\{[^}]*font-family:\\s*"${family}";[^}]*\\}`,
    "s",
  );
  const match = CSS.match(pattern);
  if (!match) throw new Error(`missing @font-face for ${family}`);
  return match[0];
}

describe("one local, licensed face", () => {
  test("the Newsreader WOFF2 ships at its approved hash", () => {
    for (const [path, hash] of Object.entries(ASSETS)) {
      const digest = createHash("sha256").update(bytes(path)).digest("hex");
      expect(digest, path).toBe(hash);
    }
    expect(
      bytes("public/fonts/newsreader-latin.woff2").toString("ascii", 0, 4),
    ).toBe("wOF2");
  });

  test("Newsreader is the one declared face, weight 300-700, font-display optional", () => {
    const face = faceBlock("Newsreader");
    expect(face).toContain('url("/fonts/newsreader-latin.woff2") format("woff2")');
    expect(face).toContain("font-weight: 300 700");
    expect(face).toContain("font-display: optional");
    expect(face).toContain("unicode-range: U+0000-00FF");
    expect(face).toContain("U+FFFD");
    expect(CSS).toContain('font-family: "Newsreader"');
    expect(CSS).toMatch(/body\s*\{[\s\S]*?font-family:\s*"Newsreader"/);
  });

  test("no second @font-face is declared or preloaded", () => {
    const faces = [...CSS.matchAll(/@font-face\s*\{[^}]*font-family:\s*"([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(faces).toEqual(["Newsreader"]);
    expect(CSS).not.toMatch(/@font-face\s*\{[^}]*font-family:\s*"Inter"/);
    expect(HTML).not.toContain("/fonts/inter-latin.woff2");
  });

  test("index.html preloads exactly the one shipped WOFF2", () => {
    const preloads = [
      ...HTML.matchAll(/<link rel="preload" as="font"[^>]*href="([^"]+)"/g),
    ].map((match) => match[1]);
    expect(preloads).toEqual(["/fonts/newsreader-latin.woff2"]);
  });

  test("the replaced faces are no longer served", () => {
    for (const face of ["fraunces", "public-sans"]) {
      expect(CSS).not.toMatch(new RegExp(`fonts/${face}`));
      expect(HTML).not.toMatch(new RegExp(face));
    }
  });

  test("no remote font request anywhere in the shipped sources", () => {
    for (const source of [CSS, HTML]) {
      expect(source).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    }
  });

  test("the OFL 1.1 licence ships with the font", () => {
    const licence = read("public/fonts/OFL-Newsreader.txt");
    expect(licence).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(licence).toContain("The Newsreader Project Authors");
  });
});
