import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "ABOUT", href: "#about" },
  { label: "EXP", href: "#experience" },
  { label: "FOOTPRINT", href: "#footprint" },
  { label: "SKILLS", href: "#skills" },
  { label: "PROJECTS", href: "#projects" },
  { label: "EDUCATION", href: "#education" },
  { label: "CONTACT", href: "#contact" },
];

export function Header() {
  const [time, setTime] = useState(new Date());
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      const ids = navItems.map((n) => n.href.slice(1));
      for (const id of ids.reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 200) {
          setActiveSection(id.toUpperCase());
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }, []);

  const timeStr = time.toLocaleTimeString("en-US", { hour12: false });

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`fixed top-0 left-0 right-0 z-50 font-mono transition-all duration-500 ${
          scrolled
            ? "border-b border-border bg-bg/90 backdrop-blur-xl"
            : "border-b border-border bg-bg"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-1.5 border-b border-border text-[10px] tracking-widest text-text-muted uppercase">
          <span className="flex items-center gap-3">
            <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <span>sys::resume</span>
            <span className="text-border-accent">|</span>
            <span>v1.0.0</span>
          </span>
          <span className="flex items-center gap-3">
            <span>{timeStr}</span>
            <span className="text-border-accent">|</span>
            <span>UTC{new Date().getTimezoneOffset() > 0 ? "-" : "+"}{Math.abs(new Date().getTimezoneOffset() / 60)}</span>
            <span className="text-border-accent">|</span>
            <span className="text-accent">{activeSection || "HOME"}</span>
          </span>
        </div>

        <div className="flex items-center justify-between px-4 lg:px-8 py-3">
          <button
            onClick={() => scrollTo("hero")}
            className="text-sm font-bold tracking-tighter text-white flex items-center gap-2 group"
          >
            <span className="text-accent text-xs group-hover:animate-pulse">$</span>
            <span className="group-hover:text-accent transition-colors duration-300">NNL</span>
            <span className="cursor-blink text-accent text-xs">_</span>
          </button>

          <nav className="hidden md:flex items-center gap-0">
            {navItems.map((item, i) => (
              <button
                key={item.label}
                onClick={() => scrollTo(item.href.slice(1))}
                className={`relative px-4 py-2 text-xs tracking-widest transition-all duration-300 border-l border-border ${
                  activeSection === item.label
                    ? "text-accent bg-accent/5"
                    : "text-text-dim hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-border-accent mr-2">
                  {(i + 1).toString().padStart(2, "0")}
                </span>
                {item.label}
                {activeSection === item.label && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"
                    transition={{ duration: 0.3 }}
                  />
                )}
              </button>
            ))}
          </nav>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2 group"
          >
            <span className={`block w-5 h-[2px] bg-text-dim transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
            <span className={`block w-5 h-[2px] bg-text-dim transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-[2px] bg-text-dim transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
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
                    onClick={() => scrollTo(item.href.slice(1))}
                    className={`px-4 py-3 text-xs tracking-widest border-b border-border transition-all duration-300 text-left ${
                      activeSection === item.label
                        ? "text-accent bg-accent/5"
                        : "text-text-dim hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="text-border-accent mr-3">
                      {(i + 1).toString().padStart(2, "0")}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>
      <div className={`${menuOpen ? "h-[340px]" : "h-[88px]"} transition-all duration-300`} />
    </>
  );
}
