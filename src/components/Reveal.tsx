import { useRef, type ReactNode } from "react";
import { useReveal } from "../lib/motion";

/**
 * Reveal — the one entrance wrapper.
 *
 * It measures a block into view once with GSAP (`useReveal`): 14px of lift and
 * a fade on the house ease, scoped by `useGSAP` so an unmount reverts it. With
 * the OS asking for less motion, or the footer's Motion switch off, the block
 * is simply there — the final state is the resting state, and nothing is
 * hidden waiting for a tween that will not run.
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
  const ref = useRef<HTMLElement>(null);
  useReveal(ref, { delay: delayMs ? delayMs / 1000 : 0 });

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
