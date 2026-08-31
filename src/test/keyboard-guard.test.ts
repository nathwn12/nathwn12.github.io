// @vitest-environment jsdom
/**
 * C3 — keyboard guard test (judge condition 3).
 *
 * The global ArrowLeft/Right/Up/Down + Home/End handler in App.tsx must never
 * fire page-nav (←/→) or section-scroll (↑/↓/Home/End) while:
 *   (a) e.target is an INPUT/TEXTAREA/SELECT or contentEditable element, or
 *   (b) a [data-terminal-panel] or [data-mobile-menu] overlay is in the DOM.
 *
 * The decision logic lives in src/lib/keyboardNav.ts (imported by App.tsx's
 * global handler) so this guard is unit-testable without a full React mount
 * — the behavioral tests below dispatch real bubbled KeyboardEvents through
 * the exact handler App.tsx wires up (createPageNavHandler).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPageNavHandler,
  isEditableTarget,
  isOverlayOpen,
  navActionForKey,
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

  it("maps unguarded keys to their page/scroll intents", () => {
    const button = document.createElement("button");
    expect(navActionForKey({ key: "ArrowRight", target: button })).toEqual({
      kind: "page",
      direction: 1,
    });
    expect(navActionForKey({ key: "ArrowLeft", target: button })).toEqual({
      kind: "page",
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

  it("never fires page-nav or section-scroll from an editable target (real dispatch)", () => {
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

  it("never fires page-nav or section-scroll while an overlay is open (real dispatch)", () => {
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