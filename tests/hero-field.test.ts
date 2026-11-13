/**
 * The hero field's simulation, tested without a browser.
 *
 * The canvas is decoration, but the thing that makes it a field rather than a
 * random scatter is arithmetic: a velocity that is a function of position, a
 * pointer that bends it, and a particle budget that steps down when the frame
 * time does. All of that lives in `src/lib/flowfield.ts` with no DOM, so it can
 * be pinned here — a deterministic seed, a bounded box, a budget that never
 * climbs back up mid-run.
 */
import { describe, expect, test } from "vitest";
import {
  FRAME_BUDGET_MS,
  createField,
  degradeCount,
  stepField,
  type Field,
} from "../src/lib/flowfield";

const IDLE = { dt: 1 / 60, pointer: null, scroll: 0 } as const;

describe("createField", () => {
  test("is deterministic for a seed and reproducible at any time", () => {
    const a = createField(1440, 900, 600, 7);
    const b = createField(1440, 900, 600, 7);
    expect(a.particles).toEqual(b.particles);
    expect(a.particles).toHaveLength(600);
    expect(createField(1440, 900, 600, 8).particles).not.toEqual(a.particles);
  });

  test("every particle starts inside the box, on one of the two accents", () => {
    const field = createField(1440, 900, 900, 3);
    for (const particle of field.particles) {
      expect(particle.x).toBeGreaterThanOrEqual(0);
      expect(particle.x).toBeLessThanOrEqual(1440);
      expect(particle.y).toBeGreaterThanOrEqual(0);
      expect(particle.y).toBeLessThanOrEqual(900);
      expect([0, 1]).toContain(particle.band);
    }
    // Both accents are present, so the field is the palette's two signals and
    // not one hue with a stray.
    const bands = new Set(field.particles.map((particle) => particle.band));
    expect(bands.size).toBe(2);
  });
});

describe("stepField", () => {
  test("advances time and keeps every particle in the box", () => {
    const field = createField(400, 300, 500, 11);
    for (let frame = 0; frame < 240; frame += 1) stepField(field, IDLE);
    expect(field.time).toBeGreaterThan(0);
    for (const particle of field.particles) {
      expect(particle.x).toBeGreaterThanOrEqual(0);
      expect(particle.x).toBeLessThanOrEqual(400);
      expect(particle.y).toBeGreaterThanOrEqual(0);
      expect(particle.y).toBeLessThanOrEqual(300);
    }
  });

  test("is deterministic: same seed, same steps, same positions", () => {
    const a = createField(800, 600, 300, 5);
    const b = createField(800, 600, 300, 5);
    for (let frame = 0; frame < 30; frame += 1) {
      stepField(a, IDLE);
      stepField(b, IDLE);
    }
    expect(a.particles).toEqual(b.particles);
  });

  test("the pointer bends the field where it is, not on the far side", () => {
    const still: Field = createField(900, 600, 800, 2);
    const bent: Field = createField(900, 600, 800, 2);
    const pointer = { x: 120, y: 300 };
    for (let frame = 0; frame < 20; frame += 1) {
      stepField(still, IDLE);
      stepField(bent, { ...IDLE, pointer });
    }
    const drift = (field: Field) => {
      const near = field.particles.filter(
        (particle) => Math.hypot(particle.x - pointer.x, particle.y - pointer.y) < 160,
      );
      return (
        near.reduce((total, particle) => total + particle.x + particle.y, 0) /
        Math.max(1, near.length)
      );
    };
    expect(drift(bent)).not.toBe(drift(still));
    // The particles on the far side are untouched by the pointer. Compared by
    // index, and away from the wrap edge, so a particle that left the box is
    // not mistaken for a difference.
    const far = still.particles
      .map((particle, index) => ({ index, x: particle.x }))
      .filter((entry) => entry.x > 700 && entry.x < 860)
      .map((entry) => entry.index);
    expect(far.length).toBeGreaterThan(20);
    for (const index of far) {
      expect(bent.particles[index]).toEqual(still.particles[index]);
    }
  });

  test("scroll velocity moves the field without leaving the box", () => {
    const calm = createField(600, 400, 400, 4);
    const fast = createField(600, 400, 400, 4);
    for (let frame = 0; frame < 30; frame += 1) {
      stepField(calm, IDLE);
      stepField(fast, { ...IDLE, scroll: 40 });
    }
    const meanY = (field: Field) =>
      field.particles.reduce((total, particle) => total + particle.y, 0) /
      field.particles.length;
    expect(meanY(fast)).not.toBe(meanY(calm));
  });
});

describe("the frame budget", () => {
  test("holds the count under budget", () => {
    expect(FRAME_BUDGET_MS).toBe(22);
    expect(degradeCount(1600, 12)).toBe(1600);
    expect(degradeCount(1600, 21.9)).toBe(1600);
  });

  test("steps the count down once the rolling average exceeds the budget", () => {
    const next = degradeCount(1600, 26);
    expect(next).toBeLessThan(1600);
    expect(next).toBe(1120);
    // And it steps again, so a field that is still too slow keeps shedding.
    expect(degradeCount(next, 30)).toBeLessThan(next);
  });

  test("never climbs back up mid-run, and never falls below the floor", () => {
    expect(degradeCount(1120, 8)).toBe(1120);
    expect(degradeCount(360, 40)).toBe(360);
    expect(degradeCount(400, 40)).toBe(400);
  });
});
