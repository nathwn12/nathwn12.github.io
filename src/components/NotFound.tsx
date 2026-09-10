import { motion } from "framer-motion";
import { navigate, ROUTES, useRoute } from "../lib/router";

/**
 * Terminal-flavored 404 — rendered by App when the URL matches no route.
 * The router keeps the requested path on the synthesized route, so the page
 * echoes the exact path in a real `bash: cd:` error and then offers the
 * surviving directories through `ls ~/` instead of a dead end.
 */
export function NotFound() {
  const { path: requestedPath } = useRoute();

  return (
    <section
      id="not-found"
      className="py-8 md:py-12 px-4 lg:px-8 relative overflow-hidden"
    >
      <div
        className="section-ambient"
        style={{
          background: `
            radial-gradient(ellipse at 30% 40%, color-mix(in srgb, var(--color-accent-3) 7%, transparent) 0%, color-mix(in srgb, var(--color-accent-3) 2%, transparent) 40%, transparent 65%),
            radial-gradient(ellipse at 80% 70%, color-mix(in srgb, var(--color-accent) 3%, transparent) 0%, transparent 50%)
          `,
        }}
      />
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-4 mb-12"
        >
          <span className="text-accent-3-text text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim break-all">
            cd {requestedPath}
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
          className="border border-border-accent bg-bg"
        >
          {/* Error output */}
          <div className="px-4 md:px-6 py-5 border-b border-border">
            <h1 className="text-xs md:text-sm font-bold text-accent-3-text break-words">
              bash: cd: {requestedPath}: No such file or directory
            </h1>
            <p className="mt-3 text-xs leading-relaxed text-text-dim max-w-2xl">
              That path doesn&apos;t exist on this system. It may have been
              moved, renamed, or the link that brought you here is stale.
            </p>
          </div>

          {/* Surviving directories */}
          <div className="px-4 md:px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3 text-[10px] text-text-dim">
              <span className="text-accent-text">$</span>
              <span>ls ~/</span>
            </div>
            <ul
              aria-label="Available pages"
              className="divide-y divide-border border border-border-accent"
            >
              {ROUTES.map((route) => (
                <li key={route.path}>
                  <button
                    type="button"
                    onClick={() => navigate(route.path)}
                    className="group flex w-full items-center gap-3 md:gap-6 px-3 md:px-4 py-2.5 text-left transition-colors duration-200 hover:bg-accent/5 active:bg-accent/10"
                  >
                    <span className="w-40 md:w-56 shrink-0 truncate text-[10px] text-accent-text">
                      {route.command}
                    </span>
                    <span className="flex-1 min-w-0 text-[10px] text-text-dim truncate">
                      {route.description}
                    </span>
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-text-muted transition-colors duration-200 group-hover:text-accent-text"
                    >
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Primary way home */}
          <div className="flex flex-wrap items-center gap-3 px-4 md:px-6 py-4">
            <span className="text-accent-text text-xs">$</span>
            <motion.button
              type="button"
              onClick={() => navigate("/")}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="border border-accent/30 bg-accent/10 px-4 py-2 text-[10px] tracking-widest text-accent-text transition-colors duration-300 hover:border-accent/60 hover:bg-accent/20"
            >
              cd ~/home
            </motion.button>
            <span className="text-[10px] tracking-widest text-text-muted">
              or press ←/→ to browse
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
