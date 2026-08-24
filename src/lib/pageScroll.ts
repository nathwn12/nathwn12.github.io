import { useEffect, useState } from "react";

/**
 * Scroll bus for the page-per-viewport model.
 *
 * The document body never scrolls — each "page" is its own internal scroll
 * container (see PageShell). Components that previously listened to
 * `window` scroll events (Header status bar, Footer idle meter) now consume
 * scroll state from the active page via this bus.
 */

export interface PageScrollState {
  /** Current internal scroll offset of the active page, in px */
  y: number;
  /** Scroll velocity in px/s, clamped */
  velocity: number;
  direction: "up" | "down" | "idle";
  isScrolling: boolean;
}

export const PAGE_SCROLL_EVENT = "page:scroll";

export function emitPageScroll(state: PageScrollState): void {
  window.dispatchEvent(
    new CustomEvent<PageScrollState>(PAGE_SCROLL_EVENT, { detail: state }),
  );
}

/** Subscribe to the active page's internal scroll state. */
export function usePageScroll(): PageScrollState {
  const [state, setState] = useState<PageScrollState>({
    y: 0,
    velocity: 0,
    direction: "idle",
    isScrolling: false,
  });

  useEffect(() => {
    const onScroll = (e: Event) => {
      const detail = (e as CustomEvent<PageScrollState>).detail;
      if (detail) setState(detail);
    };
    window.addEventListener(PAGE_SCROLL_EVENT, onScroll);
    return () => window.removeEventListener(PAGE_SCROLL_EVENT, onScroll);
  }, []);

  return state;
}
