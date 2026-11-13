import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ROUTES, RouteLink, useRoute } from "../lib/router";
import { revealRule } from "../lib/motion";

/**
 * Not found — a recorder that lost the track.
 *
 * The requested path survives from the router, so a mistyped address is visible
 * in the sentence instead of a generic apology. Two real ways back, then the
 * record's own route list as a mono readout: the three paths that do exist,
 * printed as data rather than offered as a second navigation.
 *
 * The page is instant. One hairline draws in and nothing else moves — a 404
 * that performs is a 404 mocking the visitor. `document.title`, the canonical
 * and `noindex` are the shell's job (`applyRouteMeta`), not this component's.
 */
export function NotFound() {
  const { path: requestedPath } = useRoute();
  const ruleRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const rule = revealRule(ruleRef.current);
      return () => rule.revert();
    },
    { dependencies: [] },
  );

  return (
    <section className="band band--first" aria-labelledby="not-found-heading">
      <div className="frame">
        <div className="lg:max-w-[var(--rec-prose-measure)]">
          <p className="data text-[color:var(--rec-ink-muted)]">404</p>

          <h1
            id="not-found-heading"
            className="mt-4 font-display text-[clamp(2.75rem,1.4rem+5.4vw,6.5rem)] leading-[0.9] tracking-[-0.02em]"
          >
            No such track.
          </h1>

          <span
            ref={ruleRef}
            aria-hidden="true"
            className="rule rule--draw mt-8"
          />

          <p className="prose mt-6 text-[color:var(--rec-ink-muted)]">
            The address{" "}
            <span className="break-all font-mono text-[color:var(--rec-ink)]">
              {requestedPath}
            </span>{" "}
            does not exist on this record.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2">
            <RouteLink href="/" className="button">
              The record
            </RouteLink>
            <RouteLink href="/experience" className="text-action">
              Experience
            </RouteLink>
          </div>
        </div>

        <div className="mt-14 border-t border-[color:var(--rec-rule)] pt-5">
          <p className="data text-[color:var(--rec-ink-muted)]">
            Routes on this record
          </p>
          <ul className="data mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[color:var(--rec-ink)]">
            {ROUTES.map((route) => (
              <li key={route.path}>{route.path}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
