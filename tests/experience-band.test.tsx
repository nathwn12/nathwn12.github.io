// @vitest-environment jsdom
/**
 * ExperienceBand live behaviour — labels, single tenure line, no doubled figures.
 *
 * The rail carries domain labels, never dates: the four rows read Payments,
 * Data access, Security, Delivery in that order, plus a Record row holding
 * the Full record link. The tenure (employer.period) is stated once above
 * the rail. The payments headline figure appears exactly once (the supporting
 * sentence is the entry's `description`, which carries no percentage), and
 * the delivery row renders the provenance line only, so `1,182` appears
 * exactly once. Every count below can go red.
 *
 *   pnpm vitest run tests/experience-band.test.tsx
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ExperienceBand } from "../src/components/ExperienceBand";
import { employer, experience } from "../src/content/experience";

let host: HTMLDivElement;
let root: Root | null = null;

beforeEach(async () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  // jsdom has no IntersectionObserver, which framer-motion's whileInView
  // needs at mount — a harness workaround, not component logic.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(createElement(ExperienceBand));
  });
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

/** Occurrences of `needle` inside the band's rendered text. */
function countInBand(needle: string): number {
  const text = host.textContent ?? "";
  return text.split(needle).length - 1;
}

describe("experience band", () => {
  test("the four rail labels render in order Payments, Data access, Security, Delivery", () => {
    const rows = Array.from(host.querySelectorAll("ol > li"));
    expect(rows.length).toBe(5);
    const labels = rows
      .slice(0, 4)
      .map((li) => li.querySelector("p")?.textContent?.trim());
    expect(labels).toEqual([
      "Payments",
      "Data access",
      "Security",
      "Delivery",
    ]);
  });

  test("the tenure line contains employer.period exactly once in the band", () => {
    expect(countInBand(employer.period)).toBe(1);
  });

  test("the payments headline figure appears exactly once, never repeated", () => {
    const payments = experience.find((entry) => entry.id === "02");
    if (!payments) throw new Error("missing experience entry id 02");
    const figure = payments.outcome.match(/\d[\d,]*(?:\.\d+)?%/);
    if (!figure) throw new Error("payments outcome carries no figure");
    expect(countInBand(figure[0])).toBe(1);
  });

  test("the delivery number 1,182 appears exactly once", () => {
    expect(countInBand("1,182")).toBe(1);
  });
});
