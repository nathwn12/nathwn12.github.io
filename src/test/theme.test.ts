// @vitest-environment jsdom
/**
 * Theme — the light/dark contract of src/lib/theme.ts.
 *
 * Owner order 2026-10-14 retired "auto": the preference space is the two
 * schemes, the footer cycle is light ↔ dark, and an UNPINNED visitor (nothing
 * stored, or a retired/unrecognized value such as "auto") starts on the OS
 * scheme — the same resolution index.html's pre-paint script applies, pinned
 * against the real script by tests/theme-prepaint.test.ts.
 *
 * jsdom has no matchMedia, so the media list is stubbed here: `matches` is a live
 * getter and every registered change listener is captured so a test can simulate
 * the OS flipping scheme mid-session. The subscription lives in useTheme, so the
 * follow/pin tests mount a probe component.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  THEME_COLORS,
  THEME_STORAGE_KEY,
  cycleTheme,
  getTheme,
  setTheme,
  storedPin,
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

describe("theme — light / dark only", () => {
  it("setTheme pins a scheme: the dataset flips and storage holds the pin", () => {
    setTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(getTheme()).toBe("light");

    setTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(getTheme()).toBe("dark");
  });

  it("cycleTheme walks light → dark → light, applying + persisting each step", () => {
    /* Nothing stored and the OS is light, so the walk starts from light. */
    expect(storedPreference()).toBe("light");

    expect(cycleTheme()).toBe("dark");
    expect(storedPin()).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");

    expect(cycleTheme()).toBe("light");
    expect(storedPin()).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("storedPin() is null for an absent, unrecognized, or retired value", () => {
    expect(storedPin()).toBeNull();

    window.localStorage.setItem(THEME_STORAGE_KEY, "solarized");
    expect(storedPin()).toBeNull();

    /* The retired tri-state value: not a pin, so it must not survive as one. */
    window.localStorage.setItem(THEME_STORAGE_KEY, "auto");
    expect(storedPin()).toBeNull();
  });

  it("storedPreference() is the pin when there is one, the OS scheme otherwise", () => {
    /* Unpinned: the OS decides, and the value is a concrete scheme. */
    expect(storedPreference()).toBe("light");
    systemDark = true;
    expect(storedPreference()).toBe("dark");

    /* Pinned: the pin wins over the OS. */
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(storedPreference()).toBe("light");

    /* Never the retired value, in any state. */
    for (const stored of [null, "auto", "solarized", "light", "dark"]) {
      if (stored === null) window.localStorage.clear();
      else window.localStorage.setItem(THEME_STORAGE_KEY, stored);
      for (const osDark of [false, true]) {
        systemDark = osDark;
        expect(["light", "dark"]).toContain(storedPreference());
      }
    }
  });

  it("systemTheme() reads the OS scheme", () => {
    systemDark = true;
    expect(systemTheme()).toBe("dark");
    systemDark = false;
    expect(systemTheme()).toBe("light");
  });
});

describe("useTheme — mount reconcile + following the OS", () => {
  it("reconciles the applied scheme on mount when the pre-paint script disagreed", () => {
    /* Storage-throw scenario: the pre-paint script landed on light, but this
       layer resolves the dark OS (no stored pin). Only a mount reconcile can fix
       the DOM here — no event has fired yet. */
    systemDark = true;
    document.documentElement.dataset.theme = "light";

    mountProbe();

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(getTheme()).toBe("dark");
    /* Reconciling the OS scheme must NOT pin it: an unpinned visitor keeps
       following the OS. */
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("mount reconciliation is a no-op when the DOM already matches", () => {
    /* Agreement ⇒ sync() must not repaint ⇒ no .theme-flip on a normal page
       load. Cleared first so a leaked class from a prior test can't mask it. */
    document.documentElement.classList.remove("theme-flip");
    document.documentElement.dataset.theme = "light";

    mountProbe();

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.classList.contains("theme-flip")).toBe(false);
  });

  it("an unpinned visitor follows a simulated OS flip and stays unpinned", () => {
    mountProbe();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(storedPin()).toBeNull();

    act(() => setSystemDark(true));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(storedPin()).toBeNull();

    act(() => setSystemDark(false));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(storedPin()).toBeNull();
  });

  it("an explicit pin ignores a simulated OS flip", () => {
    mountProbe();

    act(() => setTheme("light"));
    act(() => setSystemDark(true));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(storedPin()).toBe("light");

    act(() => setTheme("dark"));
    act(() => setSystemDark(false));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(storedPin()).toBe("dark");
  });

  it("falls back to the legacy addListener API when addEventListener is missing", () => {
    legacyMedia = true;
    mountProbe();

    act(() => setSystemDark(true));
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("picks up a cross-tab pin from the storage event", () => {
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
    expect(storedPin()).toBe("dark");
  });
});

describe("theme-color — mobile browser chrome follows the resolved scheme", () => {
  const LIGHT_GROUND = "#F2F1EC";
  const DARK_GROUND = "#101315";

  /** The shipped meta pair, rebuilt in jsdom (which parses no index.html). */
  function seedThemeColorMetas() {
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) => meta.remove());
    for (const [media, content] of [
      ["(prefers-color-scheme: light)", LIGHT_GROUND],
      ["(prefers-color-scheme: dark)", DARK_GROUND],
    ] as const) {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.setAttribute("media", media);
      meta.setAttribute("content", content);
      document.head.appendChild(meta);
    }
  }

  function themeColorContents(): string[] {
    return [...document.querySelectorAll('meta[name="theme-color"]')].map(
      (meta) => meta.getAttribute("content") ?? "",
    );
  }

  beforeEach(seedThemeColorMetas);
  afterEach(() => {
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) => meta.remove());
  });

  it("mirrors --color-bg from the shipped CSS in both schemes", () => {
    /* A hex is stated twice — once in CSS, once for the meta tag. Reading the
       stylesheet here makes a palette edit break this test instead of silently
       leaving the browser chrome on the old ground. */
    const root = resolve(import.meta.dirname, "..", "..");
    const css = readFileSync(resolve(root, "src", "index.css"), "utf8");
    const lightBlock = css.slice(
      css.indexOf("@theme {"),
      css.indexOf("\n}\n", css.indexOf("@theme {")),
    );
    const darkBlock = css.slice(
      css.indexOf('html[data-theme="dark"] {'),
      css.indexOf("\n}\n", css.indexOf('html[data-theme="dark"] {')),
    );
    const bg = (block: string) =>
      block.match(/--color-bg:\s*(#[0-9a-f]{6})/i)?.[1].toUpperCase();

    expect(bg(lightBlock)).toBe(THEME_COLORS.light);
    expect(bg(darkBlock)).toBe(THEME_COLORS.dark);
  });

  it("a stored pin rewrites both entries, even when the OS disagrees", () => {
    systemDark = true;
    act(() => setTheme("light"));
    expect(themeColorContents()).toEqual([LIGHT_GROUND, LIGHT_GROUND]);

    systemDark = false;
    act(() => setTheme("dark"));
    expect(themeColorContents()).toEqual([DARK_GROUND, DARK_GROUND]);
  });

  it("reconciles a stale pair on mount even when <html> already agrees", () => {
    /* Cached HTML / a prepaint read that disagreed: the page is dark, the
       metas still follow a light OS. Only an unconditional meta reconcile on
       mount repairs it; a DOM-diff-only sync would leave the chrome light. */
    systemDark = true;
    document.documentElement.dataset.theme = "dark";
    seedThemeColorMetas(); // light pair, as a light-OS fallback would ship
    expect(themeColorContents()).toEqual([LIGHT_GROUND, DARK_GROUND]);

    mountProbe();

    expect(themeColorContents()).toEqual([DARK_GROUND, DARK_GROUND]);
    expect(storedPin()).toBeNull();
  });

  it("an unpinned OS flip moves the chrome colour with the page", () => {
    mountProbe();
    expect(themeColorContents()).toEqual([LIGHT_GROUND, LIGHT_GROUND]);

    act(() => setSystemDark(true));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(themeColorContents()).toEqual([DARK_GROUND, DARK_GROUND]);

    act(() => setSystemDark(false));
    expect(themeColorContents()).toEqual([LIGHT_GROUND, LIGHT_GROUND]);
  });

  it('a stored "auto" follows the OS flip live and is left as stored', () => {
    /* Case 5 with the retired value present: "auto" is not a pin, so the
       listener must treat it exactly like absent storage — update the page and
       the chrome colour, without rewriting what the visitor's browser holds. */
    window.localStorage.setItem(THEME_STORAGE_KEY, "auto");
    mountProbe();
    expect(themeColorContents()).toEqual([LIGHT_GROUND, LIGHT_GROUND]);

    act(() => setSystemDark(true));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(themeColorContents()).toEqual([DARK_GROUND, DARK_GROUND]);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("auto");
  });

  it("a pinned visitor's OS flip moves neither the page nor the chrome colour", () => {
    mountProbe();
    act(() => setTheme("light"));

    act(() => setSystemDark(true));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(themeColorContents()).toEqual([LIGHT_GROUND, LIGHT_GROUND]);
    expect(storedPin()).toBe("light");
  });
});

describe("theme — failure paths", () => {
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
    expect(storedPreference()).toBe("light");
  });

  it("storedPreference() falls back to the OS scheme when storage reads throw", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    /* Guard: the stub must actually intercept, or the assertions below pass
       vacuously (jsdom routes Storage calls through a proxy). */
    expect(() => window.localStorage.getItem(THEME_STORAGE_KEY)).toThrow();
    expect(() => storedPin()).not.toThrow();
    expect(storedPin()).toBeNull();

    systemDark = true;
    expect(() => storedPreference()).not.toThrow();
    expect(storedPreference()).toBe("dark");
  });

  it("a pin whose write was dropped survives the session and outranks a stale stored pin", () => {
    /* M1 regression pin: setTheme broadcasts THEME_CHANGE_EVENT after writing,
       so a listener that re-derives the pin from storage alone would read the
       STALE stored value here and revert the visitor's choice. The write is
       stubbed to throw BEFORE the mount so no reconciliation write can land. */
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    const write = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    /* Guard: the write stub must actually intercept (see the proxy note above). */
    expect(() =>
      window.localStorage.setItem(THEME_STORAGE_KEY, "dark"),
    ).toThrow();

    mountProbe();

    expect(() => {
      act(() => setTheme("dark"));
    }).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(getTheme()).toBe("dark");
    /* The dropped write outranks storage, which still holds the older pin. */
    expect(storedPreference()).toBe("dark");

    /* The OS flips both ways: a pinned visitor must ignore both, and the
       broadcast listener must still see "dark" rather than re-deriving. */
    act(() => setSystemDark(true));
    expect(document.documentElement.dataset.theme).toBe("dark");
    act(() => setSystemDark(false));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(storedPreference()).toBe("dark");

    /* Retire the in-memory mirror with a write that lands, so the test is
       order-independent. */
    write.mockRestore();
    act(() => setTheme("light"));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });
});
