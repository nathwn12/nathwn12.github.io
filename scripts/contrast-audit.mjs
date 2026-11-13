#!/usr/bin/env node
/**
 * contrast-audit — the palette's own judge.
 *
 * Dependency-free, and it reads the shipped `src/styles/tokens.css` rather than a
 * copy: the two theme blocks are resolved the way the cascade resolves them (the
 * dark `:root` block first, the `[data-theme="light"]` block over it), then every
 * required pair is measured with the WCAG 2.2 relative-luminance formula and
 * printed as one table. A single failing pair exits 1, so `bun run check` cannot
 * pass on a palette that lost its floor.
 *
 * Thresholds are the brief's: ink ≥ 7, muted ink ≥ 4.5, signal ≥ 4.5,
 * measure ≥ 4.5, alarm ≥ 4.5, the label on a filled signal surface ≥ 4.5.
 * `rule` and `rule-strong` against the ground are reported with no threshold —
 * a rule under 1.3 is invisible and over 4 is a wall, and which side of that a
 * hairline sits on is a design call, not a pass/fail.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(resolve(root, "src", "styles", "tokens.css"), "utf8");

/** The body of the first `{ ... }` block opened by `selector`, or "". */
function block(css, selector) {
  const from = css.indexOf(selector);
  if (from === -1) return "";
  const open = css.indexOf("{", from);
  const close = css.indexOf("\n}", open);
  if (open === -1 || close === -1) return "";
  return css.slice(open, close);
}

/** Every `--rec-*: #hex` pair in a block, lowercased. */
function hexTokens(css) {
  const found = {};
  for (const match of css.matchAll(/(--rec-[a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)) {
    found[match[1]] = match[2].toLowerCase();
  }
  return found;
}

const dark = hexTokens(block(source, ":root"));
const lightOverride = hexTokens(block(source, '[data-theme="light"]'));

if (Object.keys(dark).length === 0) {
  console.error("contrast-audit: tokens.css has no :root palette");
  process.exit(1);
}
if (Object.keys(lightOverride).length === 0) {
  console.error('contrast-audit: tokens.css has no [data-theme="light"] palette');
  process.exit(1);
}

const THEMES = { dark, light: { ...dark, ...lightOverride } };

const REQUIRED = [
  { fg: "ink", bg: "ground", min: 7 },
  { fg: "ink", bg: "panel", min: 7 },
  { fg: "ink", bg: "panel-2", min: 7 },
  { fg: "ink-muted", bg: "ground", min: 4.5 },
  { fg: "ink-muted", bg: "panel", min: 4.5 },
  { fg: "ink-muted", bg: "panel-2", min: 4.5 },
  { fg: "signal", bg: "ground", min: 4.5 },
  { fg: "signal", bg: "panel", min: 4.5 },
  { fg: "measure", bg: "ground", min: 4.5 },
  { fg: "measure", bg: "panel", min: 4.5 },
  { fg: "alarm", bg: "ground", min: 4.5 },
  { fg: "on-signal", bg: "signal", min: 4.5 },
];

const REPORTED = [
  { fg: "rule", bg: "ground" },
  { fg: "rule-strong", bg: "ground" },
];

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground, background) {
  const [hi, lo] = [luminance(foreground), luminance(background)].sort(
    (x, y) => y - x,
  );
  return (hi + 0.05) / (lo + 0.05);
}

const rows = [];
let failed = 0;

for (const [theme, tokens] of Object.entries(THEMES)) {
  for (const pair of REQUIRED) {
    const fg = tokens[`--rec-${pair.fg}`];
    const bg = tokens[`--rec-${pair.bg}`];
    if (!fg || !bg) {
      rows.push([theme, `${pair.fg} on ${pair.bg}`, "missing", pair.min, "FAIL"]);
      failed += 1;
      continue;
    }
    const ratio = contrast(fg, bg);
    const pass = ratio >= pair.min;
    if (!pass) failed += 1;
    rows.push([
      theme,
      `${pair.fg} on ${pair.bg}`,
      ratio.toFixed(2),
      pair.min.toFixed(1),
      pass ? "pass" : "FAIL",
    ]);
  }
  for (const pair of REPORTED) {
    const fg = tokens[`--rec-${pair.fg}`];
    const bg = tokens[`--rec-${pair.bg}`];
    rows.push([
      theme,
      `${pair.fg} on ${pair.bg}`,
      fg && bg ? contrast(fg, bg).toFixed(2) : "missing",
      "-",
      "report",
    ]);
  }
}

const widths = [0, 1, 2, 3, 4].map((column) =>
  Math.max(...rows.map((row) => String(row[column]).length), 8),
);

const line = (cells) =>
  cells.map((cell, index) => String(cell).padEnd(widths[index])).join(" | ");

console.log(line(["theme", "pair", "ratio", "required", "result"]));
console.log(widths.map((width) => "-".repeat(width)).join("-+-"));
for (const row of rows) console.log(line(row));

if (failed > 0) {
  console.error(`\ncontrast-audit: ${failed} pair(s) below their floor`);
  process.exit(1);
}
console.log(`\ncontrast-audit: ${rows.length} pairs measured, all floors met`);
