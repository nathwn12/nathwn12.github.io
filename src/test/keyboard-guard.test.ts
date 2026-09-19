// @vitest-environment jsdom
/**
 * C3 — keyboard guard + global item-tour test (judge condition 3).
 *
 * The global ArrowLeft/Right/Up/Down + Home/End handler in App.tsx must never
 * fire an item step (←/→) or section-scroll (↑/↓/Home/End) while:
 *   (a) e.target is an INPUT/TEXTAREA/SELECT or contentEditable element, or
 *   (b) a [data-terminal-panel] or [data-mobile-menu] overlay is in the DOM.
 *
 * ←/→ is a DOM-driven TOUR over the page's [data-nav-item] stops, not a plain
 * page flip: it focuses the next/previous stop, activates it when the stop is
 * marked [data-nav-activate], and rolls over into the adjacent page with a
 * pending step-focus when the list is exhausted (consumed by PageShell's keyed
 * mount effect).
 *
 * The decision logic lives in src/lib/keyboardNav.ts (imported by App.tsx's
 * global handler) so this guard is unit-testable without a full React mount
 * — the behavioral tests below dispatch real bubbled KeyboardEvents through
 * the exact handler App.tsx wires up (createPageNavHandler).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  consumePendingStepFocus,
  createPageNavHandler,
  currentStepIndex,
  isEditableTarget,
  isOverlayOpen,
  navActionForKey,
  navItems,
  resolveStep,
  setPendingStepFocus,
} from "../lib/keyboardNav";

const GUARDED_KEYS = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
] as const;

function editableElements(): Array<{ kind: string; el: HTMLElement }> {
  const input = document.createElement("input");
  const textarea = document.createElement("textarea");
  const select = document.createElement("select");
  const contentEditable = document.createElement("div");
  contentEditable.setAttribute("contenteditable", "true");
  // jsdom does not implement the isContentEditable getter at all (returns
  // undefined) — shim it so the guard branch is exercised exactly as in a
  // real browser, where contenteditable="true" makes it true.
  Object.defineProperty(contentEditable, "isContentEditable", {
    configurable: true,
    get: () => true,
  });
  return [
    { kind: "INPUT", el: input },
    { kind: "TEXTAREA", el: textarea },
    { kind: "SELECT", el: select },
    { kind: "contentEditable", el: contentEditable },
  ];
}

/** A page-scroll container whose metrics we control (jsdom does no layout). */
function makeScroller(clientHeight: number, scrollHeight: number) {
  const el = document.createElement("div");
  el.className = "page-scroll";
  let top = 0;
  Object.defineProperty(el, "clientHeight", {
    configurable: true,
    get: () => clientHeight,
  });
  Object.defineProperty(el, "scrollHeight", {
    configurable: true,
    get: () => scrollHeight,
  });
  Object.defineProperty(el, "scrollTop", {
    configurable: true,
    get: () => top,
    set: (v: number) => {
      top = v;
    },
  });
  const scrollTo = vi.fn((options?: ScrollToOptions) => {
    if (typeof options?.top === "number") top = options.top;
  });
  // Override via defineProperty so the mock always wins over any jsdom
  // Element.prototype.scrollTo accessor in any jsdom version.
  Object.defineProperty(el, "scrollTo", {
    configurable: true,
    value: scrollTo as unknown as typeof el.scrollTo,
  });
  document.body.appendChild(el);
  return { el, scrollTo, getTop: () => top };
}

interface NavItemHandle {
  el: HTMLElement;
  focus: ReturnType<typeof vi.fn>;
  scrollIntoView: ReturnType<typeof vi.fn>;
  clicks: ReturnType<typeof vi.fn>;
  /** Ordered log of what the tour did to this stop. */
  events: string[];
}

/**
 * A tour stop ([data-nav-item], optionally [data-nav-activate]). jsdom has no
 * layout and does not implement scrollIntoView, and document.activeElement is
 * a prototype getter — all three are shimmed here so the tour logic can be
 * exercised exactly as in a browser. Harness workarounds, not lib logic.
 */
function makeNavItem(
  options: {
    tag?: "div" | "a" | "button";
    activate?: boolean;
    visible?: boolean;
  } = {},
): NavItemHandle {
  const { tag = "div", activate = false, visible = true } = options;
  const el = document.createElement(tag);
  el.setAttribute("data-nav-item", "");
  if (activate) el.setAttribute("data-nav-activate", "");
  if (tag === "a") el.setAttribute("href", "#");
  const events: string[] = [];

  Object.defineProperty(el, "getClientRects", {
    configurable: true,
    value: (() => (visible ? [{}] : [])) as unknown as () => DOMRectList,
  });
  const focus = vi.fn(() => {
    events.push("focus");
    Object.defineProperty(document, "activeElement", {
      configurable: true,
      get: () => el,
    });
  });
  Object.defineProperty(el, "focus", { configurable: true, value: focus });
  const scrollIntoView = vi.fn(() => {
    events.push("scroll");
  });
  Object.defineProperty(el, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
  // Typed as Event (not MouseEvent): a click listener is invoked with the
  // dispatched Event, and the narrower MouseEvent param is not assignable to
  // EventListener under strict function contravariance.
  const clicks = vi.fn((_e: Event) => {
    events.push("activate");
  });
  el.addEventListener("click", clicks);

  document.body.appendChild(el);
  return { el, focus, scrollIntoView, clicks, events };
}

/** Track every window listener so aborted tests cannot leak stale handlers
    that would double-fire into later tests' spies. */
const attachedListeners: Array<() => void> = [];

function attachHandler(reduceMotion = false) {
  const goNext = vi.fn();
  const goPrev = vi.fn();
  const onKey = createPageNavHandler({ goNext, goPrev, reduceMotion });
  window.addEventListener("keydown", onKey);
  attachedListeners.push(() => window.removeEventListener("keydown", onKey));
  return { goNext, goPrev, detach: () => window.removeEventListener("keydown", onKey) };
}

function press(key: string, target: HTMLElement) {
  const ev = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(ev);
  return ev;
}

afterEach(() => {
  // Clean slate: overlays, scrollers, and dispatch targets must not leak
  // between tests (document.querySelector(".page-scroll") picks the first),
  // and no window keydown listener may outlive its test.
  while (attachedListeners.length > 0) {
    attachedListeners.pop()?.();
  }
  document.body.replaceChildren();
  // Release the per-element activeElement shim, any unconsumed handoff, and
  // the URL (the boundary tests move it, and the handler reads the real path).
  Reflect.deleteProperty(document, "activeElement");
  consumePendingStepFocus();
  window.history.replaceState(null, "", "/");
});

describe("keyboard nav guard (C3)", () => {
  it("isEditableTarget flags INPUT/TEXTAREA/SELECT/contentEditable only", () => {
    for (const { el } of editableElements()) {
      expect(isEditableTarget(el)).toBe(true);
    }
    expect(isEditableTarget(document.createElement("button"))).toBe(false);
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });

  it("maps every guarded key to none when the target is editable", () => {
    for (const { kind, el } of editableElements()) {
      for (const key of GUARDED_KEYS) {
        expect(navActionForKey({ key, target: el }), `${kind}/${key}`).toEqual({
          kind: "none",
        });
      }
    }
  });

  it("maps every guarded key to none while [data-terminal-panel] is in the DOM", () => {
    const panel = document.createElement("div");
    panel.setAttribute("data-terminal-panel", "");
    document.body.appendChild(panel);
    expect(isOverlayOpen()).toBe(true);
    const button = document.createElement("button");
    for (const key of GUARDED_KEYS) {
      expect(navActionForKey({ key, target: button }), key).toEqual({
        kind: "none",
      });
    }
  });

  it("maps every guarded key to none while [data-mobile-menu] is in the DOM", () => {
    const menu = document.createElement("nav");
    menu.setAttribute("data-mobile-menu", "");
    document.body.appendChild(menu);
    expect(isOverlayOpen()).toBe(true);
    const button = document.createElement("button");
    for (const key of GUARDED_KEYS) {
      expect(navActionForKey({ key, target: button }), key).toEqual({
        kind: "none",
      });
    }
  });

  it("maps unguarded keys to their step/scroll intents", () => {
    const button = document.createElement("button");
    expect(navActionForKey({ key: "ArrowRight", target: button })).toEqual({
      kind: "step",
      direction: 1,
    });
    expect(navActionForKey({ key: "ArrowLeft", target: button })).toEqual({
      kind: "step",
      direction: -1,
    });
    expect(navActionForKey({ key: "ArrowDown", target: button })).toEqual({
      kind: "scroll",
      direction: 1,
    });
    expect(navActionForKey({ key: "ArrowUp", target: button })).toEqual({
      kind: "scroll",
      direction: -1,
    });
    expect(navActionForKey({ key: "Home", target: button })).toEqual({
      kind: "home",
    });
    expect(navActionForKey({ key: "End", target: button })).toEqual({
      kind: "end",
    });
  });

  it("never fires a step or section-scroll from an editable target (real dispatch)", () => {
    const handler = attachHandler();
    const scroller = makeScroller(800, 1600);
    for (const { kind, el } of editableElements()) {
      document.body.appendChild(el);
      for (const key of GUARDED_KEYS) {
        const ev = press(key, el);
        expect(handler.goNext).not.toHaveBeenCalled();
        expect(handler.goPrev).not.toHaveBeenCalled();
        expect(scroller.scrollTo).not.toHaveBeenCalled();
        expect(ev.defaultPrevented, `${kind}/${key}`).toBe(false);
      }
      el.remove();
    }
    handler.detach();
  });

  it("never fires a step or section-scroll while an overlay is open (real dispatch)", () => {
    const overlay = document.createElement("div");
    overlay.setAttribute("data-terminal-panel", "");
    document.body.appendChild(overlay);
    const handler = attachHandler();
    const scroller = makeScroller(800, 1600);
    const button = document.createElement("button");
    document.body.appendChild(button);
    for (const key of GUARDED_KEYS) {
      const ev = press(key, button);
      expect(handler.goNext).not.toHaveBeenCalled();
      expect(handler.goPrev).not.toHaveBeenCalled();
      expect(scroller.scrollTo).not.toHaveBeenCalled();
      expect(ev.defaultPrevented, key).toBe(false);
    }
    handler.detach();
  });

  it("never steps the tour while the guard is active (editable target, with stops present)", () => {
    const handler = attachHandler();
    const item = makeNavItem({ activate: true });
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    press("ArrowRight", input);
    expect(item.focus).not.toHaveBeenCalled();
    expect(item.clicks).not.toHaveBeenCalled();
    expect(handler.goNext).not.toHaveBeenCalled();
    handler.detach();
  });

  it("ArrowDown/ArrowUp scroll the page container ~80% per step, clamped", () => {
    const handler = attachHandler();
    const { scrollTo, getTop } = makeScroller(800, 1600);
    const button = document.createElement("button");
    document.body.appendChild(button);

    const down = press("ArrowDown", button);
    expect(down.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 640, behavior: "smooth" });
    expect(getTop()).toBe(640);

    press("ArrowDown", button); // 640 + 640 clamped to 800
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 800, behavior: "smooth" });

    const atBottom = press("ArrowDown", button); // already at bottom — no-op
    expect(atBottom.defaultPrevented).toBe(false);
    expect(scrollTo).toHaveBeenCalledTimes(2);

    press("ArrowUp", button); // 800 − 640 = 160
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 160, behavior: "smooth" });

    handler.detach();
  });

  it("Home/End scroll to top/bottom; no-op when already there", () => {
    const handler = attachHandler();
    const { scrollTo } = makeScroller(800, 1600);
    const button = document.createElement("button");
    document.body.appendChild(button);

    press("End", button); // top -> 800
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 800, behavior: "smooth" });

    const home = press("Home", button); // top -> 0
    expect(home.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: "smooth" });

    const alreadyTop = press("Home", button); // already at top — no-op
    expect(alreadyTop.defaultPrevented).toBe(false);
    expect(scrollTo).toHaveBeenCalledTimes(2);

    handler.detach();
  });

  it("is a no-op when the page has no internal overflow (one viewport)", () => {
    const handler = attachHandler();
    const { scrollTo } = makeScroller(800, 800);
    const button = document.createElement("button");
    document.body.appendChild(button);
    for (const key of ["ArrowDown", "ArrowUp", "End", "Home"] as const) {
      const ev = press(key, button);
      expect(ev.defaultPrevented, key).toBe(false);
    }
    expect(scrollTo).not.toHaveBeenCalled();
    handler.detach();
  });

  it("requests instant scroll instead of smooth under reduced motion", () => {
    const handler = attachHandler(true);
    const { scrollTo } = makeScroller(800, 1600);
    const button = document.createElement("button");
    document.body.appendChild(button);
    press("ArrowDown", button);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 640, behavior: "auto" });
    handler.detach();
  });

  it("keeps ArrowUp/Down out of the terminal input's history cycle", () => {
    // Regression for CommandTerminal's own up/down history handling: the
    // global handler must not steal the keys while the terminal input holds
    // focus (covered by the editable-target guard, verified end-to-end here).
    const handler = attachHandler();
    const { scrollTo } = makeScroller(800, 1600);
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    const ev = press("ArrowUp", input);
    expect(ev.defaultPrevented).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
    handler.detach();
  });
});

describe("item tour (←/→ steps over [data-nav-item])", () => {
  it("navItems() lists the visible stops in document order", () => {
    const first = makeNavItem();
    makeNavItem({ visible: false });
    const third = makeNavItem({ tag: "button" });

    const items = navItems();
    expect(items).toHaveLength(2);
    expect(items[0]).toBe(first.el);
    expect(items[1]).toBe(third.el);
  });

  it("navItems() is empty when nothing visible is marked", () => {
    makeNavItem({ visible: false });
    document.body.appendChild(document.createElement("button"));
    expect(navItems()).toEqual([]);
  });

  it("currentStepIndex() finds the focused stop, else -1", () => {
    const a = makeNavItem();
    const b = makeNavItem();
    expect(currentStepIndex([a.el, b.el])).toBe(-1); // body owns focus

    b.el.focus();
    expect(document.activeElement).toBe(b.el);
    expect(currentStepIndex([a.el, b.el])).toBe(1);
    expect(currentStepIndex([a.el])).toBe(-1); // focus sits outside the list
  });

  it("resolveStep() focuses inside the list and routes at either end", () => {
    const items = [makeNavItem().el, makeNavItem().el, makeNavItem().el];

    expect(resolveStep(items, -1, 1)).toEqual({ type: "focus", index: 0 });
    expect(resolveStep(items, 0, 1)).toEqual({ type: "focus", index: 1 });
    expect(resolveStep(items, 2, -1)).toEqual({ type: "focus", index: 1 });
    // Past the last stop → the next page; before the first → the previous.
    expect(resolveStep(items, 2, 1)).toEqual({ type: "route", direction: 1 });
    expect(resolveStep(items, 0, -1)).toEqual({ type: "route", direction: -1 });
  });

  it("resolveStep() always routes when the page has no stops", () => {
    expect(resolveStep([], -1, 1)).toEqual({ type: "route", direction: 1 });
    expect(resolveStep([], -1, -1)).toEqual({ type: "route", direction: -1 });
  });

  it("→ focuses the next stop and centers it, without routing or scrolling", () => {
    const handler = attachHandler();
    const scroller = makeScroller(800, 1600);
    const a = makeNavItem();
    const b = makeNavItem();
    a.el.focus(); // the tour starts from a focused stop

    const ev = press("ArrowRight", a.el);
    expect(ev.defaultPrevented).toBe(true);
    expect(b.focus).toHaveBeenCalledTimes(1);
    expect(b.scrollIntoView).toHaveBeenLastCalledWith({
      block: "center",
      behavior: "smooth",
    });
    expect(scroller.scrollTo).not.toHaveBeenCalled(); // ↑/↓ scroll untouched
    expect(handler.goNext).not.toHaveBeenCalled();
    expect(handler.goPrev).not.toHaveBeenCalled();
    handler.detach();
  });

  it("→ from nothing focused starts the tour at the first stop", () => {
    const handler = attachHandler();
    const a = makeNavItem();
    const b = makeNavItem();

    press("ArrowRight", document.body);
    expect(a.focus).toHaveBeenCalledTimes(1);
    expect(b.focus).not.toHaveBeenCalled();
    handler.detach();
  });

  it("← focuses the previous stop", () => {
    const handler = attachHandler();
    const a = makeNavItem();
    const b = makeNavItem();
    b.el.focus();

    press("ArrowLeft", b.el);
    expect(a.focus).toHaveBeenCalledTimes(1);
    expect(handler.goPrev).not.toHaveBeenCalled();
    handler.detach();
  });

  it("skips invisible stops", () => {
    const handler = attachHandler();
    const a = makeNavItem();
    const hidden = makeNavItem({ visible: false });
    const c = makeNavItem();
    a.el.focus();

    press("ArrowRight", a.el);
    expect(hidden.focus).not.toHaveBeenCalled();
    expect(c.focus).toHaveBeenCalledTimes(1);
    handler.detach();
  });

  it("a step onto a [data-nav-activate] stop clicks it after focusing", () => {
    const handler = attachHandler();
    const a = makeNavItem();
    const b = makeNavItem({ activate: true });
    a.el.focus();

    press("ArrowRight", a.el);

    expect(b.clicks).toHaveBeenCalledTimes(1);
    expect(b.clicks.mock.calls[0][0].bubbles).toBe(true);
    expect(b.events).toEqual(["focus", "scroll", "activate"]);
    handler.detach();
  });

  it("never clicks an <a data-nav-activate> stop (a dispatch there would navigate)", () => {
    const handler = attachHandler();
    const a = makeNavItem();
    const link = makeNavItem({ tag: "a", activate: true });
    a.el.focus();

    press("ArrowRight", a.el);

    expect(link.focus).toHaveBeenCalledTimes(1);
    expect(link.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(link.clicks).not.toHaveBeenCalled();
    handler.detach();
  });

  it("→ past the last stop routes forward, handing a pending step to the next page", () => {
    const handler = attachHandler();
    makeNavItem(); // an earlier stop, so `b` is last in DOM order
    const b = makeNavItem();
    b.el.focus();

    const ev = press("ArrowRight", b.el);
    expect(ev.defaultPrevented).toBe(true);
    expect(handler.goNext).toHaveBeenCalledTimes(1);
    expect(handler.goPrev).not.toHaveBeenCalled();
    expect(consumePendingStepFocus()).toBe(1);
    expect(consumePendingStepFocus()).toBeNull(); // one-shot handoff
    handler.detach();
  });

  it("← before the first stop routes back, handing a pending step to the previous page", () => {
    // Mid-route: "/" is the FIRST route, where ← is a boundary no-op (below).
    window.history.replaceState(null, "", "/experience");
    const handler = attachHandler();
    const a = makeNavItem();
    a.el.focus();

    press("ArrowLeft", a.el);
    expect(handler.goPrev).toHaveBeenCalledTimes(1);
    expect(handler.goNext).not.toHaveBeenCalled();
    expect(consumePendingStepFocus()).toBe(-1);
    handler.detach();
  });

  it("an arrow step on a page with no stops still routes", () => {
    const handler = attachHandler();
    const button = document.createElement("button");
    document.body.appendChild(button);

    const ev = press("ArrowRight", button);
    expect(ev.defaultPrevented).toBe(true);
    expect(handler.goNext).toHaveBeenCalledTimes(1);
    expect(consumePendingStepFocus()).toBe(1);
    handler.detach();
  });

  it("→ on the last route is a boundary no-op: no pending handoff is armed", () => {
    window.history.replaceState(null, "", "/contact");
    const handler = attachHandler();
    const button = document.createElement("button");
    document.body.appendChild(button);

    const ev = press("ArrowRight", button);
    expect(ev.defaultPrevented).toBe(true);
    // There is no adjacent page, so nothing may be handed to the next mount:
    // a stale pending focus would be consumed by the NEXT unrelated route
    // change and land focus on its first stop instead of the #main baseline.
    expect(consumePendingStepFocus()).toBeNull();
    handler.detach();
  });

  it("← on the first route is a boundary no-op: no pending handoff is armed", () => {
    window.history.replaceState(null, "", "/");
    const handler = attachHandler();
    const button = document.createElement("button");
    document.body.appendChild(button);

    press("ArrowLeft", button);
    expect(consumePendingStepFocus()).toBeNull();
    handler.detach();
  });

  it("pending step focus is a one-shot handoff", () => {
    expect(consumePendingStepFocus()).toBeNull();
    setPendingStepFocus(1);
    expect(consumePendingStepFocus()).toBe(1);
    expect(consumePendingStepFocus()).toBeNull();
  });
});
