// @vitest-environment jsdom
/**
 * Motion preference — the persisted Auto / Animate / Reduce toggle.
 *
 * Covers the contract of src/lib/motionPreference.ts:
 *  - mapping: auto→"user", animate→"never", reduce→"always" (MotionConfig)
 *  - the boolean gate: an explicit override wins, auto follows the OS
 *  - persistence: default Animate on empty/corrupt storage, round-trip, cycle
 *  - first paint: the FIRST render already honours storage (no animate flash)
 *  - the resolved boolean drives the Hero typing loop (static under reduce,
 *    running under an animate override that beats a reduce-OS)
 *
 * Owner order 2026-10-14: a fresh visitor resolves to ANIMATE — motion runs
 * even when the OS reports prefers-reduced-motion — while Auto and Reduce stay
 * offered, selectable, and persisted as the reachable opt-out.
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MOTION_STORAGE_KEY,
  cycleMotionPreference,
  motionPreferenceToMode,
  resolveReduceMotion,
  setMotionPreference,
  storedMotionPreference,
  useMotionPreference,
  type MotionPreference,
} from "../lib/motionPreference";
import { HERO_PHRASES, useHeroTyping } from "../components/Hero";

const FIRST = HERO_PHRASES[0];

describe("motion preference — mapping", () => {
  it("maps auto→user, animate→never, reduce→always", () => {
    expect(motionPreferenceToMode("auto")).toBe("user");
    expect(motionPreferenceToMode("animate")).toBe("never");
    expect(motionPreferenceToMode("reduce")).toBe("always");
  });

  it("resolves the boolean gate: override wins, auto follows the OS", () => {
    expect(resolveReduceMotion("auto", false)).toBe(false);
    expect(resolveReduceMotion("auto", true)).toBe(true);
    expect(resolveReduceMotion("animate", true)).toBe(false);
    expect(resolveReduceMotion("reduce", false)).toBe(true);
    expect(resolveReduceMotion("reduce", true)).toBe(true);
  });
});

describe("motion preference — persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to animate on empty or unrecognized storage", () => {
    expect(storedMotionPreference()).toBe("animate");
    window.localStorage.setItem(MOTION_STORAGE_KEY, "wobble");
    expect(storedMotionPreference()).toBe("animate");
  });

  it("fresh visitor resolves animation even under a reduce-OS (owner case)", () => {
    expect(storedMotionPreference()).toBe("animate");
    expect(resolveReduceMotion(storedMotionPreference(), true)).toBe(false);
  });

  it("an explicit stored reduce resolves true and persists as the opt-out", () => {
    setMotionPreference("reduce");
    expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBe("reduce");
    expect(resolveReduceMotion(storedMotionPreference(), false)).toBe(true);
  });

  it("round-trips an explicit preference", () => {
    setMotionPreference("reduce");
    expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBe("reduce");
    expect(storedMotionPreference()).toBe("reduce");
  });

  it("cycles animate → reduce → auto → animate, persisting each step", () => {
    expect(storedMotionPreference()).toBe("animate");
    expect(cycleMotionPreference()).toBe("reduce");
    expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBe("reduce");
    expect(cycleMotionPreference()).toBe("auto");
    expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBe("auto");
    expect(cycleMotionPreference()).toBe("animate");
    expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBe("animate");
  });

  it("keeps all three states reachable through the cycle, each persisted", () => {
    const seen = new Set<MotionPreference>([storedMotionPreference()]);
    for (let step = 0; step < 3; step += 1) {
      const next = cycleMotionPreference();
      expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBe(next);
      seen.add(next);
    }
    expect([...seen].sort()).toEqual(["animate", "auto", "reduce"]);
  });
});

/** Records the preference passed to EVERY render, so the first frame is
 *  distinguishable from an effect-driven correction. */
const renders: MotionPreference[] = [];
let container: HTMLDivElement;
let root: Root;

function PreferenceProbe() {
  const [preference] = useMotionPreference();
  renders.push(preference);
  return createElement("output", { "data-testid": "pref" }, preference);
}

function probeText(testid: string): string {
  return container.querySelector(`[data-testid="${testid}"]`)?.textContent ?? "";
}

describe("useMotionPreference — first paint + sync", () => {
  beforeEach(() => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
    renders.length = 0;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("honours a stored preference on the FIRST render (no auto flash)", () => {
    window.localStorage.setItem(MOTION_STORAGE_KEY, "reduce");
    act(() => root.render(createElement(PreferenceProbe)));
    expect(renders[0]).toBe("reduce");
    expect(probeText("pref")).toBe("reduce");
  });

  it("defaults to animate on the first render when storage is empty", () => {
    act(() => root.render(createElement(PreferenceProbe)));
    expect(renders[0]).toBe("animate");
  });

  it("follows a same-tab broadcast", () => {
    act(() => root.render(createElement(PreferenceProbe)));
    expect(probeText("pref")).toBe("animate");
    act(() => setMotionPreference("reduce"));
    expect(probeText("pref")).toBe("reduce");
  });

  it("follows a cross-tab storage edit", () => {
    act(() => root.render(createElement(PreferenceProbe)));
    act(() => {
      window.localStorage.setItem(MOTION_STORAGE_KEY, "animate");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: MOTION_STORAGE_KEY,
          newValue: "animate",
        }),
      );
    });
    expect(probeText("pref")).toBe("animate");
  });
});

/** Drives the Hero typing loop from a raw preference + OS setting, exactly as
 *  Hero.tsx resolves them. */
function HeroGateProbe({
  preference,
  osReduced,
}: {
  preference: MotionPreference;
  osReduced: boolean;
}) {
  const { shown } = useHeroTyping(resolveReduceMotion(preference, osReduced));
  return createElement("p", { "data-testid": "hero" }, shown);
}

describe("hero gate under a resolved preference", () => {
  beforeEach(() => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it("reduce ⇒ static first phrase with zero timers, even on a motion-OS", () => {
    act(() =>
      root.render(
        createElement(HeroGateProbe, { preference: "reduce", osReduced: false }),
      ),
    );
    expect(probeText("hero")).toBe(FIRST);
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(120_000));
    expect(probeText("hero")).toBe(FIRST);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("animate override ⇒ the loop runs even when the OS reduces", () => {
    act(() =>
      root.render(
        createElement(HeroGateProbe, { preference: "animate", osReduced: true }),
      ),
    );
    expect(probeText("hero")).toBe(FIRST);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("a fresh visitor (no stored preference) animates under a reduce-OS", () => {
    window.localStorage.clear();
    expect(storedMotionPreference()).toBe("animate");
    /* Baseline-relative: getTimerCount is process-global, so compare the loop's
       beat against whatever the earlier cases left pending. */
    const idle = vi.getTimerCount();
    act(() =>
      root.render(
        createElement(HeroGateProbe, {
          preference: storedMotionPreference(),
          osReduced: true,
        }),
      ),
    );
    expect(probeText("hero")).toBe(FIRST);
    expect(vi.getTimerCount()).toBe(idle + 1);
  });
});
