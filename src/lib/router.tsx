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
  REDIRECTS,
  ROUTES,
  canonicalFor,
  type RouteDef,
} from "./routes";

/**
 * Minimal History-API router for the Ledger portfolio.
 *
 * Three real paths (`/`, `/record`, `/work`) so URLs are shareable, browser
 * back/forward work, and a refresh lands on the same page. The build backs that
 * up: `scripts/prerender-routes.mjs` emits a real `dist/<path>/index.html` per
 * route and a meta-refresh stub at each retired path.
 *
 * No dependency — three route defs, pushState, and a popstate listener.
 */

export type { RouteDef } from "./routes";
export {
  HOME_META_DESCRIPTION,
  HOME_OG_DESCRIPTION,
  HOME_OG_TITLE,
  NAV_ITEMS,
  NOT_FOUND_ROUTE,
  REDIRECTS,
  ROUTES,
  canonicalFor,
} from "./routes";

/**
 * Tolerant path normalization: "/" for root, exactly one trailing slash
 * removed (except for root itself). GitHub Pages answers `/record/` from
 * `dist/record/index.html`, so the browser can report a trailing slash the
 * route table never stores.
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

/** Retired path → its live replacement. Matching is on the normalized path. */
const LEGACY_PATHS: Readonly<Record<string, string>> = Object.fromEntries(
  REDIRECTS.map((redirect) => [redirect.from, redirect.to]),
);

function legacyTarget(path: string): string | undefined {
  return LEGACY_PATHS[normalizePath(path)];
}

/** Split a replacement that may carry the cover's contact anchor. */
function splitTarget(target: string): { path: string; hash: string } {
  const at = target.indexOf("#");
  return at === -1
    ? { path: target, hash: "" }
    : { path: target.slice(0, at) || "/", hash: target.slice(at) };
}

function canonicalPath(path: string): string {
  const normalized = normalizePath(path);
  return splitTarget(LEGACY_PATHS[normalized] ?? normalized).path;
}

export function routeByPath(path: string): RouteDef | undefined {
  const canonical = canonicalPath(path);
  return ROUTES.find((route) => route.path === canonical);
}

/**
 * Route resolution for rendering: the matching route when the path is known,
 * otherwise the synthesized 404 route carrying the requested path.
 */
export function resolveRoute(path: string): RouteDef {
  return (
    ROUTES.find((route) => route.path === canonicalPath(path)) ?? {
      ...NOT_FOUND_ROUTE,
      path: canonicalPath(path),
    }
  );
}

/** The live path, with a retired path already replaced by its destination. */
function initialLocation(): { path: string; hash: string } {
  const raw = normalizePath(window.location.pathname);
  const target = legacyTarget(raw);
  if (target) {
    const { path, hash } = splitTarget(target);
    window.history.replaceState(
      null,
      "",
      `${path}${hash || window.location.hash}`,
    );
    return { path, hash: hash || window.location.hash };
  }
  return { path: raw, hash: window.location.hash };
}

const start = initialLocation();
const historyStack: string[] = [start.path];
let currentPath = start.path;

const listeners = new Set<() => void>();

function setState(path: string) {
  currentPath = path;
  listeners.forEach((listener) => listener());
}

function onPopState() {
  const raw = normalizePath(window.location.pathname);
  const target = legacyTarget(raw);
  const { path } = splitTarget(target ?? raw);
  if (path !== raw) window.history.replaceState(null, "", path);
  if (path === currentPath) return;

  const idx = historyStack.lastIndexOf(path);
  if (idx === -1) {
    historyStack.push(path);
    setState(path);
    return;
  }
  historyStack.length = idx + 1;
  setState(path);
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", onPopState);
}

export interface RouterState {
  path: string;
  route: RouteDef;
}

/** Navigate to a route path. No-op when already there or path is unknown. */
export function navigate(to: string): void {
  const path = canonicalPath(to);
  if (!routeByPath(path)) return; // unknown path — ignore
  if (path === currentPath) return;

  if (historyStack[historyStack.length - 1] === path) {
    history.replaceState(null, "", path);
    setState(path);
    return;
  }

  historyStack.push(path);
  window.history.pushState(null, "", path);
  setState(path);
}

/** Subscribe to route changes. */
export function useRoute(): RouterState {
  const [state, setLocal] = useState<RouterState>({
    path: currentPath,
    route: resolveRoute(currentPath),
  });

  useEffect(() => {
    const update = () => {
      setLocal({ path: currentPath, route: resolveRoute(currentPath) });
    };
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  return state;
}

interface RouteLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

/** Anchor that performs an app-level route change instead of a page reload. */
export function RouteLink({ href, onClick, ...rest }: RouteLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    navigate(href);
    onClick?.(event);
  };
  return <a href={href} onClick={handleClick} {...rest} />;
}

/**
 * Move focus to the cover's contact section and put `#contact` in the URL. On a
 * sub-page this routes home first, then lands after the cover has committed.
 */
export function goToContact(): void {
  const land = () => {
    const section = document.getElementById("contact");
    if (!section) return;
    try {
      window.history.replaceState(null, "", "/#contact");
    } catch {
      /* history unavailable — the section still lands */
    }
    section.setAttribute("tabindex", "-1");
    section.focus({ preventScroll: true });
    section.scrollIntoView({ block: "start" });
  };

  if (normalizePath(window.location.pathname) === "/") {
    requestAnimationFrame(land);
    return;
  }
  navigate("/");
  requestAnimationFrame(() => requestAnimationFrame(land));
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

function setCanonical(url: string) {
  let link = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

/**
 * Apply the active route's document.title, description, canonical URL, and
 * Open Graph meta. The home route keeps the index.html defaults verbatim for
 * single-source parity; every other route uses its recruiter-facing
 * `metaDescription`. Called from the shell on every route change.
 */
export function applyRouteMeta(route: RouteDef): void {
  document.title = route.title;
  const canonical = canonicalFor(route.path);
  setCanonical(canonical);
  setMeta("property", "og:url", canonical);

  if (route.path === "/") {
    setMeta("name", "description", HOME_META_DESCRIPTION);
    setMeta("property", "og:title", HOME_OG_TITLE);
    setMeta("property", "og:description", HOME_OG_DESCRIPTION);
    return;
  }
  setMeta("name", "description", route.metaDescription);
  setMeta("property", "og:title", route.title);
  setMeta("property", "og:description", route.metaDescription);
}

/** Stable callback for the header's Contact destination. */
export function useContactNavigation(): (event: MouseEvent<HTMLAnchorElement>) => void {
  return useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    goToContact();
  }, []);
}
