// @vitest-environment jsdom
/**
 * PageShell cross-page handoff — the seam between the global ←/→ tour
 * (src/lib/keyboardNav.ts) and PageShell's keyed mount effect.
 *
 * Two invariants the unit tests in keyboard-guard.test.ts cannot see, because
 * they only hold once a destination page is actually mounted:
 *
 *   1. A boundary no-op (→ on the last route, ← on the first) leaves NO pending
 *      handoff, so the next route change — however it was triggered — restores
 *      the #main baseline instead of landing on the destination's first stop.
 *   2. A real handoff lands on the destination's first/last [data-nav-item] and
 *      honours the SAME activation rule as an in-page step, so a stop carrying
 *      [data-nav-activate] is revealed rather than merely focused.
 *
 * jsdom has no layout and no scrollIntoView, so the shell's item lookup
 * (navItems filters on client rects) and the landing call are shimmed here —
 * harness workarounds, not lib logic.
 */
import { act, StrictMode, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PageShell } from "../components/PageShell";
import { ROUTES, type RouteDef } from "../lib/router";
import {
  consumePendingStepFocus,
  createPageNavHandler,
  setPendingStepFocus,
} from "../lib/keyboardNav";

/** A real non-boundary route — the destination in both scenarios below. */
const EXPERIENCE: RouteDef = ROUTES[1];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;

  // jsdom implements neither scrollIntoView / Element.scrollTo (the calls
  // would throw) nor any client rects (so navItems() would filter every stop
  // out).
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, "getClientRects", {
    configurable: true,
    value: function (this: HTMLElement): DOMRectList {
      return (
        this.hasAttribute("data-nav-item") ? [{}] : []
      ) as unknown as DOMRectList;
    },
  });
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  consumePendingStepFocus();
  window.history.replaceState(null, "", "/");
});

/**
 * The destination page: a #main container plus one tour stop — the shape a
 * real section page has (Experience's first log row is a clickable
 * [data-nav-item][data-nav-activate]).
 */
function DestinationPage({ onActivate }: { onActivate: () => void }) {
  return (
    <main id="main" tabIndex={-1}>
      <div
        id="first-stop"
        data-nav-item
        data-nav-activate
        tabIndex={0}
        onClick={onActivate}
      />
    </main>
  );
}

function mountShell(children: ReactNode) {
  act(() => {
    root.render(
      <StrictMode>
        <PageShell route={EXPERIENCE} direction="forward">
          {children}
        </PageShell>
      </StrictMode>,
    );
  });
}

/** Press a key through the exact handler App.tsx wires on window. */
function pressGlobal(key: string) {
  const onKey = createPageNavHandler({
    goNext: () => {},
    goPrev: () => {},
    reduceMotion: false,
  });
  window.addEventListener("keydown", onKey);
  try {
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
    );
  } finally {
    window.removeEventListener("keydown", onKey);
  }
}

describe("PageShell handoff", () => {
  it("a boundary step arms no handoff: the next route change focuses #main", () => {
    window.history.replaceState(null, "", "/contact"); // the last route
    pressGlobal("ArrowRight");

    let activations = 0;
    mountShell(
      <DestinationPage
        onActivate={() => {
          activations += 1;
        }}
      />,
    );

    // The no-op must not have left a pending focus behind: the fresh page
    // restores the #main baseline and the tour stop stays untouched.
    expect(document.activeElement).toBe(document.getElementById("main"));
    expect(activations).toBe(0);
  });

  it("a pending handoff lands on the first stop and activates it, like an in-page step", () => {
    setPendingStepFocus(1);

    let activations = 0;
    let activatedAfterFocus: boolean | null = null;
    mountShell(
      <DestinationPage
        onActivate={() => {
          activations += 1;
          activatedAfterFocus =
            document.activeElement === document.getElementById("first-stop");
        }}
      />,
    );

    expect(document.activeElement).toBe(document.getElementById("first-stop"));
    expect(activations).toBe(1);
    // Activation must follow focus (the reveal cannot steal focus back), the
    // same order the in-page step uses.
    expect(activatedAfterFocus).toBe(true);
  });
});
