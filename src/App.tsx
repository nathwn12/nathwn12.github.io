import {
  Component,
  lazy,
  Suspense,
  useEffect,
  type ComponentType,
  type ReactNode,
} from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { CommandPalette } from "./components/CommandPalette";
import { PageShell } from "./components/PageShell";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { NotFound } from "./components/NotFound";
import { useRoute, useAdjacentNavigation, routeByPath } from "./lib/router";
import { createPageNavHandler } from "./lib/keyboardNav";
import {
  motionPreferenceToMode,
  resolveReduceMotion,
  useMotionPreference,
} from "./lib/motionPreference";

/**
 * route.id → section component — one "page" per route.
 *
 * The landing page (Hero) is imported statically: it has no Framer Motion and
 * costs ~1.6 kB gz, so keeping it in the entry chunk puts the first screen's JS
 * on the critical path instead of a serial fetch after the entry (est.
 * +200–350 ms mobile LCP). It also removes the `Loading…` flash on first paint.
 *
 * The other routes stay `React.lazy`-loaded so their JS ships in its own
 * chunk rather than the first-paint bundle; the shared shell (Header/Footer/
 * PageShell) and the router stay in the entry chunk too.
 */
const PAGES: Record<string, ComponentType> = {
  hero: Hero,
  experience: lazy(() =>
    import("./components/Experience").then((m) => ({ default: m.Experience })),
  ),
  skills: lazy(() => import("./components/Skills").then((m) => ({ default: m.Skills }))),
  projects: lazy(() => import("./components/Projects")),
  contact: lazy(() => import("./components/Contact").then((m) => ({ default: m.Contact }))),
  thanks: lazy(() => import("./components/Thanks").then((m) => ({ default: m.Thanks }))),
};

/** Static, non-animated fallback shown while a page chunk is in flight. */
function PageFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-label text-text-muted">
      Loading…
    </div>
  );
}

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

/**
 * Error boundary around the routed content only: content is visible by default,
 * so a failed animation cannot hide it. A failed lazy chunk import — GH Pages
 * answers a missing /assets/*.js with 404.html — would otherwise leave the
 * Suspense fallback up forever and blank the SPA. The fallback is static (no
 * motion, no dependencies) and offers a hard link home, which re-fetches the
 * entry bundle. It remounts on every route change because PageShell is keyed by
 * route.path, so the error clears when the user leaves.
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
          className="mx-auto w-full max-w-[68ch] px-gutter py-section"
        >
          <div className="rounded-lg border border-border bg-surface p-block">
            <h1 className="text-headline font-semibold text-text">
              This page didn&rsquo;t load
            </h1>
            <p className="mt-block max-w-[65ch] text-body text-text-muted">
              Its script may be missing, or the network dropped mid-fetch.
              Returning home re-fetches the bundle.
            </p>
            <a
              href="/"
              className="mt-block flex min-h-11 w-fit items-center text-body font-semibold text-accent-text hover:underline"
            >
              Back to home
            </a>
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
  /* The visitor's motion intent. The OS reduced-motion query no longer gates
     this site (owner order 2026-10-14): motionPreference.ts reads the one
     always-animated intent as MotionConfig's "never" below and as the `false`
     every hand-rolled gate in the tree reads, so the Framer runtime and the tree
     cannot diverge. Nothing here reads the OS query — not even framer's
     `useReducedMotion()` — so no listener is registered for a value no branch
     can use. */
  const [motionPreference] = useMotionPreference();
  /* ↑/↓ scrolls the internal page container. The gate is the same
     always-animated intent, so the scroll never drops to an instant jump. */
  const reduceMotion = resolveReduceMotion(motionPreference, false);

  /* ←/→ walks the page's item tour ([data-nav-item], DOM-driven) and rolls
     over into the adjacent page when the current page's items are exhausted;
     ↑/↓ + Home/End scroll the internal page container (80vH section step).
     Never hijack keys while typing or while the mobile menu is open (guard in
     keyboardNav.ts). */
  useEffect(() => {
    const onKey = createPageNavHandler({ goNext, goPrev, reduceMotion });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, reduceMotion]);

  const Content = routeByPath(route.path) ? (PAGES[route.id] ?? PAGES.hero) : NotFound;

  return (
    <div className="bg-bg relative flex h-dvh flex-col">
      <MotionConfig reducedMotion={motionPreferenceToMode(motionPreference)}>
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

        <CommandPalette />

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

        <Footer />
      </MotionConfig>
    </div>
  );
}
