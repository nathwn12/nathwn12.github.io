import { Component, useEffect, type ReactNode } from "react";
import { Chrome } from "./components/Chrome";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ChapterStage } from "./components/stage/ChapterStage";
import { applyRouteMeta, ROUTES } from "./lib/router";

/**
 * App — one URL, five chapters.
 *
 * The revamp publishes one document. The two paths that used to be pages are
 * chapters now, so a deep link to /experience or /projects is folded into the
 * chapter anchor it became before first paint; the address bar then names the
 * one page the site actually serves. The masthead is the rail, the stage is the
 * record, and the footer is the colophon. No route change, curtain or scroll
 * reset runs here — the stage owns the reading position.
 */

/** Retired detail path → the chapter anchor that carries its content. */
const RETIRED_ANCHORS: Readonly<Record<string, string>> = {
  "/experience": "#experience",
  "/projects": "#work",
};

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

/**
 * Error boundary around the stage only. A render failure would otherwise blank
 * the whole shell; the fallback is static and offers a hard link home.
 */
class PageErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section role="alert" className="band frame">
          <h1 className="h2">This page didn&rsquo;t load</h1>
          <p className="prose mt-4">
            Something went wrong while drawing it. Reloading the page starts
            the record again.
          </p>
          <a href="/" className="button mt-6">
            Back to the record
          </a>
        </section>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  useEffect(() => {
    applyRouteMeta(ROUTES[0]);
    const anchor = RETIRED_ANCHORS[window.location.pathname];
    if (anchor) {
      window.history.replaceState(null, "", `/${anchor}`);
    }
  }, []);

  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus({ preventScroll: true });
          window.scrollTo(0, 0);
        }}
      >
        Skip to content
      </a>

      <Chrome />
      <Header />

      <main id="main" tabIndex={-1} className="stage-shell outline-none">
        <PageErrorBoundary>
          <ChapterStage />
        </PageErrorBoundary>
      </main>

      <Footer />
    </>
  );
}
