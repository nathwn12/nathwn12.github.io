// @vitest-environment jsdom
/**
 * Hero typing rotation — the h1 cycling the owner's identities.
 *
 * Two layers, both deterministic:
 *  1. The pure state machine (src/components/Hero.tsx: nextTypingState /
 *     typingDelayMs / initialTypingState) — driven step by step, no timers.
 *  2. useHeroTyping — the loop itself, mounted on a bare probe with fake
 *     timers: it advances through the cadence, renders the reduced-motion
 *     static first phrase with ZERO timers, and clears its timer on unmount.
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

describe("hero identities", () => {
  it("keeps the payment claim as the first (static default) identity", () => {
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

  it("starts fully typed on the first phrase (no empty first paint)", () => {
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

  it("wraps to the next phrase once fully deleted", () => {
    expect(nextTypingState({ phraseIndex: 0, charCount: 0, deleting: true })).toEqual({
      phraseIndex: 1,
      charCount: 0,
      deleting: false,
    });
  });

  it("returns to phrase 0 after the last phrase (loop, not stop)", () => {
    expect(
      nextTypingState({ phraseIndex: 3, charCount: 0, deleting: true }, HERO_PHRASES),
    ).toEqual({ phraseIndex: 0, charCount: 0, deleting: false });
  });

  it("reaches phrase 1 fully deleted after hold + deletes + gap", () => {
    let state: TypingState = initialTypingState();
    for (let i = 0; i < 1 + FIRST_LEN + 1; i += 1) {
      state = nextTypingState(state);
    }
    expect(state).toEqual({ phraseIndex: 1, charCount: 0, deleting: false });
  });
});

describe("typingDelayMs — cadence by frame", () => {
  it("uses the type beat while typing, the hold beat when complete", () => {
    expect(typingDelayMs({ phraseIndex: 0, charCount: 0, deleting: false })).toBe(
      TYPING_CADENCE.type,
    );
    expect(
      typingDelayMs({ phraseIndex: 0, charCount: FIRST_LEN, deleting: false }),
    ).toBe(TYPING_CADENCE.hold);
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
function Probe({ reduceMotion }: { reduceMotion: boolean }) {
  const { state, phrase, shown } = useHeroTyping(reduceMotion);
  return createElement(
    "p",
    { "data-testid": "probe" },
    `${shown}|${phrase}|${state.phraseIndex}|${state.charCount}|${state.deleting}`,
  );
}

let container: HTMLDivElement;
let root: Root;

function mount(reduceMotion: boolean) {
  act(() => {
    root.render(createElement(Probe, { reduceMotion }));
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
});

describe("useHeroTyping — loop, reduced motion, cleanup", () => {
  it("renders the full first phrase on mount and schedules one timer", () => {
    mount(false);
    expect(probeText()).toBe(`${FIRST}|${FIRST}|0|${FIRST_LEN}|false`);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("holds, then deletes a character when the cadence advances", () => {
    mount(false);
    act(() => vi.advanceTimersByTime(TYPING_CADENCE.hold));
    // Deleting has begun but no character is removed yet.
    expect(probeText()).toBe(`${FIRST}|${FIRST}|0|${FIRST_LEN}|true`);
    act(() => vi.advanceTimersByTime(TYPING_CADENCE.delete));
    expect(probeText()).toBe(
      `${FIRST.slice(0, FIRST_LEN - 1)}|${FIRST}|0|${FIRST_LEN - 1}|true`,
    );
  });

  it("cycles to the second identity after hold + delete + gap + one type", () => {
    mount(false);
    const second = HERO_PHRASES[1];
    for (
      let i = 0;
      i < 500 && !(frame().phraseIndex === 1 && frame().charCount === 1);
      i += 1
    ) {
      step();
    }
    expect(probeText()).toBe(`${second[0]}|${second}|1|1|false`);
  });

  it("reduced motion: static first phrase, zero timers, no drift", () => {
    mount(true);
    expect(probeText()).toBe(`${FIRST}|${FIRST}|0|${FIRST_LEN}|false`);
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(120_000));
    expect(probeText()).toBe(`${FIRST}|${FIRST}|0|${FIRST_LEN}|false`);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears its pending timer on unmount", () => {
    mount(false);
    expect(vi.getTimerCount()).toBe(1);
    act(() => root.unmount());
    expect(vi.getTimerCount()).toBe(0);
  });
});
