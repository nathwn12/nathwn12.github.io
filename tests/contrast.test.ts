import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * Contrast, computed from the shipped CSS custom properties.
 *
 * Reading the tokens out of `src/styles/tokens.css` is the point: a hex changed
 * in the palette flows into this test with no second copy to keep in step, so
 * the numbers below are the colours the page actually paints. There is one
 * theme — the record is an instrument panel — so every pair is checked once.
 *
 * The pairs are the ones the components render: body copy and secondary notes on
 * the ground and on an inset surface, the link colour, the measured numerals, the
 * one alarm colour (set as 12px mono text on `/projects`), the label on the
 * cover's filled action, and the muted tone's distance from the ink.
 *
 * WCAG 2.2: 4.5:1 for text under 24px (or 18.66px bold), 3:1 for large text.
 * The floors above 4.5 are the recorder's own: this direction sets type small
 * and dark, so the palette has to clear the AA floor with room to spare.
 */

const root = resolve(import.meta.dirname, "..");
const css = readFileSync(resolve(root, "src", "styles", "tokens.css"), "utf8");

const HEX = /^#[0-9a-f]{6}$/i;

/** Every `--rec-*: #hex` pair in the :root block, lowercased. */
function palette(source: string): Record<string, string> {
  const from = source.indexOf(":root {");
  expect(from, "tokens.css has no :root block").toBeGreaterThan(-1);
  const to = source.indexOf("\n}", from);
  expect(to, "the :root block is unterminated").toBeGreaterThan(from);
  const found: Record<string, string> = {};
  for (const match of source
    .slice(from, to)
    .matchAll(/(--rec-[a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)) {
    found[match[1]] = match[2].toLowerCase();
  }
  return found;
}

const REC = palette(css);

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

function tok(name: string): string {
  const value = REC[`--rec-${name}`];
  expect(value, `--rec-${name} is not defined as a hex token`).toBeDefined();
  return value!;
}

interface Pair {
  /** What the pair paints, in the words of the component that uses it. */
  role: string;
  fg: string;
  bg: string;
  /** 4.5 for body text, higher where the palette promises more. */
  min: number;
}

const PAIRS: Pair[] = [
  // The ground: running copy, secondary notes, links, measured numerals.
  { role: "body text on the ground", fg: "ink", bg: "ground", min: 13 },
  { role: "muted notes on the ground", fg: "ink-muted", bg: "ground", min: 5.2 },
  { role: "signal link on the ground", fg: "signal", bg: "ground", min: 6 },
  { role: "measured numerals on the ground", fg: "measure", bg: "ground", min: 9 },
  { role: "the alarm date on the ground", fg: "alarm", bg: "ground", min: 4.5 },

  // The cover's filled action: ground-coloured label on the signal fill.
  { role: "the action label on the signal fill", fg: "ground", bg: "signal", min: 4.5 },

  // Inset surfaces: the instrument panel and a hovered row.
  { role: "body text on the instrument panel", fg: "ink", bg: "panel", min: 13 },
  { role: "muted notes on the instrument panel", fg: "ink-muted", bg: "panel", min: 5.2 },
  { role: "the reduction readout on the panel", fg: "measure", bg: "panel", min: 9 },
  { role: "body text on a hovered row", fg: "ink", bg: "panel-2", min: 13 },
];

describe("every painted pair clears its floor", () => {
  test.each(PAIRS.map((pair) => [pair.role, pair] as const))(
    "%s",
    (_role, pair) => {
      const ratio = contrast(tok(pair.fg), tok(pair.bg));
      expect(
        Number(ratio.toFixed(2)),
        `${pair.role} is ${ratio.toFixed(2)}:1, needs ${pair.min}:1`,
      ).toBeGreaterThanOrEqual(pair.min);
    },
  );

  test("reports the whole table in one place when it fails", () => {
    const rows = PAIRS.map(
      (pair) =>
        `${pair.role}: ${contrast(tok(pair.fg), tok(pair.bg)).toFixed(2)}:1 (min ${pair.min})`,
    );
    const failing = PAIRS.filter(
      (pair) => contrast(tok(pair.fg), tok(pair.bg)) < pair.min,
    );
    expect(failing.map((pair) => pair.role), rows.join("\n")).toEqual([]);
  });

  test("keeps the muted tone distinct from the ink, not a second body colour", () => {
    // A muted that is too close to the ink is a hierarchy that isn't there;
    // one that is too light is the soft-grey page this direction replaces.
    const ratio = contrast(tok("ink-muted"), tok("ground"));
    expect(ratio).toBeGreaterThan(4.5);
    expect(ratio).toBeLessThan(contrast(tok("ink"), tok("ground")));
  });
});

describe("the tokens are the ones the stylesheet defines", () => {
  test("every pair names a token that exists", () => {
    for (const pair of PAIRS) {
      for (const name of [pair.fg, pair.bg]) {
        expect(REC[`--rec-${name}`], `--rec-${name}`).toBeDefined();
      }
    }
  });

  test("no component hard-codes a colour literal", () => {
    // The token block owns every colour; a hex in a component is a second
    // palette that this test cannot see.
    const components = [
      "src/components/FirstScreen.tsx",
      "src/components/LatencyInstrument.tsx",
      "src/components/ProofBand.tsx",
      "src/components/WorkBand.tsx",
      "src/components/AtlasBand.tsx",
      "src/components/ForwardBand.tsx",
      "src/components/CredentialsBand.tsx",
      "src/components/Contact.tsx",
      "src/components/Header.tsx",
      "src/components/Footer.tsx",
      "src/components/Experience.tsx",
      "src/components/Projects.tsx",
      "src/components/NotFound.tsx",
    ];
    for (const file of components) {
      const source = readFileSync(resolve(root, file), "utf8");
      expect(source, file).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
  });
});
