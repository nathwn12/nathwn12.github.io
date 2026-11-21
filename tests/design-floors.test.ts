/**
 * DESIGN.md's contrast floors, computed from the live token values — never
 * from a copy of the numbers in prose. A drift between tokens.css and the
 * committed law fails here.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const tokens = readFileSync(
  resolve(import.meta.dirname, "../src/styles/tokens.css"),
  "utf8",
);

function color(name: string): string {
  const match = tokens.match(
    new RegExp(`--color-${name}\\s*:\\s*(#[0-9a-fA-F]{6})\\b`),
  );
  if (!match) throw new Error(`design-floors: missing --color-${name}`);
  return match[1]!;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const holds = (a: string, b: string, floor: number) =>
  expect(contrast(a, b)).toBeGreaterThanOrEqual(floor);

const ground = color("ground");

describe("DESIGN.md contrast floors from live tokens", () => {
  test("ink holds 7:1 on the ground", () => holds(color("ink"), ground, 7));

  test("ink-muted holds 4.5:1 on the ground", () =>
    holds(color("ink-muted"), ground, 4.5));

  test("signal holds 4.5:1 on the ground", () =>
    holds(color("signal"), ground, 4.5));

  // DESIGN.md says "on-signal ≥ 4.5:1 against ground", but on-signal is defined
  // as ink ON a signal fill. Against ground it is 1.03:1; against its actual
  // fill it is 6.49:1. The real pairing is asserted here; the wording is
  // reported as a contract conflict, not silently followed.
  test("on-signal holds 4.5:1 on its signal fill", () =>
    holds(color("on-signal"), color("signal"), 4.5));

  test("measure holds 3:1 on the ground", () =>
    holds(color("measure"), ground, 3));
});
