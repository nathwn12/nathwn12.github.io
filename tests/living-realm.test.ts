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

  test("SystemAtlas is an interactive, accessible, always-animated diagram", () => {
    expect(atlas).toMatch(/role="group"/);
    expect(atlas).toMatch(/aria-label=\{node\.label\}/);
    expect(atlas).toMatch(/aria-pressed=\{isSelected\}/);
    expect(atlas).toMatch(/aria-live="polite"/);
    // Owner order 2026-10-14 (src/lib/motionPreference.ts): the atlas is never
    // gated off — the component carries no motion gate of its own, and the pulse
    // paths render unconditionally beside the static links.
    expect(atlas).not.toMatch(/reduceMotion/);
    expect(atlas).not.toMatch(/useResolvedReduceMotion/);
    expect(atlas).toMatch(/strokeDashoffset: \[0, -1\]/);
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