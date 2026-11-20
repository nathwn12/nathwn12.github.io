// @vitest-environment jsdom
/**
 * A shared chapter link opens on its chapter.
 *
 * The browser fires its native hash jump before React has mounted the panels,
 * so a plain document cannot honour /#work on its own. The stage jumps once
 * after mount through the project's one scroller; with motion off that scroller
 * is the native one. This test fails if that mount jump is removed.
 *
 *   bunx vitest run tests/deep-link.test.tsx
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const scrollTo = vi.hoisted(() => vi.fn());
vi.mock("../src/lib/smooth", () => ({
  scrollTo,
  getLenis: () => null,
  useSmoothScroll: () => undefined,
  setMotionEnabled: () => undefined,
}));

import { ChapterStage } from "../src/components/stage/ChapterStage";

let host: HTMLDivElement;
let root: Root | null = null;

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
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => undefined);
  scrollTo.mockClear();
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
  window.history.replaceState(null, "", "/");
});

describe("a shared chapter link", () => {
  test("jumps to the linked panel once the panels exist", async () => {
    window.history.replaceState(null, "", "/#work");
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(ChapterStage));
    });

    expect(scrollTo).toHaveBeenCalled();
    const landed = scrollTo.mock.calls.some(
      (call) => (call[0] as HTMLElement).id === "work" && call[1]?.immediate === true,
    );
    expect(landed, "the work panel was never the jump target").toBe(true);
  });

  test("an unknown hash leaves the page where it opened", async () => {
    window.history.replaceState(null, "", "/#not-a-chapter");
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(ChapterStage));
    });

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
