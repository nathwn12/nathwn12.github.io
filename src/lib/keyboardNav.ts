/**
 * Global keyboard-navigation decision logic (K1/C3).
 *
 * App.tsx registers one window keydown handler that drives:
 *   - ← / →   one ITEM step through the page's tour (see navItems below); when
 *             the page's items are exhausted the step routes to the adjacent
 *             page and records a pending step-focus for its first/last item
 *   - ↑ / ↓   in-page section scroll on the internal page-scroll container
 *   - Home/End scroll to top/bottom of that container
 *
 * The tour is DOM-driven — an attribute convention exactly like the existing
 * [data-terminal-panel] / [data-mobile-menu] hooks, with no per-page registry:
 *   - [data-nav-item]     a focusable stop on the tour (any element)
 *   - [data-nav-activate] OPT-IN: stepping onto the item also reveals its
 *                         content (a bubbling click is dispatched after focus)
 *
 * The guard (judge condition 3 / C3) is factored here so it is unit-testable
 * without a full React mount: the handler never fires while the event target
 * is editable (INPUT/TEXTAREA/SELECT/contentEditable — CommandTerminal keeps
 * its own ↑/↓ history on its input) nor while a [data-terminal-panel] or
 * [data-mobile-menu] overlay is in the DOM (mirrors the pre-existing ←/→
 * guard in App.tsx and the F2 handler in Header.tsx).
 */

import { resolveRoute, routeAtOffset } from "./router";

export type NavAction =
  | { kind: "step"; direction: 1 | -1 }
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
      return { kind: "step", direction: 1 };
    case "ArrowLeft":
      return { kind: "step", direction: -1 };
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

/**
 * The page's tour stops: every [data-nav-item] in document order, filtered to
 * the visible ones. jsdom (and a hidden page) reports no client rects, so the
 * visibility test is layout-driven rather than attribute-driven — a hidden
 * page's items are never stepped onto.
 */
export function navItems(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>("[data-nav-item]"),
  ).filter((el) => el.getClientRects().length > 0);
}

/** Index of the currently focused tour stop in `items`, else -1. */
export function currentStepIndex(items: readonly HTMLElement[]): number {
  const active = document.activeElement as HTMLElement | null;
  if (!active) return -1;
  return items.indexOf(active);
}

export type StepResolution =
  | { type: "focus"; index: number }
  | { type: "route"; direction: 1 | -1 };

/**
 * Where an item step lands: the next/previous stop while it is inside the
 * list, otherwise a route change (past the last item → the next page; before
 * the first → the previous page). An empty list always routes.
 */
export function resolveStep(
  items: readonly HTMLElement[],
  activeIndex: number,
  direction: 1 | -1,
): StepResolution {
  const index = activeIndex + direction;
  if (index >= 0 && index <= items.length - 1) return { type: "focus", index };
  return { type: "route", direction };
}

/**
 * Land on a tour stop: focus it, center it, and — when it opts in with
 * [data-nav-activate] — reveal its content with a bubbling click. Activation
 * happens AFTER focus (the reveal must not steal focus back) and never on an
 * <a>, where a dispatched click would navigate away from the tour. This is the
 * one landing rule, shared by the in-page ←/→ step and PageShell's cross-page
 * handoff so the two cannot drift.
 */
export function landOnNavItem(el: HTMLElement): void {
  el.focus();
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  if (el.hasAttribute("data-nav-activate") && el.tagName !== "A") {
    el.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  }
}

/**
 * Whether an item step's route change will actually move: the adjacent page
 * exists. The first/last-route boundary belongs to the router, so this defers
 * to its own resolution rather than keeping a second copy of the route order
 * here — `resolveRoute` canonicalizes the current path exactly as the router's
 * `currentPath` is, and `routeAtOffset` applies the same clamp that
 * `useAdjacentNavigation` no-ops on. If the clamped target is where we already
 * are, the move is a no-op.
 */
export function adjacentRouteExists(direction: 1 | -1): boolean {
  const from = resolveRoute(window.location.pathname).path;
  return routeAtOffset(from, direction).path !== from;
}

/* Pending step-focus for the destination page: set by the handler when a step
   routes, consumed by PageShell's keyed mount effect — the only moment the
   new page's DOM exists (AnimatePresence mode="wait"). */
let pendingStepFocus: 1 | -1 | null = null;

/** Record which end of the destination page's tour the next mount should land on. */
export function setPendingStepFocus(direction: 1 | -1): void {
  pendingStepFocus = direction;
}

/** Read the pending step direction once, clearing it. */
export function consumePendingStepFocus(): 1 | -1 | null {
  const direction = pendingStepFocus;
  pendingStepFocus = null;
  return direction;
}

export interface PageNavHandlerDeps {
  goNext: () => void;
  goPrev: () => void;
  /** When true, ↑/↓ use instant scroll instead of smooth. */
  reduceMotion: boolean;
}

/**
 * The keydown handler App.tsx wires on window. preventDefault is only applied
 * when the intent actually moves something: an item step always moves (focus,
 * activate, or a route change), section scroll only when the container can
 * move in the requested direction (and is a no-op on single-viewport pages
 * with no internal overflow).
 */
export function createPageNavHandler(
  deps: PageNavHandlerDeps,
): (e: KeyboardEvent) => void {
  return (e) => {
    const action = navActionForKey(e);
    if (action.kind === "none") return;

    if (action.kind === "step") {
      e.preventDefault();
      const items = navItems();
      const resolved = resolveStep(
        items,
        currentStepIndex(items),
        action.direction,
      );

      if (resolved.type === "focus") {
        landOnNavItem(items[resolved.index]);
        return;
      }

      /* Past the last / before the first item — roll into the adjacent page.
         Only a move may arm the handoff: at the first/last route the adjacent
         call is a no-op, and a stale pending focus would be consumed by the
         NEXT unrelated route change (a header tab), landing focus on that
         page's first/last item instead of restoring the #main baseline. */
      if (adjacentRouteExists(action.direction)) {
        setPendingStepFocus(action.direction);
      }
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