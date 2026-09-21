// @vitest-environment jsdom
/**
 * Theme preference tests — mirrors src/lib/theme.ts behavior:
 *  - "auto" follows the OS scheme; an explicit light/dark pins it
 *  - setTheme persists the PREFERENCE while <html data-theme> holds the RESOLVED theme
 *  - cycleTheme walks auto → light → dark → auto
 *
 * jsdom has no matchMedia, so the media list is stubbed here: `matches` is a live
 * getter and every registered change listener is captured so a test can simulate
 * the OS flipping scheme mid-session. The subscription lives in useTheme, so the
 * follow/pin tests mount a probe component.
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  cycleTheme,
  getTheme,
  resolveTheme,
  setTheme,
  storedPreference,
  systemTheme,
  useTheme,
} from "../lib/theme";

let systemDark = false;
let legacyMedia = false;
const changeHandlers = new Set<() => void>();

/** Stand-in MediaQueryList: live `matches`, captured change listeners. */
function mediaQueryList(query: string): MediaQueryList {
  const list = {
    get matches() {
      return systemDark;
    },
    media: query,
    onchange: null,
    addListener: (handler: () => void) => {
      changeHandlers.add(handler);
    },
    removeListener: (handler: () => void) => {
      changeHandlers.delete(handler);
    },
    dispatchEvent: () => false,
    ...(legacyMedia
      ? {}
      : {
          addEventListener: (_type: string, handler: () => void) => {
            changeHandlers.add(handler);
          },
          removeEventListener: (_type: string, handler: () => void) => {
            changeHandlers.delete(handler);
          },
        }),
  };
  return list as unknown as MediaQueryList;
}

/** Flip the simulated OS scheme and notify every registered change listener. */
function setSystemDark(next: boolean) {
  systemDark = next;
  [...changeHandlers].forEach((handler) => handler());
}

let container: HTMLDivElement | null = null;
let root: Root | null = null;

/** Mounts only to arm useTheme's listeners; it renders nothing. */
function Probe() {
  useTheme();
  return null;
}

function mountProbe() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const created = createRoot(host);
  container = host;
  root = created;
  act(() => {
    created.render(createElement(Probe));
  });
}

describe("theme", () => {
  beforeAll(() => {
    // jsdom may not drive rAF; setTheme schedules a 2-frame cleanup only.
    if (typeof globalThis.requestAnimationFrame !== "function") {
      globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
        setTimeout(() => cb(Date.now()), 16);
        return 0;
      }) as typeof requestAnimationFrame;
    }
    window.matchMedia = mediaQueryList;
  });

  beforeEach(() => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
    document.documentElement.dataset.theme = "light";
    systemDark = false;
    legacyMedia = false;
    changeHandlers.clear();
  });

  afterEach(() => {
    const mountedRoot = root;
    const mountedContainer = container;
    if (mountedRoot && mountedContainer) {
      act(() => mountedRoot.unmount());
      mountedContainer.remove();
    }
    root = null;
    container = null;
    /* Undo per-test storage spies and the throwing matchMedia probe. */
    vi.restoreAllMocks();
    window.matchMedia = mediaQueryList;
  });

  it("setTheme('light') flips the dataset and persists the preference", () => {
    setTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(getTheme()).toBe("light");
  });

  it("cycleTheme walks auto → light → dark → auto, applying + persisting each step", () => {
    expect(storedPreference()).toBe("auto");

    expect(cycleTheme()).toBe("light");
    expect(storedPreference()).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");

    expect(cycleTheme()).toBe("dark");
    expect(storedPreference()).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");

    expect(cycleTheme()).toBe("auto");
    expect(storedPreference()).toBe("auto");
    expect(document.documentElement.dataset.theme).toBe("light"); // OS is light
  });

  it("treats a missing or unrecognized stored value as auto", () => {
    expect(storedPreference()).toBe("auto");
    window.localStorage.setItem(THEME_STORAGE_KEY, "solarized");
    expect(storedPreference()).toBe("auto");
  });

  it("auto resolves to the system value", () => {
    systemDark = true;
    expect(systemTheme()).toBe("dark");
    expect(resolveTheme("auto")).toBe("dark");

    systemDark = false;
    expect(systemTheme()).toBe("light");
    expect(resolveTheme("auto")).toBe("light");

    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("light")).toBe("light");
  });

  it("setTheme('auto') persists 'auto' while data-theme holds the resolved value", () => {
    setTheme("auto");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("auto");
    expect(document.documentElement.dataset.theme).toBe("light");

    systemDark = true;
    setTheme("auto");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("auto");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(getTheme()).toBe("dark");
  });

  it("auto follows a simulated system flip", () => {
    setTheme("auto");
    mountProbe();
    expect(document.documentElement.dataset.theme).toBe("light");

    act(() => setSystemDark(true));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("auto");

    act(() => setSystemDark(false));
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("reconciles the applied theme on mount when the pre-paint script disagreed", () => {
    /* Storage-throw scenario: the pre-paint script landed on light, but this
       layer resolves "auto" (no stored preference) against a dark OS. Only a
       mount reconcile can fix the DOM here — no event has fired yet. */
    systemDark = true;
    document.documentElement.dataset.theme = "light";

    mountProbe();

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(getTheme()).toBe("dark");
    expect(storedPreference()).toBe("auto");
  });

  it("mount reconciliation is a no-op when the DOM already matches", () => {
    /* Agreement ⇒ sync() must not call setTheme ⇒ no .theme-flip on a normal
       page load. Cleared first so a leaked class from a prior test can't mask it. */
    document.documentElement.classList.remove("theme-flip");
    document.documentElement.dataset.theme = "light";

    mountProbe();

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.classList.contains("theme-flip")).toBe(false);
  });

  it("an explicit light/dark pin ignores a simulated system flip", () => {
    mountProbe();

    act(() => setTheme("light"));
    act(() => setSystemDark(true));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(storedPreference()).toBe("light");

    act(() => setTheme("dark"));
    act(() => setSystemDark(false));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(storedPreference()).toBe("dark");
  });

  it("falls back to the legacy addListener API when addEventListener is missing", () => {
    legacyMedia = true;
    mountProbe();
    act(() => setTheme("auto"));

    act(() => setSystemDark(true));
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("picks up a cross-tab preference change from the storage event", () => {
    mountProbe();
    expect(document.documentElement.dataset.theme).toBe("light");

    act(() => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: THEME_STORAGE_KEY,
          newValue: "dark",
        }),
      );
    });

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(storedPreference()).toBe("dark");
  });

  it("systemTheme() degrades to light when matchMedia throws", () => {
    window.matchMedia = (() => {
      throw new Error("matchMedia blocked");
    }) as typeof window.matchMedia;

    expect(() => systemTheme()).not.toThrow();
    expect(systemTheme()).toBe("light");

    /* The mount effect probes matchMedia too — an uncaught throw there would
       unmount the tree under StrictMode, so mounting must also survive. */
    expect(() => mountProbe()).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(getTheme()).toBe("light");
  });

  it("storedPreference() falls back to auto when storage reads throw", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    /* Guard: the stub must actually intercept, or the assertions below pass
       vacuously (jsdom routes Storage calls through a proxy). */
    expect(() => window.localStorage.getItem(THEME_STORAGE_KEY)).toThrow();
    expect(() => storedPreference()).not.toThrow();
    expect(storedPreference()).toBe("auto");
  });

  it("an explicit pin survives a storage write failure", () => {
    /* M1 regression pin: setTheme broadcasts THEME_CHANGE_EVENT after writing,
       so a sync that re-derives the preference from storage alone would read
       "auto" here and revert the pin. The write is stubbed to throw BEFORE the
       mount so no reconciliation write can land a stored preference. */
    const write = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    /* Guard: the write stub must actually intercept (see the proxy note above). */
    expect(() =>
      window.localStorage.setItem(THEME_STORAGE_KEY, "light"),
    ).toThrow();

    mountProbe();

    expect(() => {
      act(() => setTheme("dark"));
    }).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(getTheme()).toBe("dark");
    expect(storedPreference()).toBe("dark");

    /* The system flips dark, then to light: a pinned preference must ignore
       both, and the broadcast listener must still see "dark" rather than
       re-deriving "auto" from storage. */
    act(() => setSystemDark(true));
    expect(document.documentElement.dataset.theme).toBe("dark");
    act(() => setSystemDark(false));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(storedPreference()).toBe("dark");

    /* Retire the in-memory pin so the test is order-independent. */
    write.mockRestore();
    act(() => setTheme("auto"));
  });
});
