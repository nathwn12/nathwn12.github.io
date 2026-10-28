import { RouteLink, useRoute } from "../lib/router";

/**
 * Not found — the plain 404.
 *
 * The requested path survives from the router (`resolveRoute` echoes it), so a
 * mistyped address is visible in the sentence. One action returns to the
 * record; the header already carries every real destination.
 */
export function NotFound() {
  const { path: requestedPath } = useRoute();

  return (
    <section id="not-found" className="band" aria-labelledby="not-found-heading">
      <div className="frame">
        <p
          aria-hidden="true"
          className="text-[clamp(3rem,12vw,7rem)] leading-none font-semibold tracking-[-0.06em] text-text-muted"
        >
          404
        </p>
        <h1 id="not-found-heading" className="h1 mt-6">
          This page does not exist
        </h1>
        <p className="prose mt-4">
          Nothing lives at{" "}
          <span className="bg-surface-2 px-2 py-0.5 break-all font-medium">
            {requestedPath}
          </span>{" "}
          — the address may be mistyped, or the page may have moved.
        </p>
        <RouteLink href="/" className="button mt-8">
          Back to the record
        </RouteLink>
      </div>
    </section>
  );
}
