import type { ReactNode } from "react";
import { useReveal } from "../lib/motion";

/**
 * Reveal — one wrapper for the site's entrance.
 *
 * It adds the shared `enter` / `is-in` classes from index.css and nothing else:
 * the travel is 14px of translateY plus opacity, 280ms on the house ease, run
 * once. `prefers-reduced-motion: reduce` removes the travel and keeps the
 * content (index.css), and the content is never conditional on the observer —
 * see useReveal's guard.
 *
 * `as` exists so a list can reveal its OWN `<li>` instead of wrapping it in a
 * div: `<ol>` may only contain list items, and a div between them is invalid
 * markup (and breaks `ol > li` selectors, tests included).
 */
export function Reveal({
  children,
  delayMs,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
  as?: "div" | "li";
}) {
  const reveal = useReveal<HTMLElement>({ delayMs });
  return (
    <Tag
      ref={reveal.ref as never}
      className={`${reveal.className} ${className}`.trim()}
      style={reveal.style}
    >
      {children}
    </Tag>
  );
}
