import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  BLUR_SOURCE,
  COMPOSITE_SOURCE,
  EMISSION_SOURCE,
  GEOMETRY_SOURCE,
  OPTICS,
} from "../src/lib/blackhole/shaders";
import { MAX_DPR, QUALITY_HEIGHT } from "../src/lib/blackhole/renderer";

const root = resolve(import.meta.dirname, "..");
const renderer = readFileSync(
  resolve(root, "src/lib/blackhole/renderer.ts"),
  "utf8",
);

describe("the ported shader keeps the viewer's multi-pass pipeline", () => {
  test("the geometry pass writes three MRT float targets", () => {
    for (const location of [0, 1, 2]) {
      expect(GEOMETRY_SOURCE).toContain(`layout(location = ${location}) out vec4 map`);
    }
    expect(GEOMETRY_SOURCE).toContain("540");
  });

  test("emission reads all three lensed images", () => {
    for (const map of ["uMap0", "uMap1", "uMap2"]) {
      expect(EMISSION_SOURCE).toContain(map);
    }
  });

  test("the bloom pass is separable and the composite uses four levels", () => {
    expect(BLUR_SOURCE).toContain("uDirection");
    for (let i = 0; i < 4; i++) {
      expect(COMPOSITE_SOURCE).toContain(`uBloom${i}`);
    }
  });

  test("the optics are the reference constants", () => {
    expect(OPTICS.center).toEqual([0.5152, 0.4529]);
    expect(OPTICS.tilt).toBe(0.2157);
    expect(OPTICS.scale).toBe(27.5);
    expect(OPTICS.inclination).toBe(0.072);
    expect(OPTICS.inner).toBe(1.51);
  });

  test("the renderer keeps the four bloom divisors and a DPR cap", () => {
    for (const divisor of [2, 4, 12, 24]) {
      expect(renderer).toContain(String(divisor));
    }
    expect(MAX_DPR).toBe(2);
    expect(QUALITY_HEIGHT.medium).toBe(960);
  });

  test("the shader is attributed and the still ships", () => {
    const notices = readFileSync(
      resolve(root, "THIRD-PARTY-NOTICES.md"),
      "utf8",
    );
    expect(notices).toContain("Copyright (c) 2026 sayed1145");
    expect(notices).toContain("MIT License");
    expect(GEOMETRY_SOURCE).toContain("no imported image or LUT");
  });
});
