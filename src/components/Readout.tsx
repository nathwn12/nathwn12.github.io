import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { motionAllowed, revealRule } from "../lib/motion";

/**
 * Readout — the two primitives every band on the record shares.
 *
 * `Seam` is the band boundary: one hairline, drawn in from its left edge the
 * first time it enters the viewport. It encodes structure (this band ends,
 * that one begins) and nothing else, so it is a rule and never a card edge.
 * The hidden state is set by the script rather than by CSS, which is what lets
 * a visitor with no JavaScript — or no motion — see a solid rule.
 *
 * `useOnEnter` runs a callback once, the first time an element is seen. The
 * counters and the marquee both use it; nothing in this file loops.
 */

export function Seam() {
  const ruleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rule = ruleRef.current;
    if (!rule) return;
    if (!motionAllowed()) return;
    /* Held at zero until the seam is seen, so the draw is visible where the
       visitor meets it rather than played out above the fold. */
    gsap.set(rule, { scaleX: 0, transformOrigin: "left center" });
    if (typeof IntersectionObserver !== "function") {
      revealRule(rule);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        revealRule(rule);
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(rule);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="frame" aria-hidden="true">
      <div ref={ruleRef} className="rule rule--draw" />
    </div>
  );
}

/**
 * Fire once when the element first enters the viewport, and never again.
 * Returns the ref to attach. A missing IntersectionObserver fires immediately:
 * an animation that cannot be observed should behave as if it had been seen.
 */
export function useOnEnter<T extends HTMLElement>(
  onEnter: () => void,
  rootMargin = "0px 0px -12% 0px",
) {
  const ref = useRef<T>(null);
  const callback = useRef(onEnter);
  callback.current = onEnter;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver !== "function") {
      callback.current();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        callback.current();
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  return ref;
}
