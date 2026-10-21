// @vitest-environment jsdom
/**
 * Hero strip gate — the printed tech strip in src/components/Hero.tsx.
 *
 *  1. While motion is allowed the strip renders the tech as one duplicated
 *     track (second half repeats the first) inside a full-bleed 3px-bounded
 *     band, set uppercase with claret bar separators — and offers NO
 *     pause/play/ticker control: by owner decision the
 *     hover/focus/hidden-tab hold is the whole gate.
 *  2. When the OS asks for reduced motion, the loop never starts: the strip
 *     renders as a static wrapping list with no mask, and still no control
 *     is offered (nothing to pause, no knob either way).
 *
 * Mounts the real Hero with the heavy bands stubbed out — this file owns the
 * strip and the absence of its control, not the atlas/proof/work sections.
 */
import { act, createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Hero } from "../src/components/Hero";

vi.mock("../src/components/SystemAtlas", () => ({
  SystemAtlas: () => null,
}));
vi.mock("../src/components/ProofBand", () => ({
  ProofBand: () => null,
  CredentialsStrip: () => null,
}));
vi.mock("../src/components/WorkTeaser", () => ({
  WorkTeaser: () => null,
}));
vi.mock("../src/components/PageFoot", () => ({
  PageFoot: () => null,
}));
vi.mock("../src/components/ExperienceBand", () => ({
  ExperienceBand: () => null,
}));
vi.mock("../src/components/ForwardBand", () => ({
  ForwardBand: () => null,
}));

let host: HTMLDivElement;
let root: Root | null = null;

function stubMatchMedia(matches: boolean) {
  const query = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue(query),
  );
  return query;
}

function stubObservers() {
  if (typeof window.IntersectionObserver === "undefined") {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  }
}

async function mount() {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(createElement(Hero));
  });
}

function pauseLikeControls(): Element[] {
  const controls = host.querySelectorAll(
    "button, a, input, select, textarea, [role='button']",
  );
  return Array.from(controls).filter((element) => {
    const name = (
      element.getAttribute("aria-label") ??
      element.textContent ??
      ""
    ).toLowerCase();
    return /pause|play|ticker/.test(name);
  });
}

function stripBand(): HTMLElement | null {
  const bands = Array.from(
    host.querySelectorAll<HTMLElement>("#hero div.overflow-hidden"),
  );
  return bands.find((band) => band.querySelector("ul") !== null) ?? null;
}

beforeEach(() => {
  stubObservers();
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

describe("printed strip", () => {
  it("renders the tech as one duplicated uppercase track with claret bars", async () => {
    stubMatchMedia(false);
    await mount();

    const band = stripBand();
    expect(band).not.toBeNull();
    expect(band!.className).toMatch(/border-y-\[3px\]/);
    const items = Array.from(band!.querySelectorAll("li"));
    expect(items.length).toBeGreaterThan(0);
    expect(items.length % 2).toBe(0);
    const half = items.length / 2;
    const first = items.slice(0, half).map((li) => li.textContent);
    const second = items.slice(half).map((li) => li.textContent);
    expect(second).toEqual(first);
    for (const item of items) {
      expect(item.className).toMatch(/strip-text/);
      expect(
        item.querySelector("span.bg-accent"),
        "each strip item carries its claret bar",
      ).not.toBeNull();
    }
    // The mask itself is a CSS property jsdom does not serialize, so the
    // gradient and the hold are asserted at the source — the behavior the
    // gate pins, not the engine's CSSOM.
    const source = readFileSync(
      resolve(import.meta.dirname, "..", "src/components/Hero.tsx"),
      "utf8",
    );
    expect(source).toMatch(/maskImage/);
    expect(source).toMatch(/linear-gradient\(to right, transparent/);
    expect(source).toMatch(/onMouseEnter/);
    expect(source).toMatch(/onFocus/);

    expect(pauseLikeControls()).toHaveLength(0);
  });

  it("stays static with no mask and no control under reduced motion", async () => {
    stubMatchMedia(true);
    await mount();

    const band = stripBand();
    expect(band).not.toBeNull();
    const track = band!.querySelector("ul");
    expect(track?.className).toContain("flex-wrap");
    expect(band!.querySelectorAll("li").length).toBeGreaterThan(0);
    expect(band!.style.maskImage).toBe("");

    expect(pauseLikeControls()).toHaveLength(0);
  });
});
