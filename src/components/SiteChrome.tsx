import { useLayoutEffect, useRef } from "react";
import { SiteHead } from "./SiteHead";
import { useRoute } from "../lib/router";

/**
 * The static site chrome: one banner landmark above `main`, painted in the
 * field of the page that follows it (green over the cover, paper over the
 * record and work pages). Keeping it outside `main` gives the skip link
 * something real to skip and restores the banner landmark.
 *
 * The header's live height is published as `--site-head-h` so the cover can
 * reserve it and still fill exactly one viewport: cover = header + hero. The
 * measurement runs in a layout effect, before paint, so it cannot shift the
 * first screen.
 */
export function SiteChrome() {
  const { route } = useRoute();
  const cover = route.id === "home";
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      document.documentElement.style.setProperty(
        "--site-head-h",
        `${Math.ceil(node.getBoundingClientRect().height)}px`,
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [route.path]);

  return (
    <div
      ref={ref}
      className={`site-chrome ${
        cover ? "field-green site-chrome--cover" : "field-paper site-chrome--page"
      }`}
    >
      <SiteHead />
    </div>
  );
}
