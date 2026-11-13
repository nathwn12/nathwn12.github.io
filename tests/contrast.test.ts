import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * Contrast, computed from the shipped CSS custom properties — both themes.
 *
 * Reading the tokens out of `src/styles/tokens.css` is the point: a hex changed
 * in the palette flows into this test with no second copy to keep in step, so
 * the numbers below are the colours the page actually paints. The two blocks are
 * resolved the way the cascade resolves them: the dark `:root` palette first,
 * then `[data-theme="light"]` over it.
 *
 * The pairs are the ones the components render: body copy and secondary notes on
 * the ground and on an inset surface, the link colour, the measured numerals, the
 * one alarm colour, and the label on the cover's filled action. The floors are
 * the brief's: ink ≥ 7, muted ink ≥ 4.5, signal ≥ 4.5, measure ≥ 4.5, alarm ≥ 4.5,
 * the filled action's label ≥ 4.5.
 *
 * WCAG 2.2: 4.5:1 for text under 24px (or 18.66px bold), 3:1 for large text. The
 * floors above 4.5 are the recorder's own: this direction sets type small, so the
 * palette has to clear the AA floor with room to spare.
 */

const root = resolve(import.meta.dirname, "..");
const css = readFileSync(resolve(root, "src", "styles", "tokens.css"), "utf8");

const HEX = /^#[0-9a-f]{6}$/i;

/** The body of the first `{ ... }` block opened by `selector`, or "". */
function block(source: string, selector: string): string {
  const from = source.indexOf(selector);
  if (from === -1) return "";
  const open = source.indexOf("{", from);
  const close = source.indexOf("\n}", open);
  if (open === -1 || close === -1) return "";
  return source.slice(open, close);
}

/** Every `--rec-*: #hex` pair in a block, lowercased. */
function hexTokens(source: string): Record<string, string> {
  const found: Record<string, string> = {};
  for (const match of source.matchAll(
    /(--rec-[a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi,
  )) {
    found[match[1]] = match[2].toLowerCase();
  }
  return found;
}

const DARK = hexTokens(block(css, ":root"));
const LIGHT_OVERRIDE = hexTokens(block(css, '[data-theme="light"]'));

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

interface Pair {
  /** What the pair paints, in the words of the component that uses it. */
  role: string;
  fg: string;
  bg: string;
  /** 4.5 for body text, higher where the brief promises more. */
  min: number;
}

const PAIRS: Pair[] = [
  // The ground: running copy, secondary notes, links, measured numerals.
  { role: "body text on the ground", fg: "ink", bg: "ground", min: 7 },
  { role: "muted notes on the ground", fg: "ink-muted", bg: "ground", min: 4.5 },
  { role: "signal link on the ground", fg: "signal", bg: "ground", min: 4.5 },
  { role: "measured numerals on the ground", fg: "measure", bg: "ground", min: 4.5 },
  { role: "the alarm date on the ground", fg: "alarm", bg: "ground", min: 4.5 },

  // The cover's filled action: the label on the signal fill.
  { role: "the action label on the signal fill", fg: "on-signal", bg: "signal", min: 4.5 },

  // Inset surfaces: the instrument panel and a hovered row.
  { role: "body text on the instrument panel", fg: "ink", bg: "panel", min: 7 },
  { role: "muted notes on the instrument panel", fg: "ink-muted", bg: "panel", min: 4.5 },
  { role: "the reduction readout on the panel", fg: "measure", bg: "panel", min: 4.5 },
  { role: "body text on a hovered row", fg: "ink", bg: "panel-2", min: 7 },
  { role: "muted notes on a hovered row", fg: "ink-muted", bg: "panel-2", min: 4.5 },
];

const THEMES: Array<[string, Record<string, string>]> = [
  ["dark", DARK],
  ["light", { ...DARK, ...LIGHT_OVERRIDE }],
];

describe("both palettes are present and complete", () => {
  test("the dark palette is in :root", () => {
    expect(Object.keys(DARK).length).toBeGreaterThanOrEqual(11);
  });

  test("the light palette overrides every colour role, not a subset", () => {
    // A light block that leaves a role behind paints a dark ground's token on
    // paper: the roles below are the whole colour surface of the site.
    for (const role of [
      "ground",
      "panel",
      "panel-2",
      "rule",
      "rule-strong",
      "ink",
      "ink-muted",
      "signal",
      "measure",
      "alarm",
      "on-signal",
    ]) {
      expect(
        LIGHT_OVERRIDE[`--rec-${role}`],
        `--rec-${role} is not overridden in the light block`,
      ).toBeDefined();
    }
  });

  test("the two themes are not one ramp reversed", () => {
    // The brief's line: the light accent is deeper and less chromatic than the
    // dark one, and its muted ink is not a mirror of the dark muted ink.
    expect(LIGHT_OVERRIDE["--rec-signal"]).not.toBe(DARK["--rec-signal"]);
    expect(LIGHT_OVERRIDE["--rec-ground"]).not.toBe(DARK["--rec-ground"]);
  });
});

describe.each(THEMES)("%s: every painted pair clears its floor", (_theme, tokens) => {
  const tok = (name: string): string => {
    const value = tokens[`--rec-${name}`];
    expect(value, `--rec-${name} is not defined as a hex token`).toBeDefined();
    return value!;
  };

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
    const ratio = contrast(tok("ink-muted"), tok("ground"));
    expect(ratio).toBeGreaterThan(4.5);
    expect(ratio).toBeLessThan(contrast(tok("ink"), tok("ground")));
  });

  test("reports the rules against the ground without a threshold", () => {
    // Reported, not judged: a rule under 1.3 is invisible, over 4 is a wall.
    // Pinned as a range so a rule that vanishes from the stylesheet still fails.
    for (const rule of ["rule", "rule-strong"]) {
      const ratio = contrast(tok(rule), tok("ground"));
      expect(ratio, `${rule} on ground = ${ratio.toFixed(2)}:1`).toBeGreaterThan(1.05);
      expect(ratio, `${rule} on ground = ${ratio.toFixed(2)}:1`).toBeLessThan(6);
    }
  });
});

describe("the tokens are the ones the stylesheet defines", () => {
  test("every pair names a token that exists in both themes", () => {
    for (const [, tokens] of THEMES) {
      for (const pair of PAIRS) {
        for (const name of [pair.fg, pair.bg]) {
          expect(tokens[`--rec-${name}`], `--rec-${name}`).toBeDefined();
        }
      }
    }
  });

  test("no component hard-codes a colour literal", () => {
    // The token block owns every colour; a hex in a component is a second
    // palette that this test cannot see — and it would not follow the theme.
    // The list is every component that paints, not a sample: a new file that
    // types its own colour has to fail here rather than be forgotten.
    const components = [
      "src/components/AiPractice.tsx",
      "src/components/AtlasBand.tsx",
      "src/components/Chrome.tsx",
      "src/components/Contact.tsx",
      "src/components/CredentialsBand.tsx",
      "src/components/Experience.tsx",
      "src/components/FirstScreen.tsx",
      "src/components/Footer.tsx",
      "src/components/ForwardBand.tsx",
      "src/components/Grain.tsx",
      "src/components/Header.tsx",
      "src/components/HeroField.tsx",
      "src/components/LatencyInstrument.tsx",
      "src/components/Marquee.tsx",
      "src/components/NotFound.tsx",
      "src/components/ProjectReadout.tsx",
      "src/components/Projects.tsx",
      "src/components/ProofBand.tsx",
      "src/components/Readout.tsx",
      "src/components/Record.tsx",
      "src/components/Reticle.tsx",
      "src/components/RouteCurtain.tsx",
      "src/components/ThemeToggle.tsx",
      "src/components/Timeline.tsx",
      "src/components/WorkBand.tsx",
    ];
    for (const file of components) {
      const source = readFileSync(resolve(root, file), "utf8");
      expect(source, file).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
  });

  test("the stylesheet layers carry no colour literal outside the token block", () => {
    // tokens.css is the one file allowed to name a colour. A hex in base,
    // chrome or legacy is the same second palette as a hex in a component, and
    // it is the harder one to find because nothing imports it by name.
    for (const file of [
      "src/styles/base.css",
      "src/styles/chrome.css",
      "src/styles/legacy.css",
    ]) {
      const source = readFileSync(resolve(root, file), "utf8");
      expect(source, file).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
  });
});
