import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

/**
 * The motion kit — one preference, four primitives, one React hook.
 *
 * The site has exactly one motion state now: motion runs, unless the visitor's
 * OS asks for less (`prefers-reduced-motion: reduce`). The footer switch that
 * used to pin a second, persisted state is gone, so a stale `nnl-motion` value
 * in storage is not a preference and is ignored.
 *
 * The OS preference is mirrored onto `<html data-motion="off|on">` so CSS can
 * honour it too. When motion is not allowed, every primitive here returns its
 * final state instantly instead of animating to it — no half-faded section, no
 * rule stuck at scaleX(0), no counter frozen at zero.
 *
 * GSAP and its SplitText plugin are local dependencies; nothing here reaches
 * the network.
 */

gsap.registerPlugin(useGSAP, SplitText);

/** Fired on `<window>` whenever the motion state changes. */
export const MOTION_CHANGE_EVENT = "nnl-motion-change";

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
 * Whether an animation may run: the OS does not ask for less. Every primitive
 * below asks this.
 */
export function motionAllowed(): boolean {
  return !prefersReducedMotion();
}

/** The state the document is in, as `data-motion` carries it. */
function motionState(): "on" | "off" {
  return prefersReducedMotion() ? "off" : "on";
}

/**
 * Mirror the OS preference onto `<html data-motion>`, then broadcast so CSS,
 * Lenis, the reticle and any mounted control agree.
 *
 * The attribute is a machine-readable state, not a setting: it is `"on"` unless
 * reduced motion forces `"off"`. index.html's pre-paint script writes it before
 * first paint; the shell calls this once on mount for a restored page or a
 * storage read that failed pre-paint, and again whenever the OS preference
 * changes at runtime.
 */
export function applyStoredMotion(): void {
  document.documentElement.dataset.motion = motionState();
  window.dispatchEvent(new CustomEvent<boolean>(MOTION_CHANGE_EVENT, {
    detail: motionAllowed(),
  }));
}

/** Re-read the OS preference on every change for the rest of the document. */
export function watchMotionPreference(): () => void {
  try {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => applyStoredMotion();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  } catch {
    /* No media query support — the state cannot change. */
    return () => {};
  }
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
 * like a title sequence. Body copy is static and reads at its measure.
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
