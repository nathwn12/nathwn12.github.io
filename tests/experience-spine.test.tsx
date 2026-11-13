// @vitest-environment jsdom
/**
 * The experience band's one scrubbed spine.
 *
 * The band used to draw nine connectors and count nine figures as each entry
 * entered the viewport — a festival of small entrances. It is now one continuous
 * movement: a single fill element on the spine, scrubbed from the top of the
 * list to the bottom, and one sticky marker that reads the year of the entry at
 * the reading line. This file holds that shape, because it is the thing that can
 * quietly go back to nine little reveals.
 *
 *   bunx vitest run tests/experience-spine.test.tsx
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Experience } from "../src/components/Experience";
import { experience } from "../src/content/experience";

let host: HTMLDivElement;
let root: Root | null = null;

beforeEach(async () => {
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
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(createElement(Experience));
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

describe("one fill, one marker", () => {
  test("the spine has exactly one fill element", () => {
    expect(host.querySelectorAll("[data-spine-fill]")).toHaveLength(1);
  });

  test("no entry draws its own connector any more", () => {
    /* The nine connectors were the festival: each entry animated itself in.
       One fill replaces all of them. */
    expect(host.querySelectorAll("[data-timeline-connector]")).toHaveLength(0);
  });

  test("there is exactly one sticky year marker, and it names a year", () => {
    const markers = host.querySelectorAll("[data-year-marker]");
    expect(markers).toHaveLength(1);
    expect(markers[0].className).toContain("sticky");
    expect(markers[0].textContent?.trim()).toMatch(/^\d{4}$/);
    /* It names one of the dated records' years — never an invented one. The
       entry it names is derived from live layout, which jsdom does not lay out;
       the derivation itself is pinned in tests/project-readout.test.tsx. */
    const years = experience.map((entry) => entry.date.match(/\d{4}/)![0]);
    expect(years).toContain(markers[0].textContent?.trim());
  });
});

describe("no per-entry entrance", () => {
  test("every entry renders its final figure and an untransformed heading", () => {
    const entries = [...host.querySelectorAll<HTMLElement>("[data-timeline-entry]")];
    expect(entries).toHaveLength(experience.length);

    for (const entry of entries) {
      const heading = entry.querySelector<HTMLElement>("[data-timeline-heading]");
      expect(heading, "an entry lost its outcome heading").not.toBeNull();
      /* A split heading is a line-masked reveal; a transform is a start state.
         Neither belongs on a row in this band. */
      expect(heading!.getAttribute("style") ?? "").not.toContain("transform");
      expect(heading!.querySelectorAll(".rec-line")).toHaveLength(0);

      const figure = entry.querySelector<HTMLElement>("[data-timeline-figure]");
      if (figure) {
        /* The delivered value is in the DOM at first paint — nothing is counted
           up from zero and no start state is left on it. */
        expect(figure.textContent?.trim()).not.toBe("");
        expect(figure.getAttribute("style") ?? "").not.toContain("opacity");
      }
    }
  });
});
