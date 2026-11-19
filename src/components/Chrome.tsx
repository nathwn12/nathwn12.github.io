import { useEffect } from "react";
import { RouteCurtain } from "./RouteCurtain";
import { applyStoredMotion, watchMotionPreference } from "../lib/motion";
import { useSmoothScroll } from "../lib/smooth";

/**
 * Chrome — the instruments around the record, mounted once at the layout root.
 *
 * The route curtain mounts above the router and never remounts on navigation.
 * The rest of the frame stays quiet so the person and the work remain the
 * subject of the page.
 *
 * The smooth scroller is initialised here too, because there is exactly one
 * document to smooth and exactly one place that can own it.
 */
export function Chrome() {
  useSmoothScroll();

  useEffect(() => {
    applyStoredMotion();
    return watchMotionPreference();
  }, []);

  return (
    <>
      <RouteCurtain />
    </>
  );
}
