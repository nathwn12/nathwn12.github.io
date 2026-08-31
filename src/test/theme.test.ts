// @vitest-environment jsdom
import { beforeEach, beforeAll, describe, expect, it } from "vitest";
import {
  THEME_STORAGE_KEY,
  getTheme,
  setTheme,
  toggleTheme,
} from "../lib/theme";

/** Theme smoke test — mirrors src/lib/theme.ts behavior:
 *  setTheme flips <html data-theme> and persists to localStorage;
 *  toggleTheme returns the next theme.
 */
describe("theme", () => {
  beforeAll(() => {
    // jsdom may not drive rAF; setTheme schedules a 2-frame cleanup only.
    if (typeof globalThis.requestAnimationFrame !== "function") {
      globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
        setTimeout(() => cb(Date.now()), 16);
        return 0;
      }) as typeof requestAnimationFrame;
    }
  });

  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "dark";
  });

  it("setTheme('light') flips the dataset and persists to localStorage", () => {
    setTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(getTheme()).toBe("light");
  });

  it("toggleTheme returns the next theme and applies it", () => {
    document.documentElement.dataset.theme = "dark";
    expect(toggleTheme()).toBe("light");
    expect(getTheme()).toBe("light");

    expect(toggleTheme()).toBe("dark");
    expect(getTheme()).toBe("dark");
  });
});