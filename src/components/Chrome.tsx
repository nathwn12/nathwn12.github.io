import { useEffect } from "react";
import { Grain } from "./Grain";
import { Reticle } from "./Reticle";
import { RouteCurtain } from "./RouteCurtain";
import { applyStoredMotion, watchMotionPreference } from "../lib/motion";
import { useSmoothScroll } from "../lib/smooth";

/**
 * Chrome — the instruments around the record, mounted once at the layout root.
 *
 * Grain, reticle and the route curtain are not content and are not per page:
 * they are the frame the pages are read through, so they mount above the router
 * and never remount on a route change. `aria-hidden` on all three keeps them out
 * of the accessibility tree; the skip link that jumps past them belongs to the
 * shell (App.tsx), not here.
 *
 * The smooth scroller is initialised here too, because there is exactly one
 * document to smooth and exactly one place that can own it.
 */
export function Chrome() {
  useSmoothScroll();

  useEffect(() => {
    /* index.html's pre-paint script already wrote `data-motion` before first
       paint; this reconciles the attribute with the OS preference for a
       restored page, and keeps it truthful if that preference changes while
       the document is open. It never writes a preference. */
    applyStoredMotion();
    return watchMotionPreference();
  }, []);

  return (
    <>
      <Grain />
      <Reticle />
      <RouteCurtain />
    </>
  );
}
