import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useResolvedReduceMotion } from "../lib/motionPreference";
import { applyRouteMeta, type RouteDef, type RouteDirection } from "../lib/router";
import { consumePendingStepFocus, landOnNavItem, navItems } from "../lib/keyboardNav";
import { fadeIn } from "../lib/motion";

interface PageShellProps {
  route: RouteDef;
  direction: RouteDirection;
  children: ReactNode;
}

/** Frames a pending step-focus waits for the destination's stops to mount.
    Routes are `React.lazy` behind Suspense, so on a first visit the shell
    commits before the page content (and its [data-nav-item] stops) does. */
const STEP_FOCUS_RETRY_FRAMES = 60;

/**
 * One "page" — locks to exactly one viewport (100dvh) with internal scrolling,
 * so the document itself never scrolls. Mounted inside a keyed AnimatePresence,
 * it cross-fades on the shared opacity fade (`fadeIn`, src/lib/motion.ts) —
 * opacity only, no rise, no choreography.
 *
 * Everything else this component owns is seam, not style: the live header and
 * footer offsets it reserves, the keyed mount that restores focus to #main, the
 * per-route document.title/meta, and the cross-page step handoff. Those are
 * contracts (PageShell is unit-tested for the handoff) and are unchanged.
 */
export function PageShell({ route, direction, children }: PageShellProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Reduced motion disables all nonessential movement (direction §
      Principles 5); the landing scroll honours it (keyboardNav.landOnNavItem). */
  const reduceMotion = useResolvedReduceMotion();
  /** Pending ←/→ step handoff for THIS mount: `undefined` = not read yet,
      `null` = none. Read once (see the keyed mount effect). */
  const pendingStepRef = useRef<1 | -1 | null | undefined>(undefined);
  /** True once the handoff has landed on a stop (see the keyed mount effect:
      StrictMode double-invokes it, and a second landing both re-focuses and
      dispatches a second click, toggling the reveal closed). */
  const stepLandedRef = useRef(false);

  /* The header and footer are `fixed`, so they are out of flow and this
     scroller must reserve their heights. Neither is a constant — zoom, large
     fonts, the opening mobile menu, a footer wrap at 375px, and the iOS
     safe-area inset all change them — so measure them live instead of
     hard-coding magic offsets that content can slide under. Runs in a layout
     effect so the reserved space exists before the first paint.

     These two custom properties are the shell's public chrome metrics: the
     scroller's own padding consumes them, and `.page-scroll`
     (src/index.css) also reads them for `scroll-padding`, so the ←/→ item
     tour and the skip link never land focus under the fixed chrome. */
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      const chrome: Array<[string, Element | null]> = [
        ["--page-header-offset", document.querySelector("header")],
        ["--page-footer-offset", document.querySelector("footer")],
      ];
      chrome.forEach(([property, node]) => {
        if (node) {
          el.style.setProperty(
            property,
            `${Math.ceil(node.getBoundingClientRect().height)}px`,
          );
        }
      });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    const header = document.querySelector("header");
    const footer = document.querySelector("footer");
    if (header) observer.observe(header);
    if (footer) observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  /* Keyed remount — always start the page at its top. Runs when the NEW
     page is actually mounted (AnimatePresence mode="wait"), so this is also
     the correct moment to move focus to the fresh #main — except when the
     ←/→ tour handed over a pending step, which takes precedence (below). */
  useEffect(() => {
    window.scrollTo(0, 0);
    scrollRef.current?.scrollTo(0, 0);

    const focusMain = () => {
      document.getElementById("main")?.focus({ preventScroll: true });
    };

    /* The ←/→ tour routed us here: read its handoff ONCE per mount and keep it
       in a ref. The effect body is double-invoked under StrictMode (dev), and
       by the second pass the global flag is already consumed — reading it
       again would look like "no pending step" and hand focus back to #main,
       which is exactly the extra-keypress bug this fixes. */
    if (pendingStepRef.current === undefined) {
      pendingStepRef.current = consumePendingStepFocus();
    }
    const pending = pendingStepRef.current;

    /* StrictMode double-invokes this effect (dev). The handoff may land only
       once: a second pass would re-focus the stop and dispatch a second click
       (toggling closed what the first reveal opened), and re-running the
       #main baseline would steal focus back from it. */
    if (stepLandedRef.current) return;

    /* Baseline: the fresh page container owns focus... */
    focusMain();
    if (pending === null) return;

    /* ...unless a step is pending, in which case the tour's destination end
       WINS: step focus is applied after the baseline (and re-applied on a
       retry frame), so the two never race. Landing goes through the SAME rule
       as an in-page step (landOnNavItem) — a stop marked [data-nav-activate]
       is revealed here too, or ← back out of it would be the only way to see
       its content. */
    const focusStepEnd = (): boolean => {
      const items = navItems();
      if (items.length === 0) return false;
      landOnNavItem(pending === 1 ? items[0] : items[items.length - 1], reduceMotion);
      stepLandedRef.current = true;
      return true;
    };

    if (focusStepEnd()) return;

    /* First visit to a lazy page: the stops are not mounted yet. Retry per
       frame (bounded) instead of dropping the handoff; a page that genuinely
       has no stops (e.g. Hero) simply keeps the #main baseline. */
    let frames = 0;
    let raf = requestAnimationFrame(function retry() {
      if (focusStepEnd()) return;
      if (++frames >= STEP_FOCUS_RETRY_FRAMES) {
        focusMain();
        return;
      }
      raf = requestAnimationFrame(retry);
    });
    return () => cancelAnimationFrame(raf);
  }, [route.path]);

  /* Keyed remount — the new page's DOM exists here (`AnimatePresence
     mode="wait"`), so this is the correct moment for document.title + the
     per-route SE/OG meta (home keeps the index.html defaults; see
     applyRouteMeta). Runs on every route change. */
  useEffect(() => {
    document.title = route.title;
    applyRouteMeta(route);
  }, [route.path, route.title]);

  /* Opacity only, and one short duration per state change: the direction
     forbids blanket fade-and-rise entrances and any layout-property tween, and
     opacity is the one channel that still runs when the visitor asks for
     reduced motion (MotionConfig reducedMotion="user" in App) — so the
     transition degrades to a shorter fade, never to a hard cut.

     The fade itself is the shared `fadeIn` (src/lib/motion.ts), not a local
     duration: the route layer and the chrome cross-fade on one contract, and
     the module's own reduced-motion probe shortens it on its own. */
  return (
    <motion.div
      ref={scrollRef}
      custom={direction}
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="page-scroll relative h-screen h-[100dvh] overflow-y-auto overflow-x-hidden pt-[var(--page-header-offset,0px)] pb-[var(--page-footer-offset,2rem)] bg-transparent"
    >
      <div className="relative z-10 min-h-full flex flex-col">{children}</div>
    </motion.div>
  );
}
