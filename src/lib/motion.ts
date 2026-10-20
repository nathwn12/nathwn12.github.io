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
