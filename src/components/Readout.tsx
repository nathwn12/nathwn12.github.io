import { useEffect, useRef } from "react";

/**
 * Readout — the two primitives every band on the record shares.
 *
 * `Seam` is the band boundary: one hairline, drawn from its left edge. It is
 * static. It used to draw itself in the first time it entered the viewport —
 * seven seams on the record, each a scroll-triggered entrance — and that is
 * exactly the festival the owner asked to end: many small things animating as
 * you scroll. The record's motion is now one scrubbed timeline per band (the
 * instrument's bars, the four figures counting, the projects readout, the
 * experience spine); the seam is structure and draws nothing.
 *
 * `useOnEnter` runs a callback once, the first time an element is seen. Nothing
 * on the record uses it now; it stays because a one-shot observer is a small,
 * honest utility, and the `revealLines` / `revealRule` primitives it pairs with
 * are still the experience route's load sequence.
 */

export function Seam() {
  return (
    <div className="frame" aria-hidden="true">
      <div className="rule" />
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
