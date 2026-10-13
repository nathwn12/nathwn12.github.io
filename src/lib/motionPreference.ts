import { useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Motion preference — the visitor's intent over the OS reduced-motion setting.
 *
 * The tree previously read `useReducedMotion()` (the OS `prefers-reduced-motion`
 * media query) directly at every motion gate, so a visitor whose OS permits
 * motion saw the animation regardless, and a visitor whose OS
 * reduces motion could never opt back into the animation. This module makes
 * motion a first-class, persisted preference:
 *
 *   auto    → follow the OS (Framer's "user" mode) — the DEFAULT
 *   animate → always animate, overriding a reduce-OS ("never")
 *   reduce  → never animate, overriding a motion-OS ("always")
 *
 * Storage namespace mirrors the theme resolver (`nnl-theme` → `nnl-motion`).
 * The stored value is read synchronously on first render, so a reload lands on
 * the visitor's choice before any effect runs — no first-paint flash.
 */

/** Stored user intent for motion. */
export type MotionPreference = "auto" | "animate" | "reduce";

/** The subset of values Framer's `<MotionConfig reducedMotion>` understands. */
export type ReducedMotionMode = "user" | "never" | "always";

export const MOTION_STORAGE_KEY = "nnl-motion";
export const MOTION_CHANGE_EVENT = "nnl-motion-change";

const CYCLE: readonly MotionPreference[] = ["auto", "animate", "reduce"];

function isMotionPreference(value: unknown): value is MotionPreference {
  return value === "auto" || value === "animate" || value === "reduce";
}

/** auto → "user" (honour the OS), animate → "never", reduce → "always". */
export function motionPreferenceToMode(
  preference: MotionPreference,
): ReducedMotionMode {
  if (preference === "animate") return "never";
  if (preference === "reduce") return "always";
  return "user";
}

/** Resolve the preference to the boolean the motion-aware hooks gate on.
 *  `osReduced` is the live OS setting (Framer's `useReducedMotion()`). */
export function resolveReduceMotion(
  preference: MotionPreference,
  osReduced: boolean,
): boolean {
  if (preference === "reduce") return true;
  if (preference === "animate") return false;
  return osReduced;
}

/** In-memory mirror for a preference whose storage write could not be
 *  confirmed. `setMotionPreference` broadcasts MOTION_CHANGE_EVENT *after*
 *  writing, so a listener that re-derives from storage alone would read "auto"
 *  (the write never landed) and silently revert the visitor's explicit choice.
 *  Cleared whenever a write verifiably lands — storage is then authoritative. */
let inMemoryPreference: MotionPreference | null = null;

/** Preference persisted for the session; missing or unrecognized ⇒ "auto". */
export function storedMotionPreference(): MotionPreference {
  try {
    const stored = window.localStorage.getItem(MOTION_STORAGE_KEY);
    if (isMotionPreference(stored)) {
      return stored;
    }
  } catch {
    /* storage unavailable — fall through to the in-memory mirror */
  }
  return inMemoryPreference ?? "auto";
}

/** Persist a preference, then broadcast so every consumer recalibrates. */
export function setMotionPreference(preference: MotionPreference): void {
  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, preference);
    /* Write landed: storage now carries the truth, so retire the mirror. */
    inMemoryPreference = null;
  } catch {
    /* storage unavailable — the session keeps the explicit choice in memory */
    inMemoryPreference = preference;
  }
  const event = new CustomEvent<MotionPreference>(MOTION_CHANGE_EVENT, {
    detail: preference,
  });
  window.dispatchEvent(event);
  document.dispatchEvent(event);
}

/** auto → animate → reduce → auto, persisting each step. */
export function cycleMotionPreference(): MotionPreference {
  const index = CYCLE.indexOf(storedMotionPreference());
  const next = CYCLE[(index + 1) % CYCLE.length];
  setMotionPreference(next);
  return next;
}

/** React binding: the preference stays in sync across same-tab toggles and
 *  cross-tab storage edits. The first render reads storage synchronously. */
export function useMotionPreference(): [
  MotionPreference,
  (preference: MotionPreference) => void,
] {
  const [preference, setPreference] = useState<MotionPreference>(
    storedMotionPreference,
  );

  useEffect(() => {
    const sync = () => setPreference(storedMotionPreference());
    window.addEventListener("storage", sync);
    window.addEventListener(MOTION_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(MOTION_CHANGE_EVENT, sync);
    };
  }, []);

  const applyPreference = useCallback((next: MotionPreference) => {
    setMotionPreference(next);
    setPreference(next);
  }, []);

  return [preference, applyPreference];
}

/** The resolved boolean for every motion gate (typing loop, scroll, atlas
 *  pulses): an explicit override wins; otherwise the live OS setting. */
export function useResolvedReduceMotion(): boolean {
  const [preference] = useMotionPreference();
  return resolveReduceMotion(preference, useReducedMotion() === true);
}
