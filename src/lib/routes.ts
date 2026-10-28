/**
 * Route table — the single source of the site's public paths.
 *
 * Deliberately pure data: no React, no `window`, no router state, no imports.
 * The router (`./router.tsx`) owns matching and history; this module owns the
 * route definitions so the build can read them too —
 * `scripts/prerender-routes.mjs` imports this file and emits one
 * `dist/<path>/index.html` per entry, which is what makes every route answer
 * HTTP 200 on GitHub Pages instead of falling back to `404.html`.
 *
 * The site is one page plus two records: the cover (which carries the summary,
 * selected work, about, and contact), the full nine-entry experience log, and
 * the eleven-project archive. Contact is a section on the cover, not a route.
 *
 * Old public paths are not routes any more. They are listed in `REDIRECTS` and
 * emitted as meta-refresh stubs by the same build step, so no existing link
 * dies while the sitemap advertises only the three live routes.
 */

export type RouteId = "home" | "record" | "work" | "notfound";

export interface RouteDef {
  path: string;
  id: RouteId;
  /** Sentence-case nav label. */
  label: string;
  /** Recruiter-facing 1-2 sentence description for per-route SEO meta */
  metaDescription: string;
  /** document.title when this page is active */
  title: string;
}

/** Full name — single source for every document.title suffix. */
const FULL_NAME = "Nathaniel Nikolai Ladero";

export const SITE_URL = "https://nathwn12.github.io";

/** index.html default meta content — kept verbatim for home-route parity.
   Keep in sync with index.html's <head> if either is edited. */
export const HOME_META_DESCRIPTION =
  "Backend developer with three years building and running fintech payment systems in production. C#, ASP.NET Core, MySQL, Redis, RabbitMQ, AWS. Résumé, CV, and contact.";
export const HOME_OG_TITLE = "Nathaniel Nikolai Ladero | backend developer";
export const HOME_OG_DESCRIPTION = HOME_META_DESCRIPTION;

export const ROUTES: readonly RouteDef[] = [
  {
    path: "/",
    id: "home",
    label: "Home",
    metaDescription: HOME_META_DESCRIPTION,
    title: HOME_OG_TITLE,
  },
  {
    path: "/record",
    id: "record",
    label: "Record",
    metaDescription:
      "Three years building and running fintech systems in production: nine entries, newest first, each pairing its outcome with the moves behind it. Formerly a Backend Developer at Xentra Infotech Solutions Inc.",
    title: `The record | ${FULL_NAME}`,
  },
  {
    path: "/work",
    id: "work",
    label: "Work",
    metaDescription:
      "Eleven projects published under github.com/nathwn12: MCP tool servers, OpenCode plugins, and solo-built apps and tools, featured work first.",
    title: `Work | ${FULL_NAME}`,
  },
] as const;

/**
 * Header destinations. Contact is a place on the cover, so its href carries the
 * section hash; the other two are routes. Labels are the prototype's three:
 * Record, Work, Contact.
 */
export const NAV_ITEMS: readonly { label: string; href: string }[] = [
  { label: "Record", href: "/record" },
  { label: "Work", href: "/work" },
  { label: "Contact", href: "/#contact" },
] as const;

/**
 * Paths that were public before this direction and must keep answering. The
 * build emits `dist/<from>/index.html` as a minimal stub: `<meta http-equiv
 * ="refresh">` plus a canonical link to the destination. `canonical` is always
 * an absolute site URL; `to` may carry the home-page `#contact` anchor.
 */
export interface RedirectDef {
  from: string;
  to: string;
  canonical: string;
}

export const REDIRECTS: readonly RedirectDef[] = [
  {
    from: "/experience",
    to: "/record",
    canonical: `${SITE_URL}/record`,
  },
  {
    from: "/projects",
    to: "/work",
    canonical: `${SITE_URL}/work`,
  },
  {
    /* Skills and Forward now live only in the CV; the home cover is the
       nearest truthful destination. */
    from: "/skills",
    to: "/",
    canonical: `${SITE_URL}/`,
  },
  {
    /* The contact form is gone; the cover's contact section is the replacement. */
    from: "/contact",
    to: "/#contact",
    canonical: `${SITE_URL}/`,
  },
  {
    /* The relay confirmation route retired with the form. */
    from: "/thanks",
    to: "/",
    canonical: `${SITE_URL}/`,
  },
] as const;

/** Absolute canonical URL for a live route. Home keeps its trailing slash. */
export function canonicalFor(path: string): string {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

/**
 * Synthesized route for URLs that match no registered path. It is NOT part of
 * ROUTES: `navigate()` still refuses unknown paths (routeByPath is the
 * validator) and the sitemap lists only the three live routes.
 */
export const NOT_FOUND_ROUTE: RouteDef = {
  path: "/not-found",
  id: "notfound",
  label: "Not found",
  metaDescription:
    "This path doesn't exist on nathwn12.github.io — return to the portfolio home for the record and the work.",
  title: `Not found | ${FULL_NAME}`,
};
