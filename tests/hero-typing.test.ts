// @vitest-environment jsdom
/**
 * Hero typing rotation — the h1 cycling the owner's identities.
 *
 * Two layers, both deterministic:
 *  1. The pure state machine (src/components/Hero.tsx: nextTypingState /
 *     typingDelayMs / initialTypingState) — driven step by step, no timers.
 *  2. useHeroTyping — the loop itself, mounted on a bare probe with fake
 *     timers: it advances through the cadence, keeps animating even when the OS
 *     asks for less motion (owner order 2026-10-14 — there is no reduced state
 *     to opt out to), and clears its timer on unmount.
 *
 * The probe renders no framer-motion nodes, so the scheduled-timer count is
 * the hook's alone.
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HERO_PHRASES,
  TYPING_CADENCE,
  initialTypingState,
  nextTypingState,
  typingDelayMs,
  useHeroTyping,
  type TypingState,
} from "../src/components/Hero";

const FIRST = HERO_PHRASES[0];
const FIRST_LEN = FIRST.length;

/** Deterministic LCG so bag order is reproducible across runs (a stub rng). */
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

/** Step from a fully-deleted phrase to the one the bag draws next, carrying
    the bag forward. */
function advance(state: TypingState, rng?: () => number): TypingState {
  return nextTypingState(
    {
      phraseIndex: state.phraseIndex,
      charCount: 0,
      deleting: true,
      bag: state.bag,
    },
    HERO_PHRASES,
    rng,
  );
}

describe("hero identities", () => {
  it("keeps the opening hook as the first (static default) identity", () => {
    expect(FIRST).toBe("Payment backends that hold up under production load.");
  });

  it("rotates four distinct identities stating what the owner is", () => {
    expect(HERO_PHRASES).toHaveLength(4);
    expect(new Set(HERO_PHRASES).size).toBe(4);
    const joined = HERO_PHRASES.join(" | ").toLowerCase();
    expect(joined).toContain("backend developer");
    expect(joined).toContain("fintech");
    expect(joined).toContain("ai-equipped");
  });

  it("opens on the hook: phrase 0, fully typed, no bag (opens every visit)", () => {
    expect(initialTypingState()).toEqual({
      phraseIndex: 0,
      charCount: FIRST_LEN,
      deleting: false,
    });
  });
});

describe("nextTypingState — deterministic cycle", () => {
  it("types forward one character at a time", () => {
    expect(nextTypingState({ phraseIndex: 0, charCount: 0, deleting: false })).toEqual(
      { phraseIndex: 0, charCount: 1, deleting: false },
    );
  });

  it("holds a finished phrase, then begins deleting", () => {
    expect(
      nextTypingState({ phraseIndex: 0, charCount: FIRST_LEN, deleting: false }),
    ).toEqual({ phraseIndex: 0, charCount: FIRST_LEN, deleting: true });
  });

  it("deletes one character at a time", () => {
    expect(
      nextTypingState({ phraseIndex: 0, charCount: FIRST_LEN, deleting: true }),
    ).toEqual({ phraseIndex: 0, charCount: FIRST_LEN - 1, deleting: true });
  });

  it("draws the next phrase from the shuffled bag once fully deleted", () => {
    const next = nextTypingState(
      { phraseIndex: 0, charCount: 0, deleting: true },
      HERO_PHRASES,
      seededRng(3),
    );
    expect(next.deleting).toBe(false);
    expect(next.charCount).toBe(0);
    expect(next.phraseIndex).toBeGreaterThanOrEqual(1);
    expect(next.phraseIndex).toBeLessThan(HERO_PHRASES.length);
    expect(next.bag).toHaveLength(HERO_PHRASES.length - 2);
  });

  it("never redraws the opening hook once the rotation begins", () => {
    const next = nextTypingState(
      { phraseIndex: 3, charCount: 0, deleting: true },
      HERO_PHRASES,
      seededRng(5),
    );
    expect(next.phraseIndex).not.toBe(0);
  });

  it("reaches a non-opening identity fully deleted after hold + deletes + gap", () => {
    const rng = seededRng(13);
    let state: TypingState = initialTypingState();
    for (let i = 0; i < 1 + FIRST_LEN + 1; i += 1) {
      state = nextTypingState(state, HERO_PHRASES, rng);
    }
    expect(state.deleting).toBe(false);
    expect(state.charCount).toBe(0);
    expect(state.phraseIndex).toBeGreaterThanOrEqual(1);
  });
});

describe("opener + shuffled bag ordering", () => {
  it("(a) opens on the hook — index 0, fully typed, every visit", () => {
    for (let paint = 0; paint < 3; paint += 1) {
      const state = initialTypingState();
      expect(state.phraseIndex).toBe(0);
      expect(state.charCount).toBe(FIRST_LEN);
    }
  });

  it("(b) two consecutive cycles never repeat a phrase", () => {
    const rng = seededRng(7);
    let state: TypingState = initialTypingState();
    let previous = state.phraseIndex;
    for (let i = 0; i < 12; i += 1) {
      state = advance(state, rng);
      expect(state.phraseIndex).not.toBe(previous);
      previous = state.phraseIndex;
    }
  });

  it("(c) a cycle covers every remaining phrase before any repeat", () => {
    const rng = seededRng(11);
    const seen: number[] = [];
    let state: TypingState = initialTypingState();
    for (let i = 0; i < HERO_PHRASES.length - 1; i += 1) {
      state = advance(state, rng);
      seen.push(state.phraseIndex);
    }
    expect(new Set(seen).size).toBe(HERO_PHRASES.length - 1);
    expect(seen).not.toContain(0);

    // The bag refills only after every remaining phrase has appeared once, and
    // the refill never begins with the phrase that just finished.
    const refill = advance(state, rng);
    expect(refill.phraseIndex).not.toBe(seen[seen.length - 1]);
    expect(refill.phraseIndex).not.toBe(0);
  });

  it("(d) a stub rng yields a fixed, reproducible order", () => {
    const run = (rng: () => number) => {
      let state: TypingState = initialTypingState();
      const order: number[] = [];
      for (let i = 0; i < 6; i += 1) {
        state = advance(state, rng);
        order.push(state.phraseIndex);
      }
      return order;
    };
    // rng()===0 ⇒ Fisher–Yates leaves [1,2,3] as [2,3,1] on every refill.
    expect(run(() => 0)).toEqual([2, 3, 1, 2, 3, 1]);
    expect(run(seededRng(9))).toEqual(run(seededRng(9)));
  });
});

describe("typingDelayMs — cadence by frame", () => {
  it("uses the type beat while typing, the hold beat when a phrase completes", () => {
    expect(typingDelayMs({ phraseIndex: 0, charCount: 0, deleting: false })).toBe(
      TYPING_CADENCE.type,
    );
    expect(
      typingDelayMs({
        phraseIndex: 1,
        charCount: HERO_PHRASES[1].length,
        deleting: false,
      }),
    ).toBe(TYPING_CADENCE.hold);
  });

  it("holds the opening hook longest", () => {
    expect(
      typingDelayMs({ phraseIndex: 0, charCount: FIRST_LEN, deleting: false }),
    ).toBe(TYPING_CADENCE.holdFirst);
    expect(TYPING_CADENCE.holdFirst).toBeGreaterThan(TYPING_CADENCE.hold);
  });

  it("uses the delete beat while deleting, the gap beat when empty", () => {
    expect(
      typingDelayMs({ phraseIndex: 0, charCount: FIRST_LEN, deleting: true }),
    ).toBe(TYPING_CADENCE.delete);
    expect(typingDelayMs({ phraseIndex: 0, charCount: 0, deleting: true })).toBe(
      TYPING_CADENCE.gap,
    );
  });
});

/** Bare hook probe: no framer-motion nodes, so timers counted are the hook's. */
function Probe() {
  const { state, phrase, shown } = useHeroTyping();
  return createElement(
    "p",
    { "data-testid": "probe" },
    `${shown}|${phrase}|${state.phraseIndex}|${state.charCount}|${state.deleting}`,
  );
}

let container: HTMLDivElement;
let root: Root;

function mount() {
  act(() => {
    root.render(createElement(Probe));
  });
}

function probeText(): string {
  return container.querySelector('[data-testid="probe"]')?.textContent ?? "";
}

/** Current hook state, read back from the probe's rendered frame. */
function frame(): TypingState {
  const [, , index, count, deleting] = probeText().split("|");
  return {
    phraseIndex: Number(index),
    charCount: Number(count),
    deleting: deleting === "true",
  };
}

/** Advance exactly one loop frame (its own delay), then let React commit. */
function step() {
  act(() => vi.advanceTimersByTime(typingDelayMs(frame())));
}

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
  vi.unstubAllGlobals();
});

describe("useHeroTyping — loop, always-animated, cleanup", () => {
  it("renders the full first phrase on mount and schedules one timer", () => {
    mount();
    expect(probeText()).toBe(`${FIRST}|${FIRST}|0|${FIRST_LEN}|false`);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("holds the hook, then deletes a character when the cadence advances", () => {
    mount();
    act(() => vi.advanceTimersByTime(TYPING_CADENCE.holdFirst));
    // Deleting has begun but no character is removed yet.
    expect(probeText()).toBe(`${FIRST}|${FIRST}|0|${FIRST_LEN}|true`);
    act(() => vi.advanceTimersByTime(TYPING_CADENCE.delete));
    expect(probeText()).toBe(
      `${FIRST.slice(0, FIRST_LEN - 1)}|${FIRST}|0|${FIRST_LEN - 1}|true`,
    );
  });

  it("cycles to a non-opening identity after hold + delete + gap + one type", () => {
    mount();
    for (
      let i = 0;
      i < 500 && !(frame().phraseIndex !== 0 && frame().charCount === 1);
      i += 1
    ) {
      step();
    }
    const { phraseIndex } = frame();
    expect(phraseIndex).toBeGreaterThanOrEqual(1);
    expect(phraseIndex).toBeLessThan(HERO_PHRASES.length);
    const phrase = HERO_PHRASES[phraseIndex];
    expect(probeText()).toBe(`${phrase[0]}|${phrase}|${phraseIndex}|1|false`);
  });

  it("always animates: the loop runs even when the OS reports reduce", () => {
    /* Owner order 2026-10-14 — the OS reduced-motion query no longer holds this
       loop still (src/lib/motionPreference.ts pins the animated path). */
    const media = ((query: string) =>
      ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList) as typeof window.matchMedia;
    vi.stubGlobal("matchMedia", media);

    mount();
    expect(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ).toBe(true);
    expect(probeText()).toBe(`${FIRST}|${FIRST}|0|${FIRST_LEN}|false`);
    expect(vi.getTimerCount()).toBe(1);

    act(() => vi.advanceTimersByTime(TYPING_CADENCE.holdFirst));
    expect(probeText()).toBe(`${FIRST}|${FIRST}|0|${FIRST_LEN}|true`);
  });

  it("clears its pending timer on unmount", () => {
    mount();
    expect(vi.getTimerCount()).toBe(1);
    act(() => root.unmount());
    expect(vi.getTimerCount()).toBe(0);
  });
});
