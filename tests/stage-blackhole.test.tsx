// @vitest-environment jsdom
/**
 * The descent's contract: one field, five shells, one nav, and a designed
 * still for every path that cannot run the shader.
 *
 * Every assertion here goes red against the old measured-record stage, which
 * had no canvas, no still, no shared marker and no chapter transition.
 *
 *   bunx vitest run tests/stage-blackhole.test.tsx
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ChapterStage } from "../src/components/stage/ChapterStage";
import { proofRows } from "../src/content/ledger";

let host: HTMLDivElement;
let root: Root | null = null;

async function mount() {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(createElement(ChapterStage));
  });
}

function allowMotion() {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
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
  window.history.replaceState(null, "", "/");
  Element.prototype.scrollIntoView = vi.fn();
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
  delete (window as { matchMedia?: unknown }).matchMedia;
  delete (document as { startViewTransition?: unknown }).startViewTransition;
});

describe("the descent field", () => {
  test("one canvas and one designed still are always in the document", async () => {
    await mount();
    expect(host.querySelectorAll("canvas.bh-canvas")).toHaveLength(1);
    expect(host.querySelectorAll(".bh-still")).toHaveLength(1);
    expect(host.querySelectorAll(".bh-still__horizon")).toHaveLength(1);
    expect(host.querySelectorAll(".bh-dust__plane")).toHaveLength(3);
    // Without a GL context the still is the visible path, never a blank hero.
    expect(host.querySelector(".stage")?.getAttribute("data-bh")).toBe("still");
  });

  test("the stage keeps one nav, five shells and no gated chapter", async () => {
    await mount();
    expect(host.querySelectorAll("nav")).toHaveLength(1);
    expect(host.querySelectorAll(".stage-panel")).toHaveLength(5);
    expect(host.querySelectorAll(".stage-panel h1, .stage-panel h2")).toHaveLength(5);
    expect(host.querySelectorAll("[inert]")).toHaveLength(0);
    for (const panel of host.querySelectorAll(".stage-panel")) {
      expect(panel.getAttribute("aria-hidden")).toBeNull();
    }
  });

  test("the shared chapter marker is a single travelling element", async () => {
    await mount();
    expect(host.querySelectorAll(".stage-hud__marker")).toHaveLength(1);
    expect(host.querySelector(".stage-hud__index")?.textContent).toBe("01");
  });

  test("the singularity figure is the record's own reduction", async () => {
    await mount();
    expect(host.querySelector(".singularity__num")?.textContent).toBe(
      proofRows[0]?.figure,
    );
  });
});

describe("the chapter change", () => {
  test("a click uses the View Transitions path when the browser offers it", async () => {
    allowMotion();
    const transition = vi.fn((callback: () => void) => {
      callback();
      return { finished: Promise.resolve() };
    });
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: transition,
    });

    await mount();
    const link = host.querySelector<HTMLAnchorElement>(
      'a[data-chapter-link="work"]',
    );
    await act(async () => {
      link?.click();
    });

    expect(transition).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe("#work");
    expect(
      host.querySelector('a[data-chapter-link="work"]')?.getAttribute("aria-current"),
    ).toBe("true");
  });
});
