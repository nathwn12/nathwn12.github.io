import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { MOTION_CHANGE_EVENT, motionAllowed } from "./motion";

/**
 * Smooth scrolling — one Lenis instance, driven by GSAP's ticker.
 *
 * Lenis writes `scroll-behavior`-free transforms onto the document scroll, and
 * ScrollTrigger needs to hear about every frame it produces or a pinned stage
 * drifts a frame behind the wheel. So the instance does NOT own its own
 * `requestAnimationFrame` loop (`autoRaf: false`): GSAP's ticker is the single
 * clock, which is also why `lagSmoothing(0)` is set — a ticker that silently
 * swallows a slow frame would make the smoothing jump.
 *
 * Motion is a privilege, not a default: with the OS asking for less motion or
 * the footer switch off, the instance is destroyed and the page scrolls
 * natively. Nothing here is smooth for the sake of being smooth.
 */

/**
 * Whether this is a real browser: a document with media queries and animation
 * frames. ScrollTrigger's own registration calls `matchMedia()` (to set up its
 * breakpoints), so both the plugin and the instance are gated on the same
 * question — a DOM without media queries is a DOM without a scroller to
 * smooth, and the page falls back to native scrolling above.
 */
function canSmooth(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    typeof window.requestAnimationFrame === "function" &&
    Boolean(document.documentElement)
  );
}

if (canSmooth()) {
  gsap.registerPlugin(ScrollTrigger);
}

let instance: Lenis | null = null;
let tick: ((time: number) => void) | null = null;

/**
 * The one instance, created on first use.
 *
 * `respectReducedMotion: true` makes Lenis re-read the OS query itself, and the
 * module singleton means React StrictMode's double mount cannot create two
 * loops on one document. A construction failure (embedded view, a browser
 * without the APIs Lenis wants) answers `null` and the page scrolls natively —
 * smooth scrolling is an enhancement, never a prerequisite for reading.
 */
export function getLenis(): Lenis | null {
  if (!canSmooth()) return null;
  if (instance) return instance;
  try {
    const lenis = new Lenis({
      autoRaf: false,
      respectReducedMotion: true,
      smoothWheel: true,
      lerp: 0.14,
    });
    lenis.on("scroll", ScrollTrigger.update);
    const handler = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(handler);
    gsap.ticker.lagSmoothing(0);
    tick = handler;
    instance = lenis;
    return instance;
  } catch {
    return null;
  }
}

/**
 * Scroll to a target — a band id, an element, a number of pixels.
 *
 * Falls back to the native `scrollIntoView` when there is no instance, so a
 * band link works in exactly the states where smoothing is off.
 */
export function scrollTo(
  target: string | HTMLElement | number,
  options: { offset?: number; immediate?: boolean } = {},
): void {
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target, {
      offset: options.offset ?? 0,
      immediate: options.immediate ?? false,
    });
    return;
  }
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: options.immediate ? "auto" : "smooth" });
    return;
  }
  const el = typeof target === "string" ? document.getElementById(target) : target;
  el?.scrollIntoView({ behavior: options.immediate ? "auto" : "smooth", block: "start" });
}

/**
 * Turn smoothing on or off for the rest of the document's life.
 *
 * Off destroys the instance (and its ticker entry) so the wheel is native
 * again; on recreates it lazily. Called by the footer's Motion switch, through
 * the `nnl-motion-change` broadcast.
 */
export function setMotionEnabled(enabled: boolean): void {
  if (enabled) {
    getLenis()?.start();
    return;
  }
  if (!instance) return;
  if (tick) gsap.ticker.remove(tick);
  tick = null;
  instance.destroy();
  instance = null;
}

/**
 * Mount the scroller once, at the layout root, and keep it in step with the
 * motion switch. Safe under StrictMode: the instance outlives the effect, so a
 * double mount is still one loop, and the listener is removed on unmount.
 */
export function useSmoothScroll(): void {
  useEffect(() => {
    setMotionEnabled(motionAllowed());
    const onMotionChange = () => {
      setMotionEnabled(motionAllowed());
    };
    window.addEventListener(MOTION_CHANGE_EVENT, onMotionChange);
    return () => window.removeEventListener(MOTION_CHANGE_EVENT, onMotionChange);
  }, []);
}
