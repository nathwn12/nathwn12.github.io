import {
  useCallback,
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from "react";

/**
 * Minimal History-API router for the page-per-viewport portfolio.
 *
 * Each section is a real path (`/`, `/experience`, …) so URLs are
 * shareable, the browser back/forward buttons work, and a refresh on any
 * route lands the visitor back on that page (GitHub Pages serves the SPA via
 * the `404.html` fallback produced by the build; see scripts/copy-404.mjs).
 *
 * No dependency — 5 route defs, pushState, and a popstate listener.
 */

export type RouteDirection = "forward" | "back" | "none";

export interface RouteDef {
  path: string;
  id: string;
  /** Short nav label (Header tabs) */
  label: string;
  /** Terminal command displayed as the page's "section header" */
  command: string;
  /** Short description used in `ls` listing (CommandTerminal) — visible copy */
  description: string;
  /** Recruiter-facing 1-2 sentence description for per-route SEO meta */
  metaDescription: string;
  /** Tailwind accent token for bordered chrome, e.g. "accent-2" */
  accent: string;
  /** document.title when this page is active */
  title: string;
}

/** index.html default meta content — kept verbatim for home-route parity.
   Keep in sync with index.html's <head> if either is edited. */
export const HOME_META_DESCRIPTION =
  "Terminal-themed portfolio of Nathaniel Nikolai Ladero — Backend Developer specializing in C#, ASP.NET Core, and fintech systems.";
export const HOME_OG_TITLE = "Nathaniel Nikolai Ladero | Backend Developer";
export const HOME_OG_DESCRIPTION =
  "Backend Developer with 3 years building secure fintech systems in C# and ASP.NET Core. APIs, microservices, and production delivery.";

export const ROUTES: readonly RouteDef[] = [
  {
    path: "/",
    id: "hero",
    label: "HOME",
    command: "whoami",
    description: "Identity & system profile",
    metaDescription: HOME_META_DESCRIPTION,
    accent: "accent",
    title: "NNL — Backend Developer",
  },
  {
    path: "/experience",
    id: "experience",
    label: "EXP",
    command: "journalctl -u career.service --no-pager",
    description: "Service journal",
    metaDescription:
      "Production backend engineering at Xentra Infotech Solutions Inc. — ASP.NET Web APIs, gRPC, SignalR, and RabbitMQ, including a 98% payment-query latency cut.",
    accent: "accent",
    title: "experience — NNL",
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
    title: "skills — NNL",
  },
  {
    path: "/projects",
    id: "projects",
    label: "PROJECTS",
    command: "ls -la projects/",
    description: "Production highlights",
    metaDescription:
      "Production projects — payments latency migration (98% cut), fintech service platform, auth hardening with zero high/critical Snyk findings, and a Redis-backed read cache layer.",
    accent: "accent-4",
    title: "projects — NNL",
  },
  {
    path: "/contact",
    id: "contact",
    label: "CONTACT",
    command: "mutt -f inbox",
    description: "Mail user agent",
    metaDescription:
      "Contact Nathaniel Nikolai Ladero — Backend Developer open to work. Message through the site form, direct email, GitHub, or LinkedIn.",
    accent: "accent-2",
    title: "contact — NNL",
  },
] as const;

/** Tolerant path normalization: "/" for root, no trailing slash. */
export function normalizePath(pathname: string): string {
  let p = pathname.split("?")[0] ?? "/";
  try {
    p = decodeURIComponent(p);
  } catch {
    /* malformed URI — fall through */
  }
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p === "" ? "/" : p;
}

const LEGACY_PATHS: Readonly<Record<string, string>> = {
  "/about": "/",
  /* Deleted pages (phase-2): deep links, inbound shares, and cached SEO
     entries for /education + /footprint canonicalize to the live home route
     at load (history.replaceState below) instead of 404-ing into the hero.
     See sitemap.xml — those URLs were dropped from the 6-URL sitemap. */
  "/education": "/",
  "/footprint": "/",
};

function canonicalPath(path: string): string {
  const normalized = normalizePath(path);
  return LEGACY_PATHS[normalized] ?? normalized;
}

export function routeByPath(path: string): RouteDef | undefined {
  return ROUTES.find((r) => r.path === canonicalPath(path));
}

export function routeIndex(path: string): number {
  const i = ROUTES.findIndex((r) => r.path === canonicalPath(path));
  return i === -1 ? 0 : i;
}

export function routeAtOffset(fromPath: string, offset: number): RouteDef {
  const idx = routeIndex(fromPath);
  const target = Math.min(ROUTES.length - 1, Math.max(0, idx + offset));
  return ROUTES[target];
}

/** Navigation history stack — used to infer back vs forward on popstate. */
const initialPath = normalizePath(window.location.pathname);
const canonicalInitialPath = canonicalPath(initialPath);
if (canonicalInitialPath !== initialPath) {
  window.history.replaceState(null, "", canonicalInitialPath);
}

const historyStack: string[] = [canonicalInitialPath];
let currentPath = historyStack[0];
let currentDirection: RouteDirection = "none";

const listeners = new Set<() => void>();

function setState(path: string, direction: RouteDirection) {
  currentPath = path;
  currentDirection = direction;
  listeners.forEach((l) => l());
}

function onPopState() {
  const initialPath = normalizePath(window.location.pathname);
  const path = canonicalPath(initialPath);
  if (path !== initialPath) {
    window.history.replaceState(null, "", path);
  }
  if (path === currentPath) return;

  const idx = historyStack.lastIndexOf(path);
  if (idx === -1) {
    // Unknown entry (fresh deep link) — treat as a forward visit.
    historyStack.push(path);
    setState(path, "forward");
    return;
  }
  const back = idx < historyStack.length - 1;
  historyStack.length = idx + 1;
  setState(path, back ? "back" : "forward");
}

window.addEventListener("popstate", onPopState);

export interface RouterState {
  path: string;
  route: RouteDef;
  direction: RouteDirection;
}

/** Navigate to a route path. No-op when already there or path is unknown. */
export function navigate(to: string): void {
  const path = canonicalPath(to);
  if (!routeByPath(path)) return; // unknown path — ignore
  if (path === currentPath) return;
  const dir: RouteDirection =
    routeIndex(path) < routeIndex(currentPath) ? "back" : "forward";

  if (historyStack[historyStack.length - 1] === path) {
    history.replaceState(null, "", path);
    setState(path, dir);
    return;
  }

  historyStack.push(path);
  history.pushState(null, "", path);
  setState(path, dir);
}

/** Subscribe to route changes. Returns current route + direction. */
export function useRoute(): RouterState {
  const [state, setLocal] = useState<RouterState>({
    path: currentPath,
    route: routeByPath(currentPath) ?? ROUTES[0],
    direction: currentDirection,
  });

  useEffect(() => {
    const update = () => {
      setLocal({
        path: currentPath,
        route: routeByPath(currentPath) ?? ROUTES[0],
        direction: currentDirection,
      });
    };
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  return state;
}

/** Navigate to the next (offset=1) or previous (offset=-1) page in order. */
export function useAdjacentNavigation() {
  const { path } = useRoute();
  const goNext = useCallback(() => {
    const next = routeAtOffset(path, 1);
    if (next.path !== canonicalPath(path)) navigate(next.path);
  }, [path]);
  const goPrev = useCallback(() => {
    const prev = routeAtOffset(path, -1);
    if (prev.path !== canonicalPath(path)) navigate(prev.path);
  }, [path]);
  return { goNext, goPrev };
}

interface RouteLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

/** Anchor that performs an app-level route change instead of a page reload. */
export function RouteLink({ href, onClick, ...rest }: RouteLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    )
      return;
    e.preventDefault();
    navigate(href);
    onClick?.(e);
  };
  return <a href={href} onClick={handleClick} {...rest} />;
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Apply the active route's document.title + per-route SEO meta
 * (description / og:title / og:description). The home route keeps the
 * index.html defaults verbatim for single-source parity; every other route
 * uses its recruiter-facing `metaDescription`. Called from PageShell's keyed
 * mount effect — the only moment the new page's DOM exists (`mode="wait"`).
 */
export function applyRouteMeta(route: RouteDef): void {
  document.title = route.title;
  if (route.path === "/") {
    setMeta("name", "description", HOME_META_DESCRIPTION);
    setMeta("property", "og:title", HOME_OG_TITLE);
    setMeta("property", "og:description", HOME_OG_DESCRIPTION);
    return;
  }
  setMeta("name", "description", route.metaDescription);
  setMeta("property", "og:title", `${route.label} — ${HOME_OG_TITLE}`);
  setMeta("property", "og:description", route.metaDescription);
}
