// @vitest-environment jsdom
/**
 * Hero masthead guarantee — the landing opens on the nameplate, not the claim.
 *
 * The h1 is the owner's name at masthead scale (owner brief 2026-10-21):
 * this file asserts what the hero guarantees —
 *
 *  1. Exactly one h1, whose accessible name is the owner's name, wearing
 *     the masthead treatment.
 *  2. The typing loop survives as the deck: a paragraph whose accessible
 *     name is the opening hook (heroClaim), so first paint still carries
 *     the real claim, never an empty heading.
 *  3. No interactive control whose accessible name mentions pause/play/ticker
 *     exists in the hero — the strip holds on hover/focus/hidden-tab and
 *     offers no knob (owner decision).
 *
 * Mounts the real Hero with the heavy bands stubbed out — this file owns the
 * nameplate, the deck, and the absence of decoration controls, not the
 * atlas/proof/work sections.
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Hero } from "../src/components/Hero";
import { heroClaim } from "../src/content/hero";

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

describe("hero masthead", () => {
  it("renders exactly one h1: the nameplate", async () => {
    await mount();
    const headings = host.querySelectorAll("h1");
    expect(headings).toHaveLength(1);
    expect(headings[0]?.getAttribute("aria-label")).toBe(
      "Nathaniel Nikolai Ladero",
    );
    expect(headings[0]?.className).toMatch(/masthead-name/);
  });

  it("sets the typing loop as the deck named by the opening hook", async () => {
    await mount();
    expect(heroClaim).toBe(
      "Payment backends that hold up under production load.",
    );
    const deck = host.querySelector("p[aria-label]");
    expect(deck?.getAttribute("aria-label")).toBe(heroClaim);
  });

  it("offers no pause/play/ticker control anywhere in the hero", async () => {
    await mount();
    const controls = host.querySelectorAll(
      "button, a, input, select, textarea, [role='button']",
    );
    const named = Array.from(controls).filter((element) => {
      const name = (
        element.getAttribute("aria-label") ??
        element.textContent ??
        ""
      ).toLowerCase();
      return /pause|play|ticker/.test(name);
    });
    expect(named).toHaveLength(0);
  });
});
