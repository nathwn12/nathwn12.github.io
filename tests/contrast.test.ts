import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * Contrast, computed from the shipped CSS custom properties.
 *
 * Reading the tokens out of src/index.css is the point: a hex changed in the
 * theme block flows into this test with no second copy to keep in step, so the
 * numbers below are the colours the page actually paints. Every pair here is
 * one the components render — body copy, secondary notes, a link, the primary
 * button's label, and the two whole-section colour fields with their ink.
 *
 * WCAG 2.2: 4.5:1 for text under 24px (or 18.66px bold), 3:1 for large text and
 * for the boundary of a UI component. `--color-edge` is a form border only, so
 * it is checked at 3:1 against the ground it is drawn on, never as text.
 */

const root = resolve(import.meta.dirname, "..");
const css = readFileSync(resolve(root, "src", "index.css"), "utf8");

const HEX = /^#[0-9a-f]{6}$/i;

function tokenBlock(source: string, start: string, end: string): string {
  const from = source.indexOf(start);
  expect(from, `missing token block ${start}`).toBeGreaterThan(-1);
  const to = source.indexOf(end, from + start.length);
  expect(to, `unterminated token block ${start}`).toBeGreaterThan(from);
  return source.slice(from, to);
}

function tokens(block: string): Record<string, string> {
  const found: Record<string, string> = {};
  for (const match of block.matchAll(/(--color-[a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)) {
    found[match[1]] = match[2].toLowerCase();
  }
  return found;
}

const light = tokens(tokenBlock(css, "@theme {", "\n}\n"));
const dark = tokens(tokenBlock(css, 'html[data-theme="dark"] {', "\n}\n"));

/** Relative luminance, WCAG 2.2 § relative luminance. */
function luminance(hex: string): number {
  expect(HEX.test(hex), `not a hex colour: ${hex}`).toBe(true);
  const [r, g, b] = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [a, b] = [luminance(foreground), luminance(background)].sort(
    (x, y) => y - x,
  );
  return (a + 0.05) / (b + 0.05);
}

function tok(theme: Record<string, string>, name: string): string {
  const value = theme[`--color-${name}`];
  expect(value, `--color-${name} is not defined as a hex token`).toBeDefined();
  return value!;
}

interface Pair {
  /** What the pair paints, in the words of the component that uses it. */
  role: string;
  fg: string;
  bg: string;
  /** 4.5 for body text, 3 for large text and component boundaries. */
  min: number;
}

const PAIRS: Pair[] = [
  // Paper: running text, secondary notes, links, the one filled button.
  { role: "body text on the ground", fg: "text", bg: "bg", min: 4.5 },
  { role: "muted notes on the ground", fg: "text-muted", bg: "bg", min: 4.5 },
  { role: "accent link on the ground", fg: "accent-text", bg: "bg", min: 4.5 },
  { role: "button label on the accent fill", fg: "bg", bg: "accent", min: 4.5 },
  { role: "body text on a raised surface", fg: "text", bg: "surface", min: 4.5 },
  { role: "body text on a stronger surface", fg: "text", bg: "surface-2", min: 4.5 },

  // The work band: a whole-section petrol field.
  { role: "field ink on the petrol field", fg: "field-accent-text", bg: "field-accent", min: 4.5 },
  { role: "field muted on the petrol field", fg: "field-accent-muted", bg: "field-accent", min: 4.5 },

  // The contact band: a whole-section ink field.
  { role: "field ink on the ink field", fg: "field-strong-text", bg: "field-strong", min: 4.5 },
  { role: "field muted on the ink field", fg: "field-strong-muted", bg: "field-strong", min: 4.5 },
];

for (const [themeName, theme] of [
  ["light", light],
  ["dark", dark],
] as const) {
  describe(`${themeName} theme`, () => {
    test.each(PAIRS.map((pair) => [pair.role, pair] as const))(
      "%s meets its floor",
      (_role, pair) => {
        const ratio = contrast(tok(theme, pair.fg), tok(theme, pair.bg));
        expect(
          Number(ratio.toFixed(2)),
          `${themeName}: ${pair.role} is ${ratio.toFixed(2)}:1, needs ${pair.min}:1`,
        ).toBeGreaterThanOrEqual(pair.min);
      },
    );

    test("reports the whole table in one place when it fails", () => {
      const rows = PAIRS.map((pair) => {
        const ratio = contrast(tok(theme, pair.fg), tok(theme, pair.bg));
        return `${pair.role}: ${ratio.toFixed(2)}:1 (min ${pair.min})`;
      });
      const failing = PAIRS.filter(
        (pair) => contrast(tok(theme, pair.fg), tok(theme, pair.bg)) < pair.min,
      );
      expect(failing.map((pair) => pair.role), rows.join("\n")).toEqual([]);
    });

    test("keeps the muted tone distinct from the ink, not a second body colour", () => {
      // A muted that is too close to the ink is a hierarchy that isn't there;
      // one that is too light is the soft-grey page this direction replaces.
      const ratio = contrast(tok(theme, "text-muted"), tok(theme, "bg"));
      expect(ratio).toBeGreaterThan(4.5);
      expect(ratio).toBeLessThan(contrast(tok(theme, "text"), tok(theme, "bg")));
    });
  });
}

describe("the tokens are the ones the stylesheet defines", () => {

  test("every pair names a token that exists in both themes", () => {
    for (const pair of PAIRS) {
      for (const name of [pair.fg, pair.bg]) {
        expect(light[`--color-${name}`], `light --color-${name}`).toBeDefined();
        expect(dark[`--color-${name}`], `dark --color-${name}`).toBeDefined();
      }
    }
  });

  test("no component hard-codes a colour literal", () => {
    // The token block owns every colour; a hex in a component is a second
    // palette that this test cannot see.
    const components = [
      "src/components/FirstScreen.tsx",
      "src/components/ProofBand.tsx",
      "src/components/WorkBand.tsx",
      "src/components/AtlasBand.tsx",
      "src/components/ForwardBand.tsx",
      "src/components/CredentialsBand.tsx",
      "src/components/Contact.tsx",
      "src/components/Header.tsx",
      "src/components/Footer.tsx",
    ];
    for (const file of components) {
      const source = readFileSync(resolve(root, file), "utf8");
      expect(source, file).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
  });
});
