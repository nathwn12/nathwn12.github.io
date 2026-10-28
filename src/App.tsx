import { useLayoutEffect, useRef } from "react";
import { NotFound } from "./components/NotFound";
import { RecordPage } from "./components/RecordPage";
import { SiteChrome } from "./components/SiteChrome";
import { WorkPage } from "./components/WorkPage";
import { Home } from "./pages/Home";
import { useEntrances } from "./lib/reveal";
import { applyRouteMeta, useRoute } from "./lib/router";

/**
 * The shell: a skip link, the focusable main landmark, and one routed page.
 * Each route change scrolls to the top (or to the contact section when the
 * Contact destination is used), applies the route's title/meta/canonical, and
 * starts the entrance observer.
 *
 * No pager, no palette, no theme layer: the document scrolls normally and the
 * three header links are the navigation.
 */
export default function App() {
  const { route, path } = useRoute();
  const firstRender = useRef(true);
  useEntrances(path);

  useLayoutEffect(() => {
    const first = firstRender.current;
    firstRender.current = false;
    const contact = window.location.hash === "#contact";
    window.scrollTo(0, 0);
    applyRouteMeta(route);
    if (contact) {
      requestAnimationFrame(() => {
        const section = document.getElementById("contact");
        if (!section) return;
        section.focus({ preventScroll: true });
        section.scrollIntoView({ block: "start" });
      });
      return;
    }
    /* First paint leaves focus where the browser put it, so the skip link is
       the first Tab stop. A route change moves focus to the fresh main. */
    if (!first) document.getElementById("main")?.focus({ preventScroll: true });
  }, [path, route]);

  return (
    <div className="app">
      <a
        className="skip"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus({ preventScroll: true });
          window.scrollTo(0, 0);
        }}
      >
        Skip to content
      </a>

      <SiteChrome />

      <main id="main" tabIndex={-1}>
        <div className="route" key={path}>
          {route.id === "home" ? (
            <Home />
          ) : route.id === "record" ? (
            <RecordPage />
          ) : route.id === "work" ? (
            <WorkPage />
          ) : (
            <NotFound />
          )}
        </div>
      </main>
    </div>
  );
}
