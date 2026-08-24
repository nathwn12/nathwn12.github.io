import { motion } from "framer-motion";
import { usePageScroll } from "../lib/pageScroll";
import { navigate } from "../lib/router";
import { useState, useEffect } from "react";
import { TerminalWindow } from "./TerminalWindow";

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
    <footer className="py-10 px-4 lg:px-8 border-t border-border relative overflow-hidden bg-surface">
      <div className="max-w-5xl mx-auto">
        <TerminalWindow title="system-monitor">
          <div className="flex items-center gap-2 justify-center mb-6">
            <span className="text-accent text-xs">$</span>
            <motion.button
              onClick={() => navigate("/")}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.95 }}
              className="text-xs tracking-widest text-text-dim hover:text-accent transition-colors duration-300"
            >
              cd ~/home
            </motion.button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-dim">
            <div className="flex items-center gap-4">
              <span
                className={`w-2 h-2 rounded-full inline-block transition-colors duration-300 ${
                  idle ? "bg-accent" : "bg-accent-3"
                }`}
              />
              <span>{idle ? "SYSTEM IDLE" : "SYSTEM ACTIVE"}</span>
              <span className="hidden sm:inline text-border-accent">|</span>
              <span className="hidden sm:inline text-border-accent">
                UPTIME: {uptimeDays} DAYS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-border-accent">MEM: 45%</span>
              <span className="text-border-accent">|</span>
              <span className="text-border-accent">TASKS: 4</span>
              <span className="text-border-accent">|</span>
              <span className="text-border-accent">PROCS: 17</span>
              <span className="text-border-accent">|</span>
              <button
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("toggle-terminal"))
                }
                className="text-text-dim hover:text-accent transition-colors text-[10px] tracking-wider cursor-pointer"
                title="Toggle command terminal (Ctrl+K)"
              >
                &gt;_ TERMINAL
              </button>
            </div>
            <div>NNL · {new Date().getFullYear()} · LUZON, PH</div>
            <div className="font-mono text-text-dim/50">
              <a
                href="https://github.com/nathwn12"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                github/nathwn12
              </a>
              <span className="mx-2">·</span>
              <a
                href="https://www.linkedin.com/in/nathaniel-nikolai-l-184181261/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent-2 transition-colors"
              >
                linkedin
              </a>
            </div>
          </div>
        </TerminalWindow>
      </div>
    </footer>
  );
}
