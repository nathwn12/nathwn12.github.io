import { useEffect, useCallback, useState, type ComponentType } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { LoadingScreen } from "./components/LoadingScreen";
import { BackgroundEffects } from "./components/BackgroundEffects";
import { PageShell } from "./components/PageShell";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Experience } from "./components/Experience";
import { Footprint } from "./components/Footprint";
import { Skills } from "./components/Skills";
import Projects from "./components/Projects";
import Education from "./components/Education";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { CommandTerminal } from "./components/CommandTerminal";
import { useRoute, useAdjacentNavigation } from "./lib/router";

/** route.id → section component — one "page" per route. */
const PAGES: Record<string, ComponentType> = {
  hero: Hero,
  experience: Experience,
  footprint: Footprint,
  skills: Skills,
  projects: Projects,
  education: Education,
  contact: Contact,
};

export default function App() {
  const [booted, setBooted] = useState(false);
  const onComplete = useCallback(() => setBooted(true), []);
  const { route, direction } = useRoute();
  const { goNext, goPrev } = useAdjacentNavigation();

  /* ←/→ navigates between pages. Never hijack keys while typing. */
  useEffect(() => {
    if (!booted) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }
      /* Don't page-navigate while the terminal overlay or mobile menu is open. */
      if (
        document.querySelector("[data-terminal-panel]") ||
        document.querySelector("[data-mobile-menu]")
      ) {
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [booted, goNext, goPrev]);

  const Content = PAGES[route.id] ?? Hero;

  return (
    <div className="bg-bg min-h-screen font-mono relative bg-grid">
      <MotionConfig reducedMotion="user">
        <a
          href="#main"
          className="skip-to-content"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("main")?.focus({ preventScroll: true });
            document.querySelector(".page-scroll")?.scrollTo(0, 0);
          }}
        >
          Skip to content
        </a>

        <BackgroundEffects />

        <AnimatePresence>
          {!booted && <LoadingScreen onComplete={onComplete} />}
        </AnimatePresence>

        {booted && <Header />}

        <AnimatePresence mode="wait" initial={false}>
          {booted && (
            <PageShell key={route.path} route={route} direction={direction}>
              <main
                id="main"
                tabIndex={-1}
                className="relative z-10 outline-none flex-1 flex flex-col justify-center"
              >
                <Content />
              </main>
            </PageShell>
          )}
        </AnimatePresence>

        {booted && <CommandTerminal />}
        {booted && <Footer />}
      </MotionConfig>
    </div>
  );
}
