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
 * Adding a route here therefore updates the app AND the prerendered build
 * output; the two cannot drift apart.
 */

export interface RouteDef {
  path: string;
  id: string;
  /** Short nav label (Header tabs) */
  label: string;
  /** Shell-style identifier rendered as the row name in the 404 index listing */
  command: string;
  /** One-line summary rendered under `command` in the 404 index listing */
  description: string;
  /** Recruiter-facing 1-2 sentence description for per-route SEO meta */
  metaDescription: string;
  /** Tailwind accent token for bordered chrome, e.g. "accent-2" */
  accent: string;
  /** document.title when this page is active */
  title: string;
}

/** Full name — single source for every document.title suffix. */
const FULL_NAME = "Nathaniel Nikolai Ladero";

/** index.html default meta content — kept verbatim for home-route parity.
   Keep in sync with index.html's <head> if either is edited. */
export const HOME_META_DESCRIPTION =
  "Backend systems that hold up in production - plus the plugins, MCP servers, and tools built around them.";
export const HOME_OG_TITLE =
  "Nathaniel Nikolai Ladero | Systems & Developer Tools";
export const HOME_OG_DESCRIPTION =
  "Backend systems that hold up in production - plus the plugins, MCP servers, and tools built around them.";

export const ROUTES: readonly RouteDef[] = [
  {
    path: "/",
    id: "hero",
    label: "HOME",
    command: "whoami",
    description: "Identity & system profile",
    metaDescription: HOME_META_DESCRIPTION,
    accent: "accent",
    title: `Home — ${FULL_NAME}`,
  },
  {
    path: "/experience",
    id: "experience",
    label: "EXP",
    command: "journalctl -u career.service --no-pager",
    description: "Service journal",
    metaDescription:
      "Formerly a Backend Developer at Xentra Infotech Solutions Inc. — ASP.NET Web APIs, gRPC, SignalR, and RabbitMQ, including a 98% payment-query latency cut.",
    accent: "accent",
    title: `Experience — ${FULL_NAME}`,
  },
  {
    path: "/skills",
    id: "skills",
    label: "SKILLS",
    command: "systemctl --type=service --state=running",
    description: "Installed packages",
    metaDescription:
      "Backend and DevOps skill set — C#, ASP.NET Core, .NET, MySQL/Redis/RabbitMQ, AWS, Docker, GitHub Actions, security and auth, plus AI-assisted development workflow.",
    accent: "accent-3",
    title: `Skills — ${FULL_NAME}`,
  },
  {
    path: "/projects",
    id: "projects",
    label: "PROJECTS",
    command: "ls -la projects/",
    description: "Open-source work",
    metaDescription:
      "Open-source work on github.com/nathwn12 — MCP tool servers, OpenCode plugins, and solo-built apps and tools, featured work first.",
    accent: "accent-4",
    title: `Projects — ${FULL_NAME}`,
  },
  {
    path: "/contact",
    id: "contact",
    label: "CONTACT",
    command: "mutt -f inbox",
    description: "Mail user agent",
    metaDescription:
      "Contact Nathaniel Nikolai Ladero — Backend Developer open to work. Direct email, GitHub, or LinkedIn.",
    accent: "accent-2",
    title: `Contact — ${FULL_NAME}`,
  },
] as const;

/**
 * Synthesized route for URLs that match no registered path. It is NOT part of
 * ROUTES: `navigate()` still refuses unknown paths (routeByPath is the
 * validator) and `routeIndex` keeps clamping navigation to the five real
 * routes. `resolveRoute` only shapes what the shell renders, carrying the
 * requested path so the typed `cd` overlay and the 404 body echo the exact URL.
 */
export const NOT_FOUND_ROUTE: RouteDef = {
  path: "/not-found",
  id: "notfound",
  label: "404",
  command: "cd <unknown>",
  description: "No such file or directory",
  metaDescription:
    "This path doesn't exist on nathwn12.github.io — return to the portfolio home for the index of pages.",
  accent: "accent-3",
  title: `Not found — ${FULL_NAME}`,
};

/**
 * The relay confirmation at `/thanks`. NOT part of ROUTES — the header nav,
 * the PageFoot pager, and the five-route nav test all read ROUTES, and a
 * confirmation is not a destination anyone navigates to. `routeByPath` and
 * `resolveRoute` recognise it explicitly so the relay form's success path
 * lands on a real page (and the build emits `dist/thanks/index.html`, so a
 * direct visit answers 200 here too).
 */
export const THANKS_ROUTE: RouteDef = {
  path: "/thanks",
  id: "thanks",
  label: "THANKS",
  command: "echo received",
  description: "Message received",
  metaDescription:
    "Your message is on its way — Nathaniel Nikolai Ladero usually answers within a day or two.",
  accent: "accent-2",
  title: `Thanks — ${FULL_NAME}`,
};
