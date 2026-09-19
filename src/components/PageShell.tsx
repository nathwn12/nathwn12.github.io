import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { emitPageScroll, type PageScrollState } from "../lib/pageScroll";
import { applyRouteMeta, type RouteDef, type RouteDirection } from "../lib/router";
import { consumePendingStepFocus, landOnNavItem, navItems } from "../lib/keyboardNav";

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
 * One "terminal page" — locks to exactly one viewport (100dvh) with internal
 * scrolling, so the document itself never scrolls. Mounted inside a keyed
 * AnimatePresence, it performs the page transition:
 *
 *  - exit:  the whole screen wipes upward like a terminal `clear`
 *  - enter: direction-aware rise (forward: from below, back: from above),
 *           a CRT flicker, a scanline sweep, and a cursor-typed `$ cd <path>`
 *           overlay — the signature "booted into a new page" moment.
 */
export function PageShell({ route, direction, children }: PageShellProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Pending ←/→ step handoff for THIS mount: `undefined` = not read yet,
      `null` = none. Read once (see the keyed mount effect). */
  const pendingStepRef = useRef<1 | -1 | null | undefined>(undefined);
  /** True once the handoff has landed on a stop (see the keyed mount effect:
      StrictMode double-invokes it, and a second landing both re-focuses and
      dispatches a second click, toggling the reveal closed). */
  const stepLandedRef = useRef(false);

  /* The header is `fixed`, so it is out of flow and this scroller must
     reserve its height. That height is not a constant — zoom, large fonts,
     and the opening mobile menu all change it — so measure it live instead
     of hard-coding a magic offset that content can slide under. Runs in a
     layout effect so the reserved space exists before the first paint. */
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const header = document.querySelector("header");
    if (!el || !header) return;
    const measure = () => {
      el.style.setProperty(
        "--page-header-offset",
        `${Math.ceil(header.getBoundingClientRect().height)}px`,
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  /* Keyed remount — always start the page at its top. Runs when the NEW
     page is actually mounted (AnimatePresence mode="wait"), so this is also
     the correct moment to move focus to the fresh #main — except when the
     ←/→ tour handed over a pending step, which takes precedence (below). */
  useEffect(() => {
    window.scrollTo(0, 0);
    scrollRef.current?.scrollTo(0, 0);
    lastY.current = 0;

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
      landOnNavItem(pending === 1 ? items[0] : items[items.length - 1]);
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

  /* Feed the internal scroll position to chrome (Header, Footer). */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const now = performance.now();
      const dt = now - lastTime.current;
      lastTime.current = now;
      const dy = el.scrollTop - lastY.current;
      lastY.current = el.scrollTop;
      const velocity = dt > 0 ? Math.min(Math.abs(dy / dt) * 1000, 5000) : 0;
      const state: PageScrollState = {
        y: el.scrollTop,
        velocity,
        direction: dy > 0.5 ? "down" : dy < -0.5 ? "up" : "idle",
        isScrolling: true,
      };
      emitPageScroll(state);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        emitPageScroll({
          ...state,
          velocity: 0,
          direction: "idle",
          isScrolling: false,
        });
      }, 300);
    });
  }, []);

  const variants: Variants = {
    enter: (dir: RouteDirection) => ({
      opacity: 0,
      y: dir === "back" ? -28 : 28,
    }),
    center: {
      opacity: [0, 1, 0.35, 1],
      y: 0,
      transition: {
        opacity: { duration: 0.3, times: [0, 0.25, 0.5, 1], ease: "easeOut" },
        y: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
      },
    },
    exit: {
      opacity: 0,
      y: -36,
      transition: { duration: 0.18, ease: "easeIn" },
    },
  };

  const cdPath = route.path === "/" ? "~" : route.path;

  return (
    <motion.div
      ref={scrollRef}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      onScroll={handleScroll}
      className="page-scroll relative h-screen h-[100dvh] overflow-y-auto overflow-x-hidden pt-[var(--page-header-offset,0px)] pb-8 bg-transparent"
    >
      {/* Cursor-typed destination line, drawn while the page boots in. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ opacity: { duration: 0.55, times: [0, 0.1, 0.75, 1] } }}
        className="pointer-events-none select-none absolute top-[calc(var(--page-header-offset,0px)+1rem)] left-gutter lg:left-block z-20 flex items-center gap-2 text-body font-mono"
        aria-hidden="true"
      >
        <span className="text-accent-text">$</span>
        <span className="overflow-hidden whitespace-nowrap text-text-dim">
          <motion.span
            className="inline-block whitespace-nowrap overflow-hidden align-bottom"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.22, delay: 0.03, ease: "linear" }}
          >
            cd {cdPath}
          </motion.span>
        </span>
      </motion.div>

      {/* CRT scanline sweep on entry. */}
      <motion.div
        initial={{ top: "-18%" }}
        animate={{ top: "112%" }}
        transition={{ duration: 0.26, delay: 0.02, ease: "linear" }}
        className="pointer-events-none absolute inset-x-0 h-20 z-10 opacity-40"
        style={{
          background:
            "linear-gradient(to bottom, transparent, color-mix(in srgb, var(--color-text) 5%, transparent) 40%, color-mix(in srgb, var(--color-text) 12%, transparent) 50%, color-mix(in srgb, var(--color-text) 5%, transparent) 60%, transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 min-h-full flex flex-col">{children}</div>
    </motion.div>
  );
}
