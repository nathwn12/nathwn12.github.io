/**
 * Local font integration — four files, three families, no remote request.
 *
 * The record is set in Instrument Serif (display), Archivo (text) and
 * JetBrains Mono (data), all self-hosted from `public/fonts` with their OFL 1.1
 * licences. Inter survives as the metric-matched body fallback: its average
 * advance is within ~2% of the adjusted local face that follows it, so the swap
 * from fallback to Archivo moves letterforms and not line breaks.
 *
 * The hash pins the owner-approved Inter asset, so a swap cannot slip in
 * unnoticed; `font-display: swap` is asserted because a blocking swap would move
 * the first paint; and the preload is asserted against the display cut, which is
 * the face the LCP line is set in.
 *
 * Every assertion below can go red.
 *
 *   bunx vitest run tests/fonts.test.ts
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");
const bytes = (rel: string) => readFileSync(resolve(root, rel));

const CSS = read("src/styles/fonts.css");
const TOKENS = read("src/styles/tokens.css");
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

  test("Inter is the fallback face, declared 400-700 behind Archivo", () => {
    const face = faceBlock("Inter");
    expect(face).toContain('url("/fonts/inter-latin.woff2") format("woff2")');
    expect(face).toContain("font-weight: 400 700");
    expect(face).toContain("font-display: swap");
    expect(face).toContain("unicode-range: U+0000-00FF");
    expect(face).toContain("U+FFFD");
    // The stack decides the role: Archivo first, Inter second, and the mono
    // slot never falls back to a proportional face.
    expect(TOKENS).toContain('--font-sans: "Archivo", "Inter"');
    expect(TOKENS).toContain('--font-mono: "JetBrains Mono"');
  });

  test("index.html preloads the one shipped display cut", () => {
    const preloads = [
      ...HTML.matchAll(/<link\b[^>]*\brel="preload"[^>]*>/gs),
    ]
      .filter((match) => /as="font"/.test(match[0]))
      .map((match) => match[0].match(/href="([^"]+)"/)?.[1]);
    expect(preloads).toEqual(["/fonts/InstrumentSerif-Regular.woff2"]);
  });

  test("the two byte-identical mono cuts ship as one file", () => {
    /* Google serves one variable slice for JetBrains Mono; committing it twice
       under two names cost a second request on the critical path. One file,
       declared 400 500. */
    expect(
      existsSync(resolve(root, "public/fonts/JetBrainsMono-Medium.woff2")),
    ).toBe(false);
    expect(CSS.match(/url\("\/fonts\/JetBrainsMono-Regular\.woff2"\)/g)).toHaveLength(
      1,
    );
    expect(faceBlock("JetBrains Mono")).toContain("font-weight: 400 500");
  });

  test("no retired face is still served or referenced", () => {
    for (const retired of ["fraunces", "public-sans", "newsreader", "opencode"]) {
      expect(CSS.toLowerCase()).not.toContain(retired);
      expect(HTML.toLowerCase()).not.toContain(retired);
    }
    for (const file of [
      "newsreader-latin.woff2",
      "OpenCode.otf",
      "JetBrainsMono-Medium.woff2",
    ]) {
      expect(existsSync(resolve(root, "public/fonts", file)), file).toBe(false);
    }
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

  test("the colophon credits the shipped families", () => {
    expect(read("src/components/Footer.tsx")).toContain(
      "Set in Instrument Serif, Archivo and JetBrains Mono.",
    );
  });
});
