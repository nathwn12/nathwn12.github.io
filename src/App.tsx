import {
  Component,
  useRef,
  useEffect,
  type ComponentType,
  type ReactNode,
} from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Record } from "./components/Record";
import { Experience } from "./components/Experience";
import Projects from "./components/Projects";
import { NotFound } from "./components/NotFound";
import { applyRouteMeta, routeByPath, useRoute } from "./lib/router";

/**
 * App — the shell around the record and its two detail routes.
 *
 * The redesign moved the site from "five pages, each locked to one viewport
 * with an internal scroller" to a normal document scroll: the home page is one
 * long record, and a nested scroller would have trapped the address bar, the
 * native scrollbar and the browser's own scroll restoration. The page fades in
 * once on mount (CSS, opacity only), and nothing animates on route change.
 *
 * All three routes are imported eagerly. Splitting the two detail routes saved
 * about 6 kB of markup and cost a chunk waterfall on navigation: the fallback
 * painted, then the page replaced it, which moved a third of the viewport on a
 * route the visitor had already asked for. One bundle means the route is there
 * on the click.
 */

const PAGES: Record<string, ComponentType> = {
  record: Record,
  experience: Experience,
  projects: Projects,
};

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

/**
 * Error boundary around the routed content only. A render failure in one route
 * would otherwise blank the whole SPA; the fallback is static and offers a hard
 * link home.
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
  const { route } = useRoute();
  const firstRender = useRef(true);

  /* Per-route document.title + meta. */
  useEffect(() => {
    applyRouteMeta(route);
  }, [route]);

  /* A route change starts at the top, and focus moves to the new page so a
     keyboard or screen-reader visitor is not left on the old page's link.
     Skipped on the FIRST render: focusing main on load would place the tab
     order after the skip link and the header nav, so a keyboard visitor could
     never reach them with Tab. */
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [route.path]);

  const Content = routeByPath(route.path) ? (PAGES[route.id] ?? Record) : NotFound;

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

      <Header />

      <main id="main" tabIndex={-1} className="outline-none">
        <PageErrorBoundary>
          <Content />
        </PageErrorBoundary>
      </main>

      <Footer routeId={route.id} />
    </>
  );
}
