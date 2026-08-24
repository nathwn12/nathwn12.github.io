import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { emitPageScroll, type PageScrollState } from "../lib/pageScroll";
import type { RouteDef, RouteDirection } from "../lib/router";

interface PageShellProps {
  route: RouteDef;
  direction: RouteDirection;
  children: ReactNode;
}

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

  /* Keyed remount — always start the page at its top. Runs when the NEW
     page is actually mounted (AnimatePresence mode="wait"), so this is also
     the correct moment to move focus to the fresh #main. */
  useEffect(() => {
    window.scrollTo(0, 0);
    scrollRef.current?.scrollTo(0, 0);
    lastY.current = 0;
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [route.path]);

  useEffect(() => {
    document.title = route.title;
  }, [route.title]);

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
        opacity: { duration: 0.38, times: [0, 0.25, 0.5, 1], ease: "easeOut" },
        y: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
      },
    },
    exit: {
      opacity: 0,
      y: -36,
      transition: { duration: 0.22, ease: "easeIn" },
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
      className="page-scroll relative h-[100dvh] overflow-y-auto overflow-x-hidden pt-[88px] pb-8 bg-transparent"
    >
      {/* Cursor-typed destination line, drawn while the page boots in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ opacity: { duration: 0.7, times: [0, 0.1, 0.75, 1] } }}
        className="pointer-events-none select-none absolute top-[104px] left-4 lg:left-8 z-20 flex items-center gap-2 text-xs font-mono"
        aria-hidden="true"
      >
        <span className="text-accent">$</span>
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
        <span className="terminal-cursor text-accent font-bold">█</span>
      </motion.div>

      {/* CRT scanline sweep on entry */}
      <motion.div
        initial={{ top: "-18%" }}
        animate={{ top: "112%" }}
        transition={{ duration: 0.3, delay: 0.02, ease: "linear" }}
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
