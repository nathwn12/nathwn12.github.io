import type { Transition, Variant, Variants } from "framer-motion";

/**
 * Shared keyframed motion system — the single source of entrance, stagger,
 * spring, and marquee motion for the landing, routes, and chrome layers.
 *
 * Authority: docs/premium-direction.md § Principles 4-5 (opacity/transform
 * only, one short duration per context, reduced motion wins), § Hard-ban list.
 * The frozen export names are the interface three sibling builders import
 * blind — do not rename.
 *
 * Reduced motion is honoured twice over, belt and braces:
 *   1. Here — every export is built from a module-load probe of
 *      `prefers-reduced-motion`, so a reduced-motion visitor gets an
 *      opacity-only (or static) variant even if a consumer forgets the guard.
 *   2. Runtime — `MotionConfig reducedMotion="user"` in App.tsx and the
 *      `@media (prefers-reduced-motion: reduce)` block in index.css cover a
 *      mid-session OS toggle and any raw CSS-keyframe consumer.
 * The degradation is a shorter fade or a still frame, never a hard cut.
 */

/** Durations, named by context (direction § Principles 4). Kept in step with
    the `--motion-duration-*` tokens appended to index.css. */
const DUR = { fast: 0.16, base: 0.28, slow: 0.48 } as const;

/** The house easing: ease-out, no bounce — decisive arrival, no overshoot. */
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Module-load reduced-motion probe (SSR/bundle-safe). */
const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

const reduced = prefersReducedMotion();

/** Rise-and-fade for a block that enters on its own short beat. */
export const fadeUp: Variants = reduced
  ? {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: DUR.fast, ease: EASE_OUT },
      },
    }
  : {
      hidden: { opacity: 0, y: 12 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: DUR.base, ease: EASE_OUT },
      },
    };

/** Opacity-only fade — the one channel that still runs under reduced motion. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: reduced ? DUR.fast : DUR.base, ease: EASE_OUT },
  },
};

/** Container that walks its children in, one short beat apart. */
export const staggerParent: Variants = {
  hidden: {},
  visible: {
    transition: reduced
      ? { staggerChildren: 0, delayChildren: 0 }
      : { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

/** One item under `staggerParent`; each carries its own short beat. */
export const staggerChild: Variants = reduced
  ? {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: DUR.fast, ease: EASE_OUT },
      },
    }
  : {
      hidden: { opacity: 0, y: 8 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.24, ease: EASE_OUT },
      },
    };

/** Crisp spring for interactive chrome (reveals, toggles). Degrades to a
    zero-overshoot tween under reduced motion. */
export const springSnappy: Transition = reduced
  ? { type: "tween", duration: DUR.fast, ease: EASE_OUT }
  : { type: "spring", stiffness: 420, damping: 34, mass: 0.8 };

/** The landing's one bold move: a slower, longer rise for the title block. */
export const heroIn: Variants = reduced
  ? {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: DUR.fast, ease: EASE_OUT },
      },
    }
  : {
      hidden: { opacity: 0, y: 24 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: DUR.slow, ease: EASE_OUT },
      },
    };

/**
 * Continuous horizontal marquee track — translates the strip by half its own
 * width and loops, so a duplicated track scrolls seamlessly. Under reduced
 * motion it holds a still frame.
 *
 * Carries the canonical `hidden`/`visible` states plus an `animate` alias, so
 * a consumer driving it with `animate="visible"` or `animate="animate"` both
 * resolve without a missing-variant warning.
 */
const marqueeLoop: Variant = {
  x: ["0%", "-50%"],
  transition: { duration: 32, ease: "linear", repeat: Infinity },
};

const marqueeStill: Variant = { x: "0%", transition: { duration: 0 } };

export const marqueeX: Variants = {
  hidden: { x: "0%" },
  visible: reduced ? marqueeStill : marqueeLoop,
  animate: reduced ? marqueeStill : marqueeLoop,
};
