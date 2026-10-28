import { useEffect } from "react";

/**
 * The entrance observer for one route mount.
 *
 * Elements carrying `[data-reveal]` and the children of the four ledger lists
 * gain `.is-in` when they enter the viewport. The CSS only hides them inside
 * `prefers-reduced-motion: no-preference`, so a reduced-motion visitor always
 * sees the finished page; the 2.6s fallback reveals everything if the observer
 * never fires (a missed intersection, a background tab, an old engine).
 */
export function useEntrances(path: string): void {
  useEffect(() => {
    const revealAll = () => {
      document
        .querySelectorAll<HTMLElement>(
          "[data-reveal], .ledger li, .contact-rows li, .project, .entry",
        )
        .forEach((element) => element.classList.add("is-in"));
    };

    if (typeof IntersectionObserver === "undefined") {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );

    document
      .querySelectorAll<HTMLElement>("[data-reveal]")
      .forEach((element) => observer.observe(element));

    document
      .querySelectorAll<HTMLElement>(
        ".ledger, .contact-rows, .work-list-inner, .record-list-inner",
      )
      .forEach((list) => {
        Array.from(list.children).forEach((element, index) => {
          if (!element.matches("li, .project, .entry")) return;
          (element as HTMLElement).style.transitionDelay = `${
            Math.min(index, 6) * 60
          }ms`;
          observer.observe(element);
        });
      });

    const fallback = window.setTimeout(revealAll, 2600);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [path]);
}
