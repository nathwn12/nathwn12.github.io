import { useEffect, useRef, useState } from "react";

/**
 * The motion layer, in one file, with no animation library.
 *
 * Every move on the site is a CSS transition on transform and opacity, driven
 * by one `is-in` class that {@link useReveal} adds the first time an element
 * enters the viewport. That is the whole system: no runtime dependency, no
 * layout animation, and no preference gate.
 *
 * The animated path is the only path (owner order 2026-10-14). No module here
 * reads the OS `prefers-reduced-motion` query, not even to discard it, and
 * index.css carries no site-wide static override: a visitor whose OS asks for
 * less motion gets the same page, moving the same way.
 */

/**
 * Reveal an element once, the first time it enters the viewport.
 *
 * Returns a ref to attach and the class list to render. Content is never
 * conditional on the animation: the `enter` class starts at opacity 0, but a
 * failed observer (or a page restored from the back/forward cache with the
 * observer torn down) still resolves to the visible state after a short guard
 * timeout, so a blocked IntersectionObserver can never leave a section blank.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: { delayMs?: number } = {},
) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    /* Guard: a browser that never reports intersection (or a page restored
       from the back/forward cache with the observer torn down) still shows the
       content rather than leaving it transparent. */
    const guard = window.setTimeout(() => setShown(true), 2500);
    return () => {
      observer.disconnect();
      window.clearTimeout(guard);
    };
  }, []);

  const delay = options.delayMs ? `${options.delayMs}ms` : undefined;

  return {
    ref,
    className: `enter${shown ? " is-in" : ""}`,
    style: delay ? { transitionDelay: delay } : undefined,
  } as const;
}
