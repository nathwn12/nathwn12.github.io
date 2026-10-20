// @vitest-environment jsdom
/**
 * Hero ticker motion gate (WCAG 2.2.2) — the tech-strip seam in
 * src/components/Hero.tsx.
 *
 *  1. By default the seam offers a native pause toggle: a button named
 *     "Pause ticker" with `aria-pressed="false"` that flips to "Play ticker"
 *     / `aria-pressed="true"` when pressed.
 *  2. When the OS asks for reduced motion, the loop never starts: the strip
 *     renders static and no pause control is offered (nothing to pause).
 *
 * Mounts the real Hero with the heavy bands stubbed out — this file owns the
 * seam and its control, not the atlas/proof/work sections.
 */
import { act, createElement } from "react";
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

function pauseButton(): HTMLButtonElement | null {
  return host.querySelector("button");
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

describe("ticker pause control", () => {
  it("offers a Pause ticker toggle that flips pressed state and label", async () => {
    stubMatchMedia(false);
    await mount();

    const button = pauseButton();
    expect(button?.textContent).toBe("Pause ticker");
    expect(button?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const after = pauseButton();
    expect(after?.textContent).toBe("Play ticker");
    expect(after?.getAttribute("aria-pressed")).toBe("true");
  });

  it("stays static with no pause control when the OS asks for reduced motion", async () => {
    stubMatchMedia(true);
    await mount();

    expect(pauseButton()).toBeNull();
  });
});
