import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const read = (p: string) =>
  readFileSync(resolve(import.meta.dirname, "..", p), "utf8");

const atlas = read("src/components/SystemAtlas.tsx");
const hero = read("src/components/Hero.tsx");

describe("living realm rebuild", () => {
  test("SystemAtlas exports a named component", () => {
    expect(atlas).toMatch(/export function SystemAtlas/);
  });

  test("SystemAtlas is an interactive, accessible, reduced-motion-aware diagram", () => {
    expect(atlas).toMatch(/role="radiogroup"/);
    expect(atlas).toMatch(/aria-label=\{node\.label\}/);
    expect(atlas).toMatch(/aria-pressed=\{isSelected\}/);
    expect(atlas).toMatch(/aria-live="polite"/);
    // Reduced motion is now read through the persisted preference resolver,
    // not the raw OS media query — the gate itself is what this pins.
    expect(atlas).toMatch(/useResolvedReduceMotion\(\)/);
    expect(atlas).toMatch(/<svg[\s\S]*?viewBox=\{`0 0 \$\{VIEW_W\} \$\{VIEW_H\}`\}/);
    expect(atlas).toMatch(/motion\.path/);
    expect(atlas).toContain("payments");
    expect(atlas).toContain("review");
  });

  test("the landing wires the living diagram before its proof band", () => {
    expect(hero).toMatch(/import \{ SystemAtlas \} from "\.\/SystemAtlas"/);
    expect(hero).toMatch(/<SystemAtlas\s*\/>/);
  });
});