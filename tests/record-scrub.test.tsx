// @vitest-environment jsdom
/**
 * The record band's one scrubbed timeline.
 *
 * Four outcomes, four figures — and one movement. The band counts them in
 * sequence from a single scroll-driven tween; it is not four separate reveals,
 * and no cell carries an entrance of its own. This file holds that shape and
 * the resting truth: with motion off, every figure is already the delivered
 * value, because the markup carries it.
 *
 *   bunx vitest run tests/record-scrub.test.tsx
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ProofBand } from "../src/components/ProofBand";
import { figureParts, renderFigure } from "../src/lib/figure";
import { proofRows } from "../src/content/ledger";

let host: HTMLDivElement;
let root: Root | null = null;

async function mount() {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(createElement(ProofBand));
  });
}

beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(async () => {
  vi.unstubAllGlobals();
  if (root) {
    await act(async () => {
      root!.unmount();
    });
    root = null;
  }
  host?.remove();
});

describe("figureParts", () => {
  test("a figure splits into the sign, the number and the unit", () => {
    expect(figureParts("−98%")).toMatchObject({
      prefix: "−",
      value: 98,
      suffix: "%",
    });
    expect(figureParts("−40%+")).toMatchObject({
      prefix: "−",
      value: 40,
      suffix: "%+",
    });
    expect(figureParts("0")).toMatchObject({ prefix: "", value: 0, suffix: "" });
    expect(figureParts("1,182")).toMatchObject({
      prefix: "",
      value: 1182,
      suffix: "",
      grouped: true,
    });
  });

  test("rendering at the delivered value is the delivered string", () => {
    for (const row of proofRows) {
      const parts = figureParts(row.figure);
      expect(renderFigure(parts, parts.value)).toBe(row.figure);
    }
  });

  test("a count in progress never renders a bare minus", () => {
    expect(renderFigure(figureParts("−98%"), 0)).toBe("0");
    expect(renderFigure(figureParts("−98%"), 49)).toBe("−49%");
    expect(renderFigure(figureParts("1,182"), 591)).toBe("591");
  });
});

describe("one timeline, four values", () => {
  test("all four figures live in one scrub scope", async () => {
    await mount();
    const scopes = host.querySelectorAll("[data-proof-scrub]");
    expect(scopes).toHaveLength(1);
    expect(scopes[0].querySelectorAll("[data-figure]")).toHaveLength(
      proofRows.length,
    );
  });

  test("with motion off every figure is already the delivered value", async () => {
    /* jsdom has no matchMedia, which is the module's own definition of "cannot
       tell" — it answers "reduce". So this is the still page: no tween, no
       zero, the delivered figures from first paint. */
    await mount();
    const figures = [...host.querySelectorAll("[data-figure]")].map((node) =>
      node.textContent?.trim(),
    );
    expect(figures).toEqual(proofRows.map((row) => row.figure));
  });

  test("no cell carries an entrance of its own", async () => {
    await mount();
    for (const cell of host.querySelectorAll("[data-proof-scrub] li")) {
      const element = cell as HTMLElement;
      expect(element.className).not.toMatch(/\bopacity-0\b/);
      expect(element.className).not.toMatch(/\btranslate-y-/);
      expect(element.getAttribute("style") ?? "").not.toContain("opacity");
    }
  });
});
