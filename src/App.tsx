import { useEffect, useCallback, useState, type ComponentType } from "react";
import { AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion";
import { LoadingScreen } from "./components/LoadingScreen";
import { BackgroundEffects } from "./components/BackgroundEffects";
import { PageShell } from "./components/PageShell";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Experience } from "./components/Experience";
import { Skills } from "./components/Skills";
import Projects from "./components/Projects";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { CommandTerminal } from "./components/CommandTerminal";
import { useRoute, useAdjacentNavigation } from "./lib/router";
import { createPageNavHandler } from "./lib/keyboardNav";

/** route.id → section component — one "page" per route. */
const PAGES: Record<string, ComponentType> = {
  hero: Hero,
  experience: Experience,
  skills: Skills,
  projects: Projects,
  contact: Contact,
};

export default function App() {
  const [booted, setBooted] = useState(false);
  const onComplete = useCallback(() => setBooted(true), []);
  const { route, direction } = useRoute();
  const { goNext, goPrev } = useAdjacentNavigation();
  const reduceMotion = useReducedMotion();

  /* ←/→ navigates between pages; ↑/↓ + Home/End scroll the internal page
     container (80vH section step). Never hijack keys while typing or while
     the terminal overlay / mobile menu is open (guard in keyboardNav.ts;
     CommandTerminal keeps its own ↑/↓ history on its input). */
  useEffect(() => {
    if (!booted) return;
    const onKey = createPageNavHandler({
      goNext,
      goPrev,
      reduceMotion: reduceMotion ?? false,
    });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [booted, goNext, goPrev, reduceMotion]);

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
