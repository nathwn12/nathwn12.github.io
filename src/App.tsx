import {
  Component,
  lazy,
  Suspense,
  useEffect,
  type ComponentType,
  type ReactNode,
} from "react";
import { AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion";
import { PageShell } from "./components/PageShell";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { CommandTerminal } from "./components/CommandTerminal";
import { Hero } from "./components/Hero";
import { NotFound } from "./components/NotFound";
import { useRoute, useAdjacentNavigation, routeByPath } from "./lib/router";
import { createPageNavHandler } from "./lib/keyboardNav";

/**
 * route.id → section component — one "page" per route.
 *
 * The landing page (Hero) is imported statically: it has no Framer Motion and
 * costs ~1.6 kB gz, so keeping it in the entry chunk puts the first screen's JS
 * on the critical path instead of a serial fetch after the entry (est.
 * +200–350 ms mobile LCP). It also removes the `Loading…` flash on first paint.
 *
 * The other four routes stay `React.lazy`-loaded so their JS ships in its own
 * chunk rather than the first-paint bundle; the shared shell (Header/Footer/
 * CommandTerminal/PageShell) and the router stay in the entry chunk too.
 */
const PAGES: Record<string, ComponentType> = {
  hero: Hero,
  experience: lazy(() =>
    import("./components/Experience").then((m) => ({ default: m.Experience })),
  ),
  skills: lazy(() => import("./components/Skills").then((m) => ({ default: m.Skills }))),
  projects: lazy(() => import("./components/Projects")),
  contact: lazy(() => import("./components/Contact").then((m) => ({ default: m.Contact }))),
};

/** Static, non-animated fallback shown while a page chunk is in flight. */
function PageFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-label uppercase tracking-widest text-text-muted">
      Loading…
    </div>
  );
}

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

/**
 * Error boundary around the routed content only (DESIGN §10: "content is
 * visible by default so a failed animation cannot hide it"). A failed lazy
 * chunk import — GH Pages answers a missing /assets/*.js with 404.html — would
 * otherwise leave the Suspense fallback up forever and blank the SPA. The
 * fallback is static (no motion, no dependencies) and offers a hard link home,
 * which re-fetches the entry bundle. It remounts on every route change because
 * PageShell is keyed by route.path, so the error clears when the user leaves.
 */
class PageErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section
          role="alert"
          className="mx-auto w-full max-w-5xl px-gutter py-section"
        >
          <div className="border border-border-accent bg-bg">
            <div className="border-b border-border px-gutter py-block">
              <h1 className="text-title font-bold text-text">
                bash: ./page: No such file or directory
              </h1>
              <p className="mt-half max-w-2xl text-body text-text-dim">
                This page failed to load. Its script may be missing or the
                network dropped mid-fetch.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-half px-gutter py-block">
              <span className="text-label text-text-muted">$</span>
              <a
                href="/"
                className="border border-border-accent px-gutter py-half text-label text-accent-text transition-colors duration-150 hover:bg-accent/10 active:bg-accent/20"
              >
                cd ~/home
              </a>
            </div>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { route, direction } = useRoute();
  const { goNext, goPrev } = useAdjacentNavigation();
  const reduceMotion = useReducedMotion();

  /* ←/→ navigates between pages; ↑/↓ + Home/End scroll the internal page
     container (80vH section step). Never hijack keys while typing or while
     the terminal overlay / mobile menu is open (guard in keyboardNav.ts;
     CommandTerminal keeps its own ↑/↓ history on its input). */
  useEffect(() => {
    const onKey = createPageNavHandler({
      goNext,
      goPrev,
      reduceMotion: reduceMotion ?? false,
    });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, reduceMotion]);

  const Content = routeByPath(route.path) ? (PAGES[route.id] ?? PAGES.hero) : NotFound;

  return (
    <div className="bg-bg min-h-screen font-mono relative">
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

        <Header />

        <AnimatePresence mode="wait" initial={false}>
          <PageShell key={route.path} route={route} direction={direction}>
            <main
              id="main"
              tabIndex={-1}
              className="relative z-10 outline-none flex-1 flex flex-col justify-center"
            >
              <PageErrorBoundary>
                <Suspense fallback={<PageFallback />}>
                  <Content />
                </Suspense>
              </PageErrorBoundary>
            </main>
          </PageShell>
        </AnimatePresence>

        <CommandTerminal />
        <Footer />
      </MotionConfig>
    </div>
  );
}
