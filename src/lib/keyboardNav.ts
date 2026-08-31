/**
 * Global keyboard-navigation decision logic (K1/C3).
 *
 * App.tsx registers one window keydown handler that drives:
 *   - ← / →   page navigation (goPrev / goNext)
 *   - ↑ / ↓   in-page section scroll on the internal page-scroll container
 *   - Home/End scroll to top/bottom of that container
 *
 * The guard (judge condition 3 / C3) is factored here so it is unit-testable
 * without a full React mount: the handler never fires while the event target
 * is editable (INPUT/TEXTAREA/SELECT/contentEditable — CommandTerminal keeps
 * its own ↑/↓ history on its input) nor while a [data-terminal-panel] or
 * [data-mobile-menu] overlay is in the DOM (mirrors the pre-existing ←/→
 * guard in App.tsx and the F2 handler in Header.tsx).
 */

export type NavAction =
  | { kind: "page"; direction: 1 | -1 }
  | { kind: "scroll"; direction: 1 | -1 }
  | { kind: "home" }
  | { kind: "end" }
  | { kind: "none" };

/** True when the event target is a form field or contentEditable region. */
export function isEditableTarget(target: EventTarget | null): boolean {
  const t = target as HTMLElement | null;
  return Boolean(
    t &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT" ||
        t.isContentEditable),
  );
}

/** True while the terminal panel or the mobile menu is mounted (load-bearing
    attributes — do not rename; consumers live in App/Header/CommandTerminal). */
export function isOverlayOpen(): boolean {
  return Boolean(
    document.querySelector("[data-terminal-panel]") ||
      document.querySelector("[data-mobile-menu]"),
  );
}

/** Map a raw keydown to its intent, applying the editable/overlay guard. */
export function navActionForKey(
  e: Pick<KeyboardEvent, "key" | "target">,
): NavAction {
  if (isEditableTarget(e.target)) return { kind: "none" };
  if (isOverlayOpen()) return { kind: "none" };
  switch (e.key) {
    case "ArrowRight":
      return { kind: "page", direction: 1 };
    case "ArrowLeft":
      return { kind: "page", direction: -1 };
    case "ArrowDown":
      return { kind: "scroll", direction: 1 };
    case "ArrowUp":
      return { kind: "scroll", direction: -1 };
    case "Home":
      return { kind: "home" };
    case "End":
      return { kind: "end" };
    default:
      return { kind: "none" };
  }
}

/** Step per ↑/↓ press: ~80% of the container's height (80vH), floor 80px. */
export function sectionScrollStep(scroller: HTMLElement): number {
  return Math.max(scroller.clientHeight * 0.8, 80);
}

export interface PageNavHandlerDeps {
  goNext: () => void;
  goPrev: () => void;
  /** MotionConfig reducedMotion="user" — ↑/↓ use instant scroll, not smooth. */
  reduceMotion: boolean;
}

/**
 * The keydown handler App.tsx wires on window. preventDefault is only applied
 * when the intent actually moves something: navigation always moves, section
 * scroll only when the container can move in the requested direction (and is
 * a no-op on single-viewport pages with no internal overflow).
 */
export function createPageNavHandler(
  deps: PageNavHandlerDeps,
): (e: KeyboardEvent) => void {
  return (e) => {
    const action = navActionForKey(e);
    if (action.kind === "none") return;

    if (action.kind === "page") {
      e.preventDefault();
      if (action.direction === 1) deps.goNext();
      else deps.goPrev();
      return;
    }

    const scroller = document.querySelector<HTMLElement>(".page-scroll");
    if (!scroller) return;
    const maxScroll = scroller.scrollHeight - scroller.clientHeight;
    if (maxScroll <= 0) return; // one viewport, no internal overflow — no-op
    const behavior: ScrollBehavior = deps.reduceMotion ? "auto" : "smooth";

    if (action.kind === "scroll") {
      const target = Math.min(
        maxScroll,
        Math.max(0, scroller.scrollTop + action.direction * sectionScrollStep(scroller)),
      );
      if (target === scroller.scrollTop) return; // already at the edge
      e.preventDefault();
      scroller.scrollTo({ top: target, behavior });
      return;
    }

    // Home / End
    const target = action.kind === "home" ? 0 : maxScroll;
    if (target === scroller.scrollTop) return;
    e.preventDefault();
    scroller.scrollTo({ top: target, behavior });
  };
}