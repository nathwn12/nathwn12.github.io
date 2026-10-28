/**
 * Contrast floor — every muted and body pair the Ledger emits.
 *
 * The direction note claimed "6:1" for the muted colour. Measured, the
 * green-field soft token is 6.06:1 and the paper-field muted token is 5.84:1 on
 * paper and 5.25:1 on the one-tone step. All clear 4.5:1, so no darkening was
 * required; this test keeps them there. `--muted` on green is 2.72:1 and is
 * never emitted — the green field's soft token is `--green-muted`, asserted
 * structurally below.
 *
 *   pnpm vitest run tests/contrast.test.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "..");
const css = readFileSync(resolve(root, "src", "index.css"), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`missing token --${name}`);
  return match[1];
}

function luminance(hex: string): number {
  const channels = hex
    .replace("#", "")
    .match(/../g)!
    .map((pair) => parseInt(pair, 16) / 255)
    .map((channel) =>
      channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
}

function ratio(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (light + 0.05) / (dark + 0.05);
}

const PAPER = token("paper");
const PAPER_2 = token("paper-2");
const INK = token("ink");
const MUTED = token("muted");
const GREEN = token("green");
const GREEN_INK = token("green-ink");
const GREEN_MUTED = token("green-muted");
const DARK = token("dark");
const DARK_2 = token("dark-2");
const DARK_INK = token("dark-ink");
const DARK_MUTED = token("dark-muted");
const MARK = token("mark");

const BODY_PAIRS: ReadonlyArray<[string, string, string]> = [
  ["muted on paper", MUTED, PAPER],
  ["muted on paper-2", MUTED, PAPER_2],
  ["green-muted on green", GREEN_MUTED, GREEN],
  ["dark-muted on dark", DARK_MUTED, DARK],
  ["dark-muted on dark-2 (ledger hover)", DARK_MUTED, DARK_2],
  ["ink on paper", INK, PAPER],
  ["ink on paper-2", INK, PAPER_2],
  ["green-ink on green", GREEN_INK, GREEN],
  ["dark-ink on dark", DARK_INK, DARK],
  ["dark-ink on dark-2", DARK_INK, DARK_2],
  ["paper on green (contact hover)", PAPER, GREEN],
];

const UI_PAIRS: ReadonlyArray<[string, string, string]> = [
  ["green focus on paper", GREEN, PAPER],
  ["green focus on paper-2", GREEN, PAPER_2],
  ["green-ink focus on green", GREEN_INK, GREEN],
  ["mark focus on dark", MARK, DARK],
  ["ink rule on paper", INK, PAPER],
  ["paper on green", PAPER, GREEN],
];

describe("field palette", () => {
  test("names the approved tokens", () => {
    expect(PAPER.toLowerCase()).toBe("#eaebe3");
    expect(PAPER_2.toLowerCase()).toBe("#dee0d6");
    expect(INK.toLowerCase()).toBe("#13160f");
    expect(MUTED.toLowerCase()).toBe("#565b4c");
    expect(GREEN.toLowerCase()).toBe("#1d4b33");
    expect(GREEN_INK.toLowerCase()).toBe("#f1f3ec");
    expect(GREEN_MUTED.toLowerCase()).toBe("#c3cdbb");
    expect(DARK.toLowerCase()).toBe("#13160f");
    expect(DARK_INK.toLowerCase()).toBe("#edefe8");
    expect(DARK_MUTED.toLowerCase()).toBe("#a6ab99");
    expect(MARK.toLowerCase()).toBe("#8fbe9f");
  });

  test.each(BODY_PAIRS)("%s clears 4.5:1", (_name, foreground, background) => {
    expect(ratio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  test.each(UI_PAIRS)("%s clears 3:1", (_name, foreground, background) => {
    expect(ratio(foreground, background)).toBeGreaterThanOrEqual(3);
  });

  test("the green field's soft text is the green-muted token, never the paper muted", () => {
    const greenBlock = css.match(/\.field-green\s*\{[^}]*\}/);
    expect(greenBlock?.[0]).toContain("--soft: var(--green-muted)");
    expect(greenBlock?.[0]).not.toContain("--soft: var(--muted)");
    // Documented non-pair: the paper muted token is unreadable on green.
    expect(ratio(MUTED, GREEN)).toBeLessThan(4.5);
  });
});
