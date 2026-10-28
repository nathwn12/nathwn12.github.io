import {
  useCallback,
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from "react";
import {
  HOME_META_DESCRIPTION,
  HOME_OG_DESCRIPTION,
  HOME_OG_TITLE,
  NOT_FOUND_ROUTE,
  ROUTES,
  THANKS_ROUTE,
  type RouteDef,
} from "./routes";

/**
 * Minimal History-API router for the page-per-viewport portfolio.
 *
 * Each section is a real path (`/`, `/experience`, …) so URLs are
 * shareable, the browser back/forward buttons work, and a refresh on any
 * route lands the visitor back on that page. Two build steps back that up:
 * `scripts/prerender-routes.mjs` emits a real `dist/<path>/index.html` per
 * route (HTTP 200, not a fallback), and `scripts/copy-404.mjs` keeps
 * `dist/404.html` for genuinely unknown paths.
 *
 * Route definitions live in `./routes` — pure data, importable by the build,
 * covering the five nav routes plus the `/thanks` confirmation route. This
 * module owns matching, history, and per-route meta.
 *
 * No dependency — 5 route defs, pushState, and a popstate listener.
 */

export type RouteDirection = "forward" | "back" | "none";

export type { RouteDef } from "./routes";
export {
  HOME_META_DESCRIPTION,
  HOME_OG_DESCRIPTION,
  HOME_OG_TITLE,
  NOT_FOUND_ROUTE,
  ROUTES,
  THANKS_ROUTE,
};

/**
 * Tolerant path normalization: "/" for root, exactly one trailing slash
 * removed (except for root itself).
 *
 * GitHub Pages answers `/experience/` — either directly from
 * `dist/experience/index.html` or after redirecting `/experience` to it — so
 * the browser can report a trailing slash the route table never stores.
 * Matching on the normalized path is what keeps that URL on the Experience
 * route instead of the not-found route.
 */
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
     See sitemap.xml — those URLs are not listed there. */
  "/education": "/",
  "/footprint": "/",
};

function canonicalPath(path: string): string {
  const normalized = normalizePath(path);
  return LEGACY_PATHS[normalized] ?? normalized;
}

export function routeByPath(path: string): RouteDef | undefined {
  const canonical = canonicalPath(path);
  return (
    ROUTES.find((r) => r.path === canonical) ??
    (canonical === THANKS_ROUTE.path ? THANKS_ROUTE : undefined)
  );
}

/**
 * Route resolution for rendering: the matching route when the path is known,
 * otherwise the synthesized 404 route carrying the requested (canonical) path.
 * `routeByPath` stays strict so `navigate()` keeps its documented no-op on
 * unknown paths.
 */
export function resolveRoute(path: string): RouteDef {
  const canonical = canonicalPath(path);
  return (
    ROUTES.find((r) => r.path === canonical) ??
    (canonical === THANKS_ROUTE.path ? THANKS_ROUTE : {
      ...NOT_FOUND_ROUTE,
      path: canonical,
    })
  );
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
    route: resolveRoute(currentPath),
    direction: currentDirection,
  });

  useEffect(() => {
    const update = () => {
      setLocal({
        path: currentPath,
        route: resolveRoute(currentPath),
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
