import { useEffect, useState } from "react";
import type { Transition, Variant, Variants } from "framer-motion";

/**
 * Shared keyframed motion system — the single source of entrance, stagger,
 * spring, and marquee motion for the landing, routes, and chrome layers.
 *
 * Authority: docs/premium-direction.md § Principles 4-5 (opacity/transform
 * only, one short duration per context), § Hard-ban list.
 * The frozen export names are the interface three sibling builders import
 * blind — do not rename.
 *
 * Every export below is the animated path and runs unconditionally (owner
 * order 2026-10-14): the OS reduced-motion query no longer gates this site, so
 * there is no module-load probe here and no reduced branch to take — and none
 * in index.css or the app runtime either. The decision lives in exactly one
 * place, `src/lib/motionPreference.ts`, which resolves `MotionConfig` to
 * `"never"`.
 */

/** Durations, named by context (direction § Principles 4). Kept in step with
    the `--motion-duration-*` tokens appended to index.css. */
const DUR = { fast: 0.16, base: 0.28, slow: 0.48 } as const;

/** The house easing: ease-out, no bounce — decisive arrival, no overshoot. */
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Rise-and-fade for a block that enters on its own short beat. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.base, ease: EASE_OUT },
  },
};

/** Opacity-only fade — the chrome and route cross-fade channel. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DUR.base, ease: EASE_OUT },
  },
};

/** Container that walks its children in, one short beat apart. */
export const staggerParent: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

/** One item under `staggerParent`; each carries its own short beat. */
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: EASE_OUT },
  },
};

/** Crisp spring for interactive chrome (reveals, toggles). */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.8,
};

/** The landing's one bold move: a slower, longer rise for the title block. */
export const heroIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.slow, ease: EASE_OUT },
  },
};

/**
 * Continuous horizontal marquee track — translates the strip by half its own
 * width and loops, so a duplicated track scrolls seamlessly.
 *
 * Carries the canonical `hidden`/`visible` states plus an `animate` alias, so
 * a consumer driving it with `animate="visible"` or `animate="animate"` both
 * resolve without a missing-variant warning.
 */
const marqueeLoop: Variant = {
  x: ["0%", "-50%"],
  transition: { duration: 32, ease: "linear", repeat: Infinity },
};

export const marqueeX: Variants = {
  hidden: { x: "0%" },
  visible: marqueeLoop,
  animate: marqueeLoop,
};

/**
 * Motion grammar 2026-10-21 — "lines commit, mass responds" (additive).
 *
 * The bands shared one entrance: the same `whileInView` fade-up five times,
 * which read as a default rather than a design. The grammar keeps every
 * existing entrance and adds a drawn line before it: a hairline commits left
 * to right, then the band's own stagger walks in, then — only in the rail —
 * each row's rule follows in record order. The marquee gains mass the same
 * way: its resting rate is untouched, but scroll velocity lends it a clamped
 * boost that eases back once the page settles.
 *
 * Every export below is compositor-only (opacity/transform) except the
 * shared reduced-motion query, which reads no animation state.
 */

/** The rule draw: one hairline committing left to right in ~320ms on the
    house ease. `scaleX` with a left origin only — no `width`/`height`/`top`/
    `left`, so the paint never touches layout. */
export const RULE_DRAW_MS = 320;
export const RULE_DRAW_S = RULE_DRAW_MS / 1000;

export const ruleDraw: Variants = {
  hidden: { scaleX: 0, transformOrigin: "left" },
  visible: {
    scaleX: 1,
    transformOrigin: "left",
    transition: { duration: RULE_DRAW_S, ease: EASE_OUT },
  },
};

/** Document order of the four ruled bands on the landing, first to last. */
export const BAND_INDEX = {
  experience: 0,
  work: 1,
  forward: 2,
  credentials: 3,
} as const;

/** The stagger's lead after the rule starts drawing, in ms. */
export const STAGGER_AFTER_RULE_MS = 80;

/** The gap between band starts when several bands enter together, in ms. */
export const BAND_ORDER_GAP_MS = 90;

/** First-child delay of a band's stagger: the rule lead plus the band's
    document-order gap, in ms. */
export function bandDelayMs(bandIndex: number): number {
  return STAGGER_AFTER_RULE_MS + bandIndex * BAND_ORDER_GAP_MS;
}

/** First-child delay of a band's stagger, in seconds (for transitions). */
export function bandDelaySec(bandIndex: number): number {
  return bandDelayMs(bandIndex) / 1000;
}

/** A band's stagger parent: `staggerParent`'s rhythm (same `staggerChildren`),
    its first child offset by the rule lead plus the band's document-order
    gap. Children stay `staggerChild`/`fadeUp` — the structure is untouched. */
export function bandStaggerParent(bandIndex: number): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.06, delayChildren: bandDelaySec(bandIndex) },
    },
  };
}

/** The credentials band's single fade: `fadeUp`'s rise, offset by the same
    rule lead plus the band's document-order gap. */
export function bandFadeUp(bandIndex: number): Variants {
  return {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DUR.base,
        ease: EASE_OUT,
        delay: bandDelaySec(bandIndex),
      },
    },
  };
}

/** Rail commit: each ruled rail row's top rule starts this long after the
    previous row's, in ms. The rows are an ordered record, so the sequence
    reads as the record being entered. */
export const RAIL_ROW_GAP_MS = 60;

/** A rail row's rule delay: row *n* starts 60ms after row *n-1*, in ms. */
export function railRowDelayMs(rowIndex: number): number {
  return rowIndex * RAIL_ROW_GAP_MS;
}

/** A rail row's rule delay, in seconds (for transitions). */
export function railRowDelaySec(rowIndex: number): number {
  return railRowDelayMs(rowIndex) / 1000;
}

/** A rail row's top rule: the shared draw, starting on the row's own beat. */
export function railRule(rowIndex: number): Variants {
  return {
    hidden: { scaleX: 0, transformOrigin: "left" },
    visible: {
      scaleX: 1,
      transformOrigin: "left",
      transition: {
        duration: RULE_DRAW_S,
        ease: EASE_OUT,
        delay: railRowDelaySec(rowIndex),
      },
    },
  };
}

/** The marquee's resting rate in px/s. Mirrors `TICKER_PX_PER_S` (Hero.tsx),
    which stays the value's home — this mirror exists only so the pure clamp
    below is testable without a browser. The two must stay equal. */
export const MARQUEE_BASE_PX_PER_S = 40;

/** The marquee's ceiling: 2.5x the resting rate. Scrolling lends mass, never
    a new pace. */
export const MARQUEE_MAX_PX_PER_S = 100;

/** How long after the last scroll-velocity sample the rate eases home, in
    ms. */
export const MARQUEE_EASE_BACK_MS = 600;

/** The |scroll velocity| in px/s that saturates the boost. A hard scroll runs
    several thousand px/s, so this caps early and the strip never sprints. */
export const MARQUEE_VELOCITY_FOR_MAX_PX_PER_S = 2000;

/**
 * Pure scroll coupling for the marquee: the resting rate at zero velocity,
 * rising linearly with |velocity| and saturating at the 2.5x cap. Never
 * negative, never backwards, monotonic non-decreasing — a testable clamp the
 * Hero seam drives through `controls.speed`, so the strip itself never jumps.
 */
export function marqueeRateForVelocity(velocityPxPerS: number): number {
  const magnitude = Math.abs(velocityPxPerS);
  if (Number.isNaN(magnitude)) return MARQUEE_BASE_PX_PER_S;
  if (!Number.isFinite(magnitude)) return MARQUEE_MAX_PX_PER_S;
  if (magnitude <= 0) {
    return MARQUEE_BASE_PX_PER_S;
  }
  const portion = Math.min(
    magnitude / MARQUEE_VELOCITY_FOR_MAX_PX_PER_S,
    1,
  );
  return (
    MARQUEE_BASE_PX_PER_S +
    portion * (MARQUEE_MAX_PX_PER_S - MARQUEE_BASE_PX_PER_S)
  );
}

/**
 * Broadsheet motion (2026-10-21) — line-mask reveal and mass entrances.
 *
 * `mastheadLine` walks one masthead mask line in on a clip-path wipe with a
 * short rise; the parent staggers children 90ms apart (inside the 60–120ms
 * band). `bandEnter` settles a band from 0.98 scale with opacity — mass
 * arriving, not content sliding up. Compositor-only except the mask's
 * clip-path, which is the reveal itself. Both are gated at the call site by
 * `usePrefersReducedMotion`: under reduced motion the tree renders static
 * and fully visible, and index.css parks the mask.
 */

/** One masthead line: clip-path wipe + short rise, delay by line index. */
export const MASTHEAD_LINE_STAGGER_MS = 90;

export const mastheadParent: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: MASTHEAD_LINE_STAGGER_MS / 1000 },
  },
};

export const mastheadLine: Variants = {
  hidden: { clipPath: "inset(0 0 100% 0)", y: 14, opacity: 0 },
  visible: {
    clipPath: "inset(0 0 0% 0)",
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

/** A band arriving whole: 0.98 → 1 scale with opacity. */
export const bandEnter: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DUR.base, ease: EASE_OUT },
  },
};
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", sync);
      return () => query.removeEventListener("change", sync);
    }
    return;
  }, []);

  return reduced;
}
