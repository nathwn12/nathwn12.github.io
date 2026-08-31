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
        className={`fixed top-0 left-0 right-0 z-50 font-mono transition-colors duration-300 ${
          scrolled
            ? "border-b border-border bg-bg/95 backdrop-blur-sm"
            : "border-b border-border bg-bg"
        }`}
      >
        <div className="flex min-w-0 items-center justify-between gap-3 overflow-hidden px-4 py-1.5 border-b border-border text-[10px] tracking-widest text-text-muted uppercase">
          <span className="flex min-w-0 shrink items-center gap-3 whitespace-nowrap overflow-hidden">
            <span
              className={`hidden sm:inline-block w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                isScrolling ? "bg-accent" : "bg-accent/60"
              }`}
            />
            <span className="hidden sm:inline">sys::resume</span>
            <span className="hidden sm:inline text-border-accent">|</span>
            <span className="truncate">[nathan@portfolio ~]$</span>
          </span>
          <span className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline">{timeStr}</span>
            <span className="hidden sm:inline text-border-accent">|</span>
            <span className="hidden sm:inline">{utcOffset}</span>
            <span className="hidden sm:inline text-border-accent">|</span>
            <span className="text-accent">{activeSection || "HOME"}</span>
            <span className="text-border-accent">|</span>
            <button
              type="button"
              onClick={toggleThemeHandler}
              aria-label="Switch color scheme"
              title="Toggle color scheme (F2)"
              className="flex items-center gap-1.5 whitespace-nowrap uppercase transition-colors duration-300 hover:text-accent"
            >
              <span className="text-border-accent">[F2]</span>
              <span>theme:{theme}</span>
            </button>
          </span>
        </div>

        <div className="flex items-center justify-between px-4 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 mr-1">
              <span
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isScrolling ? "bg-accent-3" : "bg-accent-3/70"
                }`}
              />
              <span
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isScrolling ? "bg-accent-2" : "bg-accent-2/70"
                }`}
              />
              <span
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isScrolling ? "bg-accent" : "bg-accent/70"
                }`}
              />
            </div>
            <button
              onClick={() => navigateTo("/")}
              className="text-sm font-bold tracking-tighter text-text flex items-center gap-2 group"
            >
              <span className="text-accent text-xs">$</span>
              <span className="group-hover:text-accent transition-colors duration-300">
                NNL
              </span>
              <span className="text-accent text-xs">_</span>
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-0">
            {navItems.map((item, i) => (
              <button
                key={item.label}
                onClick={() => navigateTo(item.path)}
                className={`relative px-4 py-2 text-xs tracking-widest transition-all duration-300 border-l border-border ${
                  activeSection === item.label
                    ? "text-accent bg-accent/5"
                    : "text-text-dim hover:text-text hover:bg-text/5 hover:translate-x-[4px]"
                }`}
              >
                <span className="text-border-accent mr-2">^{i + 1}</span>
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
            className="md:hidden flex flex-col gap-1.5 p-2 group"
          >
            <span
              className={`block w-5 h-[2px] bg-text-dim transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`}
            />
            <span
              className={`block w-5 h-[2px] bg-text-dim transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-5 h-[2px] bg-text-dim transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
            />
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
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden border-t border-border"
            >
              <div className="flex flex-col">
                {navItems.map((item, i) => (
                  <button
                    key={item.label}
                    onClick={() => navigateTo(item.path)}
                    className={`px-4 py-3 text-xs tracking-widest border-b border-border transition-all duration-300 text-left ${
                      activeSection === item.label
                        ? "text-accent bg-accent/5"
                        : "text-text-dim hover:text-text hover:bg-text/5 hover:translate-x-[4px]"
                    }`}
                  >
                    <span className="text-border-accent mr-3">^{i + 1}</span>
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
