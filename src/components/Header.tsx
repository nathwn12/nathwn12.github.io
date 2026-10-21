import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES, navigate, useRoute } from "../lib/router";
import { RESUME_PATH } from "../lib/contact";
import { requestPaletteOpen } from "../lib/palette";
import { navName } from "../lib/navNames";
import { fadeIn } from "../lib/motion";

const navItems = ROUTES.filter((route) => route.path !== "/");

/** Running-head folio per section — the sheet number of the live page. */
const FOLIOS: Record<string, string> = {
  hero: "00",
  experience: "06",
  skills: "07",
  projects: "08",
  contact: "09",
  thanks: "—",
  notfound: "404",
};

/* Chrome container, declared once: the gutters sit OUTSIDE the page measure,
   matching the band containers (src/components/InstrumentBand.tsx), so the
   chrome rule spans the viewport while the chrome text shares the bands'
   content edge: at `lg` the text sits past the 3rem gutter plus the 2rem
   hairline clearance (5rem; 6rem at `xl`). Shared by the top bar and the
   mobile menu so the two chrome edges cannot drift apart. */
const GUTTER = "px-6 lg:px-10";
const CONTAINER = "mx-auto w-full max-w-[80rem]";

/**
 * ScrollProgress — the 1px instrument reading pinned above the header,
 * filling left→right with the page's scroll progress.
 *
 * Driven by `transform: scaleX()` on a single fill element (compositor only —
 * never width, never layout), updated from the PageShell scroller's scroll
 * position on scroll/resize via rAF. The scroller is resolved live on every
 * sync (capture-phase document listener), so route remounts need no
 * re-subscription. Under `prefers-reduced-motion: reduce` the line is
 * static: track only, fill parked at zero, no listener attached.
 */
function ScrollProgress() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      fill.style.transform = "scaleX(0)";
      return;
    }
    let raf = 0;
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const scroller = document.querySelector(".page-scroll");
        if (!(scroller instanceof HTMLElement)) return;
        const max = scroller.scrollHeight - scroller.clientHeight;
        const progress =
          max > 0
            ? Math.min(1, Math.max(0, scroller.scrollTop / max))
            : 0;
        fill.style.transform = `scaleX(${progress})`;
      });
    };
    sync();
    document.addEventListener("scroll", sync, { capture: true, passive: true });
    window.addEventListener("resize", sync);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("scroll", sync, { capture: true });
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-px">
      <div
        ref={fillRef}
        className="h-px w-full origin-left bg-accent-text"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}

/**
 * Header — the wordmark and the page nav, on a solid ground.
 *
 * No translucency, no shadow, no scroll-reactive restyle: the chrome is
 * static, and the only rule is the 1px Line hairline under it. The active
 * page is the header's one Claret moment, and in the nav row it never rides
 * on color alone: a 2px Claret rule is drawn under the nav label (the
 * marker), the label weight steps to semibold, and `aria-current="page"`
 * carries it to assistive tech. The marker's rule is reserved on every nav
 * item — transparent when inactive — so the row never shifts as the route
 * changes. The marker belongs to the NAV ITEMS only.
 *
 * Home is the wordmark, so `/` is marked there, but never by the marker: the
 * wordmark carries its active state by colour alone (`text-accent-text`)
 * plus `aria-current` — the nav row is every route but Home, so the wordmark
 * is where Home's active state lives.
 *
 * The menu's one move is the shared opacity fade — `fadeIn` from
 * src/lib/motion, never a duration written here — and it runs on every open
 * (owner order 2026-10-14: the OS reduced-motion query no longer gates this
 * site).
 *
 * The theme control lives in the footer, not here — the footer owns the
 * colophon, the theme control, and the safe-area pad.
 */
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { route } = useRoute();
  const homeActive = route.path === "/";

  /** The active-state marker: a 2px Claret rule under the label, with the
      rule reserved (transparent) when inactive so the row never shifts. A nav
      label is one line — never wrap mid-phrase, which would break the reserved
      rule's alignment with the text. */
  const marker = (active: boolean) =>
    `whitespace-nowrap border-b-2 pb-0.5 transition-colors duration-nav ${
      active ? "border-accent-text" : "border-transparent"
    }`;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const navigateTo = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg">
      <ScrollProgress />
      {/* Gutters sit outside the page measure, matching the band containers
          (InstrumentBand.tsx): the chrome rule spans the viewport while the
          chrome text keeps the bands' content edge. */}
      <div className={GUTTER}>
        <div className={`${CONTAINER} flex items-center justify-between gap-6`}>
          <button
            type="button"
            onClick={() => navigateTo("/")}
            aria-current={homeActive ? "page" : undefined}
            className={`flex min-h-11 min-w-0 items-center rounded-xs py-2 text-left transition-colors duration-nav ${
              homeActive ? "text-accent-text" : "text-text hover:text-accent-text"
            }`}
            aria-label="Nathaniel Nikolai Ladero — home"
          >
            <span className="truncate text-title font-semibold">
              Nathaniel Nikolai Ladero
            </span>
          </button>

          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Pages">
              {navItems.map((item) => {
                const active = route.path === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigateTo(item.path)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center rounded-xs px-3 text-label transition-colors duration-nav ${
                      active
                        ? "font-semibold text-accent-text"
                        : "font-medium text-text hover:text-accent-text hover:underline"
                    }`}
                  >
                    <span className={marker(active)}>
                      {navName(item.id, item.label)}
                    </span>
                  </button>
                );
              })}
            </nav>

            <a
              href={RESUME_PATH}
              download="Nathaniel-Nikolai-Ladero-Resume.pdf"
              className="hidden min-h-11 items-center px-3 text-label font-medium text-text hover:text-accent-text hover:underline lg:flex"
            >
              Résumé
            </a>

            <button
              type="button"
              onClick={() => requestPaletteOpen()}
              aria-label="Open command palette (Control K)"
              title="Open command palette (Ctrl K)"
              className="hidden min-h-11 items-center gap-2 rounded-xs px-3 text-label text-text-muted transition-colors duration-nav hover:text-accent-text hover:underline lg:flex"
            >
              <span className="font-medium">Command</span>
              <kbd className="rounded-xs border border-border px-1.5 py-0.5 font-medium">
                ⌘K
              </kbd>
            </button>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="flex min-h-11 items-center gap-2 rounded-xs px-3 text-label font-medium text-text transition-colors duration-nav hover:text-accent-text hover:underline lg:hidden"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                {menuOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
                )}
              </svg>
              <span>{menuOpen ? "Close" : "Menu"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Running head: the 32px mono bar under the header, naming the
          live section and its folio. Static chrome — no motion. */}
      <div className="running-head flex items-center border-t border-border bg-bg">
        <div className={GUTTER}>
          <div className={CONTAINER}>
            <p className="truncate font-mono text-micro uppercase text-text-muted">
              {navName(route.id, route.label)} —{" "}
              {FOLIOS[route.id] ?? "—"}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="mobile-nav"
            data-mobile-menu
            aria-label="Pages"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="border-t border-border bg-bg lg:hidden"
          >
            <div className={GUTTER}>
              <div className={`${CONTAINER} flex flex-col`}>
                {navItems.map((item) => {
                  const active = route.path === item.path;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => navigateTo(item.path)}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center border-b border-border text-left text-label transition-colors duration-nav last:border-b-0 ${
                        active
                          ? "font-semibold text-accent-text"
                          : "font-medium text-text hover:text-accent-text"
                      }`}
                    >
                      <span className={marker(active)}>
                        {navName(item.id, item.label)}
                      </span>
                    </button>
                  );
                })}
                <a
                  href={RESUME_PATH}
                  download="Nathaniel-Nikolai-Ladero-Resume.pdf"
                  className="flex min-h-11 items-center border-b border-border text-left text-label font-medium text-text transition-colors duration-nav hover:text-accent-text"
                >
                  Résumé — PDF
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    menuButtonRef.current?.focus();
                    requestPaletteOpen();
                  }}
                  className="flex min-h-11 items-center justify-between border-b border-border text-left text-label font-medium text-text transition-colors duration-nav last:border-b-0 hover:text-accent-text"
                >
                  <span>Command palette</span>
                  <kbd className="rounded-xs border border-border px-1.5 py-0.5">
                    ⌘K
                  </kbd>
                </button>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
