import { usePageScroll } from "../lib/pageScroll";
import { navigate } from "../lib/router";
import { CONTACT_EMAIL } from "../lib/contact";
import { useState, useEffect } from "react";

/**
 * tmux-style persistent status bar - always pinned to the bottom of the
 * viewport (never scrolls with page content), like the canonical real
 * terminal bottom bar. Carries the tmux status flavor: session name,
 * idle state, uptime, key hints, and quick actions.
 */
export function Footer() {
  const { isScrolling } = usePageScroll();
  const [idle, setIdle] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (isScrolling) setIdle(false);
    const t = setTimeout(() => setIdle(true), 5000);
    return () => clearTimeout(t);
  }, [isScrolling]);

  /* K2: live local clock — 1s tick, cleaned up on unmount. */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const uptimeDays = Math.floor(
    (Date.now() - new Date("2023-03-01").getTime()) / 86400000,
  );
  const clockStr = now.toLocaleTimeString("en-US", { hour12: false });

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 h-8 border-t border-border-accent bg-surface font-mono text-micro tracking-wider text-text-dim select-none">
      <div className="h-full max-w-7xl mx-auto px-gutter flex items-center justify-between gap-gutter overflow-hidden">
        <div className="flex items-center gap-half shrink-0">
          <span aria-hidden="true" className="text-text-muted">
            [0]
          </span>
          <span className="text-text-muted hidden sm:inline">~/nathwn12</span>
          <span
            aria-hidden="true"
            className="text-text-muted hidden sm:inline"
          >
            |
          </span>
          <button
            onClick={() => navigate("/")}
            className="text-label text-text-dim hover:text-text active:text-text transition-colors duration-150 cursor-pointer"
          >
            $ cd ~/home
          </button>
        </div>

        <div className="items-center gap-half hidden md:flex shrink-0">
          <span
            aria-hidden="true"
            className={`w-quarter h-quarter inline-block transition-colors duration-150 ${
              idle ? "bg-text-muted" : "bg-accent"
            }`}
          />
          <span>{idle ? "SYSTEM IDLE" : "SYSTEM ACTIVE"}</span>
          <span className="text-text-muted">UPTIME: {uptimeDays} DAYS</span>
          <span className="text-text-muted hidden lg:inline">
            {"[<- -> PAGE] [UP/DOWN SECTION]"}
          </span>
        </div>

        <div className="flex items-center gap-half shrink-0">
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("toggle-terminal"))
            }
            className="text-label text-text-dim hover:text-text active:text-text transition-colors duration-150 cursor-pointer"
            title="Toggle command terminal (Ctrl+K)"
          >
            &gt;_ TERMINAL
          </button>
          <span
            aria-hidden="true"
            className="text-text-muted hidden sm:inline"
          >
            |
          </span>
          <div className="items-center gap-half hidden sm:flex">
            <span className="tabular-nums">{clockStr}</span>
            <span
              aria-hidden="true"
              className="text-text-muted select-none"
            >
              █
            </span>
            <a
              href="https://github.com/nathwn12"
              target="_blank"
              rel="noopener noreferrer"
              className="text-label hover:text-text active:text-text transition-colors duration-150"
            >
              github
            </a>
            <a
              href="https://www.linkedin.com/in/nathaniel-nikolai-l-184181261/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline text-label hover:text-text active:text-text transition-colors duration-150"
            >
              linkedin
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hidden xl:inline text-label hover:text-text active:text-text transition-colors duration-150"
            >
              email
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
