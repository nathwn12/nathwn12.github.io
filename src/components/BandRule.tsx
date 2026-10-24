import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ruleDraw } from "../lib/motion";

/**
 * BandRule — the grammar's drawn line.
 *
 * A dedicated absolutely-positioned 1px element that draws left to right over
 * the band's (or rail row's) existing static `border-t`, which stays untouched
 * as the fallback underneath. At rest the draw sits at full width over the
 * same-colour border, so the visible result is identical to the border alone.
 * Under `prefers-reduced-motion: reduce` there is no draw: the rule renders at
 * full width immediately.
 */
export function BandRule({
  variants = ruleDraw,
  reduced,
}: {
  variants?: Variants;
  reduced: boolean;
}) {
  if (reduced) {
    return (
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px w-full bg-border"
      />
    );
  }
  return (
    <motion.span
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-px w-full origin-left bg-border"
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-15% 0px" }}
    />
  );
}
