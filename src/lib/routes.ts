/**
 * Route table — the single source of the site's public paths.
 *
 * Deliberately pure data: no React, no `window`, no router state, no imports.
 * The router (`./router.tsx`) owns matching and history; this module owns the
 * route definitions so the build can read them too —
 * `scripts/prerender-routes.mjs` imports this file and emits one
 * `dist/<path>/index.html` per entry, rewriting the head per route, which is
 * what makes every route answer HTTP 200 on GitHub Pages with its own
 * canonical instead of all pointing at `/`.
 *
 * The redesign cut five routes to two detail routes plus the record: the home
 * page is one continuous document (identity, proof, work, atlas, forward,
 * credentials, contact), and `/experience` and `/projects` carry the long-form
 * material that would have made that record too tall.
 *
 * What the old site published but no longer warrants a page lives in
 * {@link RETIRED_ROUTES}: `/skills` and `/contact` are bands of the record now,
 * `/thanks` existed only for the relay form that has been retired, and three
 * earlier pages were folded into the record. Every one of them still answers
 * 200 — as a redirect stub with a meta refresh, a canonical and `noindex` —
 * so an old inbound link lands on the content instead of the 404 body.
 */

export interface RouteDef {
  path: string;
  id: string;
  /** Short shell identifier (kept for tests and document titles). */
  label: string;
  /** Recruiter-facing 1-2 sentence description for per-route SEO meta */
  metaDescription: string;
  /** document.title when this page is active */
  title: string;
}

/** The origin every canonical, og:url and sitemap entry is built from. */
export const SITE_ORIGIN = "https://nathwn12.github.io";

/** Absolute canonical URL for a route path. Root keeps its single slash. */
export function canonicalFor(path: string): string {
  return `${SITE_ORIGIN}${path === "/" ? "/" : path}`;
}

/** Full name — single source for every document.title suffix. */
const FULL_NAME = "Nathaniel Nikolai Ladero";

/** index.html default meta content — kept verbatim for home-route parity.
   Keep in sync with index.html's <head> if either is edited. */
export const HOME_META_DESCRIPTION =
  "Backend developer for payment and cash-management systems that ran in production — and the author of eleven open-source developer tools.";
export const HOME_OG_DESCRIPTION = HOME_META_DESCRIPTION;

export const ROUTES: readonly RouteDef[] = [
  {
    path: "/",
    id: "record",
    label: "RECORD",
    metaDescription: HOME_META_DESCRIPTION,
    title: `The record — ${FULL_NAME}`,
  },
  {
    path: "/experience",
    id: "experience",
    label: "EXPERIENCE",
    metaDescription:
      "Formerly a Backend Developer at Xentra Infotech Solutions Inc. — ASP.NET Web APIs, gRPC, SignalR, and RabbitMQ, including a 98% payment-query latency cut.",
    title: `Experience — ${FULL_NAME}`,
  },
  {
    path: "/projects",
    id: "projects",
    label: "PROJECTS",
    metaDescription:
      "Open-source work on github.com/nathwn12 — MCP tool servers, OpenCode plugins, and solo-built apps and tools, featured work first.",
    title: `Projects — ${FULL_NAME}`,
  },
] as const;

export interface RetiredRoute {
  /** The URL the old site published. */
  path: string;
  /** Absolute canonical every SEO signal points at. */
  canonical: string;
  /** Where the stub sends the visitor — a band of the record, or the top. */
  target: string;
  /** One sentence for the stub body: where the content went. */
  reason: string;
}

/**
 * Published URLs that are no longer pages.
 *
 * `/skills` and `/contact` are bands of the record; `/thanks` was the relay
 * form's confirmation and the relay form is retired; `/about`, `/education` and
 * `/footprint` were folded into the record before that. Each keeps a stub so a
 * search result or a five-year-old link still reaches the material.
 */
export const RETIRED_ROUTES: readonly RetiredRoute[] = [
  {
    path: "/skills",
    canonical: `${SITE_ORIGIN}/`,
    target: "/#atlas",
    reason: "The full package list is the system atlas on the record.",
  },
  {
    path: "/contact",
    canonical: `${SITE_ORIGIN}/`,
    target: "/#contact",
    reason: "Contact is the last band of the record.",
  },
  {
    path: "/thanks",
    canonical: `${SITE_ORIGIN}/`,
    target: "/",
    reason: "The contact form is retired; messages go by email.",
  },
  {
    path: "/about",
    canonical: `${SITE_ORIGIN}/`,
    target: "/",
    reason: "The record opens with who this is.",
  },
  {
    path: "/education",
    canonical: `${SITE_ORIGIN}/`,
    target: "/#credentials",
    reason: "Education and the four credentials close the record.",
  },
  {
    path: "/footprint",
    canonical: `${SITE_ORIGIN}/`,
    target: "/",
    reason: "The record carries the same provenance.",
  },
] as const;

/** The retired paths, for the router's canonicalization and the build. */
export const RETIRED_ROUTE_PATHS = RETIRED_ROUTES.map((route) => route.path);

/**
 * Synthesized route for URLs that match no registered path. It is NOT part of
 * ROUTES: `navigate()` still refuses unknown paths (`routeByPath` is the
 * validator). `resolveRoute` only shapes what the shell renders, carrying the
 * requested path so the 404 body echoes the exact URL.
 */
export const NOT_FOUND_ROUTE: RouteDef = {
  path: "/not-found",
  id: "notfound",
  label: "404",
  metaDescription:
    "This path doesn't exist on nathwn12.github.io — return to the portfolio home for the record.",
  title: `Not found — ${FULL_NAME}`,
};
