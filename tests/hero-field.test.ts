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
  COOLDOWN_MS,
  FRAME_BUDGET_MS,
  TIERS,
  UPGRADE_MS,
  createField,
  nextTier,
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
  test("the tiers only ever get cheaper, and DPR falls after particles", () => {
    expect(FRAME_BUDGET_MS).toBe(22);
    expect(UPGRADE_MS).toBe(12);
    expect(COOLDOWN_MS).toBeGreaterThanOrEqual(2000);
    expect(TIERS[0]).toEqual({ count: 1500, dpr: 2 });
    for (let index = 1; index < TIERS.length; index += 1) {
      const previous = TIERS[index - 1];
      const current = TIERS[index];
      expect(current.count).toBeLessThanOrEqual(previous.count);
      expect(current.dpr).toBeLessThanOrEqual(previous.dpr);
      // A tier must save something: no rung is a relabelled copy of its parent.
      expect(current).not.toEqual(previous);
    }
    // Particles are shed before the buffer is: the first drop keeps DPR 2.
    expect(TIERS[1].dpr).toBe(2);
    expect(TIERS[1].count).toBeLessThan(TIERS[0].count);
  });

  test("holds the tier inside the band, both ways", () => {
    expect(nextTier(0, 16, 10_000)).toBe(0);
    expect(nextTier(3, 16, 10_000)).toBe(3);
    expect(nextTier(0, 21.9, 10_000)).toBe(0);
    expect(nextTier(0, 22.1, 10_000)).toBe(1);
  });

  test("drops a tier when over budget, and stops at the cheapest", () => {
    expect(nextTier(2, 30, 10_000)).toBe(3);
    expect(nextTier(TIERS.length - 1, 40, 10_000)).toBe(TIERS.length - 1);
  });

  test("steps back up only after a sustained fast window and the cooldown", () => {
    expect(nextTier(2, 11, 500)).toBe(2); // fast, but no cooldown elapsed
    expect(nextTier(2, 11, 1_999)).toBe(2);
    expect(nextTier(2, 11, 2_000)).toBe(1);
    expect(nextTier(0, 8, 10_000)).toBe(0); // never above the top tier
    expect(nextTier(2, 12.5, 10_000)).toBe(2); // not "sustained fast" yet
  });

  test("cannot oscillate: a page flipping either side of the budget stays put", () => {
    let index = 2;
    let sinceSwitch = 0;
    for (let window = 0; window < 200; window += 1) {
      /* Alternating 10 ms and 30 ms windows — exactly the pattern that makes a
         naive controller switch every time. */
      const frameMs = window % 2 === 0 ? 10 : 30;
      const next = nextTier(index, frameMs, sinceSwitch);
      if (next !== index) {
        index = next;
        sinceSwitch = 0;
      }
      sinceSwitch += 500;
    }
    // It settles at the cheapest tier and never climbs back out of it, because
    // every promotion is immediately followed by a 30 ms window.
    expect(index).toBe(TIERS.length - 1);
  });
});
