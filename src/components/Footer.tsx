import { motion } from "framer-motion";
import { usePageScroll } from "../lib/pageScroll";
import { navigate } from "../lib/router";
import { useState, useEffect } from "react";

/**
 * tmux-style persistent status bar - always pinned to the bottom of the
 * viewport (never scrolls with page content), like the canonical real
 * terminal bottom bar. Carries the system-monitor flavor: session name,
 * idle state, uptime, load stats, and quick actions.
 */
export function Footer() {
  const { isScrolling } = usePageScroll();
  const [idle, setIdle] = useState(true);

  useEffect(() => {
    if (isScrolling) setIdle(false);
    const t = setTimeout(() => setIdle(true), 5000);
    return () => clearTimeout(t);
  }, [isScrolling]);

  const uptimeDays = Math.floor(
    (Date.now() - new Date("2023-03-01").getTime()) / 86400000,
  );

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 h-8 border-t border-border-accent bg-surface/95 backdrop-blur-sm font-mono text-[10px] tracking-wider text-text-dim select-none">
      <div className="h-full max-w-7xl mx-auto px-3 flex items-center justify-between gap-4 overflow-hidden">
        <div className="flex items-center gap-3 shrink-0">
          <span aria-hidden="true" className="text-accent">
            [0]
          </span>
          <span className="text-text-muted hidden sm:inline">~/nathwn12</span>
          <span
            aria-hidden="true"
            className="text-border-accent hidden sm:inline"
          >
            |
          </span>
          <motion.button
            onClick={() => navigate("/")}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.95 }}
            className="text-text-dim hover:text-accent transition-colors cursor-pointer"
          >
            $ cd ~/home
          </motion.button>
        </div>

        <div className="items-center gap-3 hidden md:flex shrink-0">
          <span
            className={`w-1.5 h-1.5 rounded-full inline-block transition-colors duration-300 ${
              idle ? "bg-accent" : "bg-accent-3"
            }`}
          />
          <span>{idle ? "SYSTEM IDLE" : "SYSTEM ACTIVE"}</span>
          <span className="text-border-accent">UPTIME: {uptimeDays} DAYS</span>
          <span className="text-border-accent hidden lg:inline">
            MEM: 45% | TASKS: 4 | PROCS: 17
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("toggle-terminal"))
            }
            className="text-text-dim hover:text-accent transition-colors cursor-pointer"
            title="Toggle command terminal (Ctrl+K)"
          >
            &gt;_ TERMINAL
          </button>
          <span
            aria-hidden="true"
            className="text-border-accent hidden sm:inline"
          >
            |
          </span>
          <div className="items-center gap-3 hidden sm:flex">
            <a
              href="https://github.com/nathwn12"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              github
            </a>
            <a
              href="https://www.linkedin.com/in/nathaniel-nikolai-l-184181261/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline hover:text-accent-2 transition-colors"
            >
              linkedin
            </a>
            <a
              href="mailto:nathanielnikolai.ladero@gmail.com"
              className="hidden xl:inline hover:text-accent-2 transition-colors"
            >
              email
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
