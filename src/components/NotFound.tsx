import { navigate, ROUTES, useRoute } from "../lib/router";

/**
 * Terminal-flavored 404 — rendered by App when the URL matches no route.
 * The router keeps the requested path on the synthesized route, so the page
 * echoes the exact path in a real `bash: cd:` error and then offers the
 * surviving directories through `ls ~/` instead of a dead end.
 *
 * Brutalist restyle: no ambient gradient, named scale steps only, one accent
 * (the `$` prompt and the primary `cd ~/home` action).
 */
export function NotFound() {
  const { path: requestedPath } = useRoute();

  return (
    <section id="not-found" className="px-gutter py-section">
      <div className="mx-auto max-w-5xl">
        {/* $ cd <path> */}
        <div className="mb-section flex items-center gap-block">
          <span className="text-label text-accent-text">$</span>
          <span className="text-label text-text-dim break-all">
            cd {requestedPath}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="border border-border-accent bg-bg">
          {/* Error output */}
          <div className="border-b border-border px-gutter py-block">
            <h1 className="text-title font-bold text-text break-words">
              bash: cd: {requestedPath}: No such file or directory
            </h1>
            <p className="mt-half max-w-2xl text-body text-text-dim">
              That path doesn&apos;t exist on this system. It may have been
              moved, renamed, or the link that brought you here is stale.
            </p>
          </div>

          {/* Surviving directories */}
          <div className="border-b border-border px-gutter py-block">
            <p className="mb-half flex items-center gap-half text-label text-text-dim">
              <span>$</span>
              <span>ls ~/</span>
            </p>
            <ul
              aria-label="Available pages"
              className="divide-y divide-border border border-border-accent"
            >
              {ROUTES.map((route) => (
                <li key={route.path}>
                  <button
                    type="button"
                    onClick={() => navigate(route.path)}
                    className="group flex w-full items-center gap-gutter px-half py-half text-left transition-colors duration-150 hover:bg-surface active:bg-surface-2"
                  >
                    <span className="w-40 shrink-0 truncate text-label text-text md:w-56">
                      {route.command}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-label text-text-dim">
                      {route.description}
                    </span>
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-text-muted transition-colors duration-150 group-hover:text-accent-text"
                    >
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Primary way home */}
          <div className="flex flex-wrap items-center gap-half px-gutter py-block">
            <span className="text-label text-text-muted">$</span>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="border border-border-accent px-gutter py-half text-label text-accent-text transition-colors duration-150 hover:bg-accent/10 active:bg-accent/20"
            >
              cd ~/home
            </button>
            <span className="text-label text-text-muted">
              or press ←/→ to browse
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
