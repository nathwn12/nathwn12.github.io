/**
 * Motion grammar — "lines commit, mass responds" (owner brief 2026-10-21).
 *
 * Asserts the pure parts of the additive grammar in src/lib/motion.ts:
 *  1. The rule-draw variant is compositor-only (scaleX from 0, left origin,
 *     no layout-affecting property) and runs ~320ms on an ease-out curve.
 *  2. Band stagger offsets start 80ms after the rule and step 90ms in
 *     document order, keeping the staggerParent rhythm.
 *  3. Rail row offsets step 60ms per row from zero.
 *  4. The marquee rate clamp rests at base, saturates at 2.5x, rises
 *     monotonically, and never runs negative or backwards.
 *
 * Every count below can go red:
 *
 *   pnpm vitest run tests/motion-grammar.test.ts
 */
import { describe, expect, it } from "vitest";
import type { Variants } from "framer-motion";
import {
  BAND_INDEX,
  BAND_ORDER_GAP_MS,
  MARQUEE_BASE_PX_PER_S,
  MARQUEE_EASE_BACK_MS,
  MARQUEE_MAX_PX_PER_S,
  RAIL_ROW_GAP_MS,
  RULE_DRAW_MS,
  STAGGER_AFTER_RULE_MS,
  bandDelayMs,
  bandDelaySec,
  bandFadeUp,
  bandStaggerParent,
  fadeUp,
  marqueeRateForVelocity,
  railRowDelayMs,
  railRowDelaySec,
  railRule,
  ruleDraw,
  staggerParent,
} from "../src/lib/motion";

/** Properties that would move layout if animated — none may appear.
    (`x`/`y`/`scaleX` are transforms and stay compositor-only.) */
const LAYOUT_PROPS = [
  "width",
  "height",
  "top",
  "left",
  "right",
  "bottom",
  "margin",
  "padding",
] as const;

/** The `visible` (and `hidden`) target of an object-form variant. */
function targetOf(variants: Variants, key: "hidden" | "visible") {
  const target = variants[key];
  expect(target, `variant must carry a ${key} state`).toBeDefined();
  expect(typeof target, `${key} must be object-form`).not.toBe("function");
  return target as Record<string, unknown>;
}

function transitionOf(variants: Variants, key: "visible") {
  const target = targetOf(variants, key);
  const transition = target["transition"] as Record<string, unknown> | undefined;
  expect(transition, "visible must carry a transition").toBeDefined();
  return transition as Record<string, unknown>;
}

function expectLayoutFree(target: Record<string, unknown>, what: string) {
  for (const prop of LAYOUT_PROPS) {
    expect(
      target,
      `${what} must not animate layout property ${prop}`,
    ).not.toHaveProperty(prop);
  }
}

describe("rule draw", () => {
  it("draws scaleX 0 → 1 from the left in ~320ms on an ease-out curve", () => {
    expect(RULE_DRAW_MS).toBe(320);
    const hidden = targetOf(ruleDraw, "hidden");
    const visible = targetOf(ruleDraw, "visible");
    expect(hidden["scaleX"]).toBe(0);
    expect(visible["scaleX"]).toBe(1);
    expect(hidden["transformOrigin"]).toBe("left");
    expect(visible["transformOrigin"]).toBe("left");
    const transition = transitionOf(ruleDraw, "visible");
    expect(transition["duration"]).toBeCloseTo(0.32, 5);
    expect(transition["ease"]).toBeDefined();
  });

  it("touches no layout-affecting property", () => {
    expectLayoutFree(targetOf(ruleDraw, "hidden"), "ruleDraw.hidden");
    expectLayoutFree(targetOf(ruleDraw, "visible"), "ruleDraw.visible");
  });
});

describe("band stagger offsets", () => {
  it("names the four ruled bands in document order", () => {
    expect(BAND_INDEX.experience).toBe(0);
    expect(BAND_INDEX.work).toBe(1);
    expect(BAND_INDEX.forward).toBe(2);
    expect(BAND_INDEX.credentials).toBe(3);
  });

  it("starts the stagger 80ms after the rule and steps bands 90ms apart", () => {
    expect(STAGGER_AFTER_RULE_MS).toBe(80);
    expect(BAND_ORDER_GAP_MS).toBe(90);
    expect([
      bandDelayMs(0),
      bandDelayMs(1),
      bandDelayMs(2),
      bandDelayMs(3),
    ]).toEqual([80, 170, 260, 350]);
    expect(bandDelaySec(2)).toBeCloseTo(0.26, 5);
  });

  it("offsets only the first child, keeping the staggerParent rhythm", () => {
    const base = transitionOf(staggerParent, "visible");
    for (let index = 0; index < 4; index += 1) {
      const transition = transitionOf(bandStaggerParent(index), "visible");
      expect(transition["staggerChildren"]).toBe(base["staggerChildren"]);
      expect(transition["delayChildren"]).toBeCloseTo(
        bandDelaySec(index),
        5,
      );
    }
    const delays = [0, 1, 2, 3].map((index) =>
      transitionOf(bandStaggerParent(index), "visible")["delayChildren"],
    );
    const sorted = [...delays].sort((a, b) => (a as number) - (b as number));
    expect(delays).toEqual(sorted);
  });

  it("offsets the credentials fade like a stagger without changing its rise", () => {
    const expected = targetOf(fadeUp, "hidden");
    const hidden = targetOf(bandFadeUp(BAND_INDEX.credentials), "hidden");
    const visible = targetOf(
      bandFadeUp(BAND_INDEX.credentials),
      "visible",
    );
    expect(hidden["opacity"]).toBe(expected["opacity"]);
    expect(visible["opacity"]).toBe(1);
    expect(visible["y"]).toBe(0);
    expect(transitionOf(bandFadeUp(BAND_INDEX.credentials), "visible")["delay"]).toBeCloseTo(
      bandDelaySec(BAND_INDEX.credentials),
      5,
    );
    expectLayoutFree(hidden, "bandFadeUp.hidden");
    expectLayoutFree(visible, "bandFadeUp.visible");
  });
});

describe("rail row offsets", () => {
  it("starts row 0 at entry and each later row 60ms after the previous", () => {
    expect(RAIL_ROW_GAP_MS).toBe(60);
    expect(railRowDelayMs(0)).toBe(0);
    for (let row = 1; row <= 5; row += 1) {
      expect(railRowDelayMs(row) - railRowDelayMs(row - 1)).toBe(60);
    }
    expect(railRowDelaySec(3)).toBeCloseTo(0.18, 5);
  });

  it("draws each row's rule on its own beat without touching layout", () => {
    for (let row = 0; row < 4; row += 1) {
      const hidden = targetOf(railRule(row), "hidden");
      const visible = targetOf(railRule(row), "visible");
      expect(hidden["scaleX"]).toBe(0);
      expect(visible["scaleX"]).toBe(1);
      expect(visible["transformOrigin"]).toBe("left");
      expect(transitionOf(railRule(row), "visible")["delay"]).toBeCloseTo(
        railRowDelaySec(row),
        5,
      );
      expectLayoutFree(visible, `railRule(${row}).visible`);
    }
  });
});

describe("marquee rate clamp", () => {
  it("rests at the base rate at zero velocity", () => {
    expect(MARQUEE_BASE_PX_PER_S).toBe(40);
    expect(marqueeRateForVelocity(0)).toBe(MARQUEE_BASE_PX_PER_S);
    expect(marqueeRateForVelocity(-0)).toBe(MARQUEE_BASE_PX_PER_S);
  });

  it("caps at 2.5x the base rate", () => {
    expect(MARQUEE_MAX_PX_PER_S).toBe(2.5 * MARQUEE_BASE_PX_PER_S);
    expect(marqueeRateForVelocity(1_000_000)).toBe(MARQUEE_MAX_PX_PER_S);
    expect(marqueeRateForVelocity(Number.POSITIVE_INFINITY)).toBe(
      MARQUEE_MAX_PX_PER_S,
    );
  });

  it("rises monotonically with |velocity| and treats direction alike", () => {
    const samples = [0, 50, 250, 1000, 2000, 5000, 50_000];
    const rates = samples.map((velocity) => marqueeRateForVelocity(velocity));
    for (let i = 1; i < rates.length; i += 1) {
      expect(rates[i]).toBeGreaterThanOrEqual(rates[i - 1]);
    }
    expect(rates[0]).toBe(MARQUEE_BASE_PX_PER_S);
    expect(rates[rates.length - 1]).toBe(MARQUEE_MAX_PX_PER_S);
    expect(marqueeRateForVelocity(-1200)).toBe(marqueeRateForVelocity(1200));
    expect(marqueeRateForVelocity(1000)).toBeGreaterThan(
      MARQUEE_BASE_PX_PER_S,
    );
  });

  it("never runs negative or backwards, even off the rails", () => {
    for (const velocity of [-20_000, -1, 0, 7, 1999, 2001, 1e9]) {
      expect(marqueeRateForVelocity(velocity)).toBeGreaterThanOrEqual(0);
      expect(marqueeRateForVelocity(velocity)).toBeGreaterThanOrEqual(
        MARQUEE_BASE_PX_PER_S,
      );
    }
    expect(marqueeRateForVelocity(Number.NaN)).toBe(MARQUEE_BASE_PX_PER_S);
    expect(MARQUEE_EASE_BACK_MS).toBe(600);
  });
});
