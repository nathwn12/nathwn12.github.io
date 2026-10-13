// @vitest-environment jsdom
/**
 * Motion — the always-animated contract of src/lib/motionPreference.ts.
 *
 * Owner order 2026-10-14 retired the tri-state Auto / Animate / Reduce
 * preference, its storage key, its change event, and the footer toggle: the OS
 * `prefers-reduced-motion` query no longer gates this site, so the animated path
 * is the only path. This file pins that, INCLUDING under an OS that reports
 * reduce — the case the retired preference existed to serve, and the case that
 * left the atlas pulses unrendered and the seam standing still.
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  motionPreferenceToMode,
  resolveReduceMotion,
  useMotionPreference,
  useResolvedReduceMotion,
} from "../lib/motionPreference";

/** Stand-in MediaQueryList; `reduced` decides what the OS reports. Nothing in
 *  src/lib/motionPreference.ts reads it — the stub is here so a regression that
 *  reintroduces the OS read fails against a REAL reduce request. */
function media(reduced: boolean): typeof window.matchMedia {
  return ((query: string) =>
    ({
      matches: reduced && query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
}

describe("motion — always animated", () => {
  beforeEach(() => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    window.matchMedia = media(true);
  });

  it('maps the one intent to Framer\'s "never" — animate regardless of the OS', () => {
    expect(motionPreferenceToMode("animate")).toBe("never");
  });

  it("resolves no reduction, whatever the OS reports", () => {
    expect(resolveReduceMotion("animate", false)).toBe(false);
    expect(resolveReduceMotion("animate", true)).toBe(false);
  });

  it("reads the retired preference as a constant", () => {
    expect(useMotionPreference()).toEqual(["animate"]);
  });

  it("exposes no way to reduce motion: the retired surface is gone", async () => {
    /* A regression that reintroduces storage or a cycle — and with them a gate a
       visitor can switch — fails here rather than silently returning to a page
       that stands still. */
    const module = await import("../lib/motionPreference");
    expect(Object.keys(module).sort()).toEqual([
      "motionPreferenceToMode",
      "resolveReduceMotion",
      "useMotionPreference",
      "useResolvedReduceMotion",
    ]);
  });
});

let container: HTMLDivElement;
let root: Root;

/** Renders the gate every component in the tree reads. */
function GateProbe() {
  const reduce = useResolvedReduceMotion();
  return createElement("output", { "data-testid": "gate" }, String(reduce));
}

function probeText(): string {
  return container.querySelector('[data-testid="gate"]')?.textContent ?? "";
}

describe("useResolvedReduceMotion — the gate every component reads", () => {
  beforeEach(() => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("is false on a motion-permitting OS", () => {
    window.matchMedia = media(false);
    act(() => root.render(createElement(GateProbe)));
    expect(probeText()).toBe("false");
  });

  it("is still false on an OS that reports prefers-reduced-motion", () => {
    window.matchMedia = media(true);
    act(() => root.render(createElement(GateProbe)));
    /* The OS really is asking for less motion in this case... */
    expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(
      true,
    );
    /* ...and the gate animates anyway (owner order 2026-10-14). */
    expect(probeText()).toBe("false");
  });
});
