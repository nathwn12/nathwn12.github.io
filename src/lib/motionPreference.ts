/**
 * Motion is always animated — the single, pinned home for that decision.
 *
 * Owner order 2026-10-14: the tri-state Auto / Animate / Reduce preference, its
 * storage key, its change event, and the footer toggle are retired, and the OS
 * `prefers-reduced-motion` query no longer holds the page still. The animated
 * path is the only path.
 *
 * Every consumer keeps importing the helper it already used — App.tsx's
 * `<MotionConfig>` and its scroll easing, PageShell, Hero, and SystemAtlas — so
 * the decision still has exactly one source and a call site cannot drift back
 * to a gate. The OS argument every call site passes is the constant `false`:
 * nothing in the app runtime reads the OS query any more, not even to discard
 * it (owner order 2026-10-14).
 */

/** The one motion intent. Kept as a named type so the tree's imports and the
 *  App-level `<MotionConfig>` stay spelled against what they consume. */
export type MotionPreference = "animate";

/** The subset of values Framer's `<MotionConfig reducedMotion>` understands. */
export type ReducedMotionMode = "user" | "never" | "always";

/** `<MotionConfig reducedMotion>`: "never" — animate even when the OS reports
 *  `prefers-reduced-motion: reduce`. The argument stays in the signature
 *  because App.tsx passes the value it reads from {@link useMotionPreference}. */
export function motionPreferenceToMode(
  _preference: MotionPreference,
): ReducedMotionMode {
  return "never";
}

/** The boolean every in-tree gate reads (App's scroll easing, PageShell's
 *  item-tour landing, the atlas pulses): always false — no gate reduces. */
export function resolveReduceMotion(
  _preference: MotionPreference,
  _osReduced: boolean,
): boolean {
  return false;
}

/** The retired preference, read as a constant: one value, always animate.
 *  A hook by name only — there is no storage left to subscribe to, so there is
 *  nothing that could flash or revert. */
export function useMotionPreference(): [MotionPreference] {
  return ["animate"];
}

/** The resolved boolean for every motion gate: motion is never reduced. */
export function useResolvedReduceMotion(): boolean {
  return false;
}
