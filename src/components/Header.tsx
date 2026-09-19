import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePageScroll } from "../lib/pageScroll";
import { ROUTES, navigate, useRoute } from "../lib/router";
import { useTheme } from "../lib/theme";

const navItems = ROUTES.filter((route) => route.path !== "/");

const utcOffset = (() => {
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  return `UTC${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
})();

export function Header() {
  const [time, setTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { y, isScrolling } = usePageScroll();
  const { route } = useRoute();
  const [theme, applyTheme] = useTheme();
  const scrolled = y > 50;
  const activeSection = route.label;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleThemeHandler = useCallback(() => {
    applyTheme(theme === "dark" ? "light" : "dark");
  }, [theme, applyTheme]);

  /* F2 cycles the color scheme. Never hijack keys while typing or overlays are open. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "F2" || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (
        document.querySelector("[data-terminal-panel]") ||
        document.querySelector("[data-mobile-menu]")
      ) {
        return;
      }
      e.preventDefault();
      toggleThemeHandler();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleThemeHandler]);

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

  const timeStr = time.toLocaleTimeString("en-US", { hour12: false });

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`fixed top-0 left-0 right-0 z-50 font-mono transition-colors duration-150 ${
          scrolled
            ? "border-b border-border-accent bg-bg"
            : "border-b border-border bg-bg"
        }`}
      >
        <div className="flex min-w-0 items-center justify-between gap-half overflow-hidden px-gutter py-quarter border-b border-border text-micro tracking-widest text-text-muted uppercase">
          <span className="flex min-w-0 shrink items-center gap-half whitespace-nowrap overflow-hidden">
            <span
              aria-hidden="true"
              className={`hidden sm:inline-block w-quarter h-quarter transition-colors duration-150 ${
                isScrolling ? "bg-text" : "bg-text-muted"
              }`}
            />
            <span className="hidden sm:inline">sys::resume</span>
            <span className="hidden sm:inline text-text-muted">|</span>
            <span className="truncate">[nathan@portfolio ~]$</span>
          </span>
          <span className="flex shrink-0 items-center gap-half">
            <span className="hidden sm:inline">{timeStr}</span>
            <span className="hidden sm:inline text-text-muted">|</span>
            <span className="hidden sm:inline">{utcOffset}</span>
            <span className="hidden sm:inline text-text-muted">|</span>
            <span className="text-accent-text">{activeSection || "HOME"}</span>
            <span className="text-text-muted">|</span>
            <button
              type="button"
              onClick={toggleThemeHandler}
              title="Toggle color scheme (F2)"
              className="flex items-center gap-quarter whitespace-nowrap uppercase transition-colors duration-150 hover:text-text active:text-text"
            >
              <span className="text-text-muted">[F2]</span>
              <span>theme:{theme}</span>
            </button>
          </span>
        </div>

        <div className="flex items-center justify-between px-gutter lg:px-block py-half">
          <div className="flex items-center gap-half">
            <div className="hidden sm:flex items-center gap-quarter mr-quarter">
              <span
                aria-hidden="true"
                className={`w-quarter h-quarter transition-colors duration-150 ${
                  isScrolling ? "bg-text" : "bg-text-muted"
                }`}
              />
              <span
                aria-hidden="true"
                className={`w-quarter h-quarter transition-colors duration-150 ${
                  isScrolling ? "bg-text" : "bg-text-muted"
                }`}
              />
              <span
                aria-hidden="true"
                className={`w-quarter h-quarter transition-colors duration-150 ${
                  isScrolling ? "bg-text" : "bg-text-muted"
                }`}
              />
            </div>
            <button
              onClick={() => navigateTo("/")}
              className="text-body-lg font-bold text-text flex items-center gap-half group active:opacity-70"
            >
              <span className="text-text-muted text-label">$</span>
              <span className="underline-offset-4 group-hover:underline transition-colors duration-150">
                NNL
              </span>
              <span className="text-text-muted text-label">_</span>
            </button>
          </div>

          <nav className="hidden md:flex items-center">
            {navItems.map((item, i) => (
              <button
                key={item.label}
                onClick={() => navigateTo(item.path)}
                className={`relative px-gutter py-half text-label tracking-widest transition-colors duration-150 border-l border-border ${
                  activeSection === item.label
                    ? "text-text font-bold bg-text/10 border-l-border-accent active:bg-text/20"
                    : "text-text-dim hover:text-text hover:bg-text/5 active:bg-text/10"
                }`}
              >
                <span className="text-text-muted mr-half">^{i + 1}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="md:hidden inline-flex h-8 w-8 items-center justify-center text-label text-text-dim hover:text-text transition-colors duration-150"
          >
            <span aria-hidden="true" className="block w-6 text-center">
              {menuOpen ? "[×]" : "[≡]"}
            </span>
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              id="mobile-nav"
              data-mobile-menu
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="md:hidden overflow-hidden border-t border-border"
            >
              <div className="flex flex-col">
                {navItems.map((item, i) => (
                  <button
                    key={item.label}
                    onClick={() => navigateTo(item.path)}
                    className={`px-gutter py-block text-label tracking-widest border-b border-border transition-colors duration-150 text-left ${
                      activeSection === item.label
                        ? "text-text font-bold bg-text/10 active:bg-text/20"
                        : "text-text-dim hover:text-text hover:bg-text/5 active:bg-text/10"
                    }`}
                  >
                    <span className="text-text-muted mr-half">^{i + 1}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
