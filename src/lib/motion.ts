import { type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

/**
 * The motion kit — one preference, four primitives, one React hook.
 *
 * The site has exactly two motion states, and they are not the same question:
 *
 *   the OS preference (`prefers-reduced-motion`) is a visitor's standing
 *   instruction and is never persisted or overridden;
 *   the site switch (`nnl-motion`, the footer's Motion control) is an explicit
 *   choice on this document, persisted, and mirrored onto `<html
 *   data-motion="off|on">` so CSS can honour it too.
 *
 * Motion runs only when BOTH agree ({@link motionAllowed}). When it does not,
 * every primitive here returns its final state instantly instead of animating
 * to it — no half-faded section, no rule stuck at scaleX(0), no counter frozen
 * at zero.
 *
 * GSAP and its SplitText plugin are local dependencies; nothing here reaches
 * the network.
 */

gsap.registerPlugin(useGSAP, SplitText);

/** Storage key for the site's own motion switch. Not the retired theme key. */
export const MOTION_KEY = "nnl-motion";

/** Fired on `<window>` whenever the switch is flipped, with the new boolean. */
export const MOTION_CHANGE_EVENT = "nnl-motion-change";

export type MotionSetting = "on" | "off";

/**
 * The OS preference, as a boolean.
 *
 * A missing, blocked or throwing `matchMedia` answers "reduce": if the browser
 * cannot tell us the visitor tolerates motion, the honest default is the still
 * page. It also keeps the module usable where there is no media query support
 * at all (jsdom, an old embedded view).
 */
export function prefersReducedMotion(): boolean {
  try {
    if (typeof window === "undefined") return true;
    if (typeof window.matchMedia !== "function") return true;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return true;
  }
}

/**
 * The site switch, read from storage. Absent, unrecognized or unreadable
 * storage answers `true`: motion is on unless the visitor turned it off.
 */
export function readMotionEnabled(): boolean {
  try {
    return window.localStorage.getItem(MOTION_KEY) !== "off";
  } catch {
    return true;
  }
}

/**
 * Whether an animation may run: the site switch is on AND the OS does not ask
 * for less. Every primitive below asks this, not one half of it.
 */
export function motionAllowed(): boolean {
  return readMotionEnabled() && !prefersReducedMotion();
}

/**
 * Flip the site switch: persist it, mirror it onto `<html data-motion>`, then
 * broadcast so CSS, Lenis, the reticle and any mounted control agree.
 */
export function setMotionEnabled(enabled: boolean): void {
  const value: MotionSetting = enabled ? "on" : "off";
  try {
    window.localStorage.setItem(MOTION_KEY, value);
  } catch {
    /* Storage blocked — the DOM state below still applies for this document. */
  }
  document.documentElement.dataset.motion = value;
  window.dispatchEvent(
    new CustomEvent<boolean>(MOTION_CHANGE_EVENT, { detail: enabled }),
  );
}

/**
 * Re-apply the stored switch without persisting or broadcasting. index.html's
 * pre-paint script has already done this before first paint; the shell calls
 * this once on mount so a storage read that failed pre-paint, or a restored
 * back/forward cache, cannot leave the attribute stale.
 */
export function applyStoredMotion(): void {
  document.documentElement.dataset.motion = readMotionEnabled() ? "on" : "off";
}

/** A running enhancement, and the way to undo it. */
export interface MotionHandle {
  revert(): void;
}

const NOOP_HANDLE: MotionHandle = { revert() {} };

export interface RevealOptions {
  /** Seconds before the reveal starts. */
  delay?: number;
  /** Distance in px the masked lines travel from. */
  stagger?: number;
}

/**
 * Masked line reveal for a section claim — the only text the site splits.
 *
 * SplitText re-splits on resize and on font load (`autoSplit`), keeps a copy of
 * the original markup, and marks the split copy `aria-hidden` while the
 * original text stays readable to assistive tech (`aria: "auto"`). The handle's
 * `revert()` restores the untouched element, so an unmount never leaves split
 * spans behind.
 *
 * Paragraphs are never split: line masks on running copy make a paragraph feel
 * like a title sequence. Body copy reveals with {@link useReveal}.
 */
export function revealLines(
  el: HTMLElement | null | undefined,
  options: RevealOptions = {},
): MotionHandle {
  if (!el) return NOOP_HANDLE;
  if (!motionAllowed()) {
    /* Final state, instantly: the element is already plain text, so there is
       nothing to undo — only nothing to animate. */
    return NOOP_HANDLE;
  }

  let columns: SplitText | null = null;
  try {
    columns = SplitText.create(el, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      linesClass: "rec-line",
      aria: "auto",
      onSplit: (self) => {
        gsap.from(self.lines, {
          yPercent: 110,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: options.stagger ?? 0.08,
          delay: options.delay ?? 0,
        });
      },
    });
  } catch {
    /* A browser that cannot split still gets its text: leave the element be. */
    return NOOP_HANDLE;
  }

  return {
    revert() {
      columns?.revert();
      columns = null;
    },
  };
}

/**
 * Draw a hairline in from its left edge.
 *
 * The hidden state is set here rather than in CSS, so a page whose scripts
 * never arrive still paints the rule (base.css gives `.rule--draw` only its
 * origin).
 */
export function revealRule(
  el: HTMLElement | null | undefined,
  options: { delay?: number } = {},
): MotionHandle {
  if (!el) return NOOP_HANDLE;
  if (!motionAllowed()) {
    gsap.set(el, { scaleX: 1, transformOrigin: "left center" });
    return NOOP_HANDLE;
  }
  const tween = gsap.fromTo(
    el,
    { scaleX: 0 },
    {
      scaleX: 1,
      transformOrigin: "left center",
      duration: 0.7,
      ease: "power2.out",
      delay: options.delay ?? 0,
    },
  );
  return { revert: () => tween.kill() };
}

/**
 * Count a measured value up once, on enter.
 *
 * `format` owns the whole rendering — the digits, the unit, the sign — so a
 * caller can write "1,182" or "−98%" and the tween only feeds it a number. With
 * motion off the element is written straight to its final text.
 */
export function countUp(
  el: HTMLElement | null | undefined,
  to: number,
  format: (value: number) => string = (value) => Math.round(value).toString(),
  options: { duration?: number; from?: number } = {},
): MotionHandle {
  if (!el) return NOOP_HANDLE;
  const from = options.from ?? 0;
  if (!motionAllowed()) {
    el.textContent = format(to);
    return NOOP_HANDLE;
  }
  const proxy = { value: from };
  el.textContent = format(from);
  const tween = gsap.to(proxy, {
    value: to,
    duration: options.duration ?? 1.1,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = format(proxy.value);
    },
    onComplete: () => {
      el.textContent = format(to);
    },
  });
  return { revert: () => tween.kill() };
}

/**
 * Reveal a block once, the first time it enters the viewport.
 *
 * The element is measured, not assumed: it fades and lifts 14px on the house
 * ease, and with motion off (or a reduced preference) it is left exactly as it
 * is — the final state is the resting state. `useGSAP` scopes the tween and
 * reverts it on unmount, so a route change leaves nothing running.
 */
export function useReveal(
  ref: RefObject<HTMLElement | null>,
  options: { delay?: number; y?: number } = {},
): void {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (!motionAllowed()) return;

      gsap.set(el, { opacity: 0, y: options.y ?? 14 });
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.disconnect();
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            delay: options.delay ?? 0,
          });
        },
        { rootMargin: "0px 0px -8% 0px" },
      );
      observer.observe(el);
      return () => observer.disconnect();
    },
    { scope: ref, dependencies: [] },
  );
}
