import { RouteLink, useRoute } from "../lib/router";

/**
 * Genuinely unknown paths get a real 404 page, not a redirect: the URL is
 * echoed, the header still works, and the way home is one link. Prerendered
 * routes never reach this page (the build emits real HTML per route), and the
 * retired public paths are redirected by their stubs before React runs.
 */
export function NotFound() {
  const { route } = useRoute();

  return (
    <section className="page-head field-paper" aria-labelledby="notfound-title">
      <div className="wrap">
        <h1 id="notfound-title">Not found</h1>
        <p className="lede">
          There is no page at <code>{route.path}</code>.
        </p>
        <p className="former">
          <RouteLink className="text-link" href="/">
            Back to the cover
          </RouteLink>
        </p>
      </div>
    </section>
  );
}
