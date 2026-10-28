import {
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from "react";
import {
  canonicalFor,
  HOME_META_DESCRIPTION,
  HOME_OG_DESCRIPTION,
  NOT_FOUND_ROUTE,
  RETIRED_ROUTES,
  RETIRED_ROUTE_PATHS,
  ROUTES,
  type RouteDef,
} from "./routes";

/**
 * Minimal History-API router for a two-route site with one long record page.
 *
 * `/` and the two detail routes are real paths, so URLs are shareable, the
 * browser back/forward buttons work, and a refresh lands the visitor back on
 * that page. Two build steps back that up: `scripts/prerender-routes.mjs` emits
 * a real `dist/<path>/index.html` per route (HTTP 200, not a fallback), and
 * `scripts/copy-404.mjs` keeps `dist/404.html` for genuinely unknown paths.
 *
 * No dependency — 3 route defs, pushState, and a popstate listener.
 */

export type RouteDirection = "forward" | "back" | "none";

export type { RouteDef } from "./routes";
export {
  HOME_META_DESCRIPTION,
  HOME_OG_DESCRIPTION,
  NOT_FOUND_ROUTE,
  RETIRED_ROUTES,
  RETIRED_ROUTE_PATHS,
  ROUTES,
};

/**
 * Tolerant path normalization: "/" for root, exactly one trailing slash
 * removed (except for root itself). GitHub Pages answers `/experience/` either
 * directly or after a redirect, so the browser can report a trailing slash the
 * route table never stores.
 */
export function normalizePath(pathname: string): string {
  let p = pathname.split("?")[0]?.split("#")[0] ?? "/";
  try {
    p = decodeURIComponent(p);
  } catch {
    /* malformed URI — fall through */
  }
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p === "" ? "/" : p;
}

/**
 * Retired paths and the home section that absorbed each one.
 *
 * `/about`, `/education` and `/footprint` were deleted outright; `/skills` and
 * `/contact` moved into the record; `/thanks` existed only for the relay form,
 * which is retired. Every one canonicalizes to `/` at load
 * (history.replaceState below) instead of 404-ing, and the moved pages land on
 * the band that now carries their content.
 */
const LEGACY_PATHS: Readonly<Record<string, string>> = Object.fromEntries(
  RETIRED_ROUTES.map((route) => [route.path, "/"]),
);

const LEGACY_ANCHORS: Readonly<Record<string, string>> = Object.fromEntries(
  RETIRED_ROUTES.map((route) => [
    route.path,
    route.target.startsWith("/#") ? route.target.slice(2) : "",
  ]),
);

export function isRetiredPath(path: string): boolean {
  return Object.prototype.hasOwnProperty.call(LEGACY_PATHS, normalizePath(path));
}

/** The home section a retired path scrolls to ("" means the top). */
export function legacyAnchorFor(path: string): string {
  return LEGACY_ANCHORS[normalizePath(path)] ?? "";
}

function canonicalPath(path: string): string {
  const normalized = normalizePath(path);
  return LEGACY_PATHS[normalized] ?? normalized;
}

export function routeByPath(path: string): RouteDef | undefined {
  const canonical = canonicalPath(path);
  return ROUTES.find((r) => r.path === canonical);
}

/**
 * Route resolution for rendering: the matching route when the path is known,
 * otherwise the synthesized 404 route carrying the requested (canonical) path.
 */
export function resolveRoute(path: string): RouteDef {
  const canonical = canonicalPath(path);
  return (
    ROUTES.find((r) => r.path === canonical) ?? {
      ...NOT_FOUND_ROUTE,
      path: canonical,
    }
  );
}

/* -------------------------------------------------------------------------
   A pending in-page scroll, handed across a route change.

   A link to `/#contact` from `/projects` must land on the contact band, which
   mounts only after the home page renders. The request is stored here for one
   mount to consume, exactly once — the same shape the old keyboard handoff
   used, without a global listener.
   ------------------------------------------------------------------------- */
let pendingSection: string | null = null;

export function requestSectionScroll(id: string): void {
  pendingSection = id;
}

export function consumeSectionScroll(): string | null {
  const id = pendingSection;
  pendingSection = null;
  return id;
}

/** Scroll the current document to a band. Always the animated path: the OS
    motion preference does not gate this site (owner order 2026-10-14). */
export function scrollToSection(id: string): void {
  if (typeof document === "undefined") return;
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/* -------------------------------------------------------------------------
   History state
   ------------------------------------------------------------------------- */

/** Navigation history stack — used to infer back vs forward on popstate. */
const initialPath = normalizePath(window.location.pathname);
const canonicalInitialPath = canonicalPath(initialPath);
if (canonicalInitialPath !== initialPath) {
  window.history.replaceState(
    null,
    "",
    canonicalInitialPath + (window.location.hash || ""),
  );
  const anchor = legacyAnchorFor(initialPath);
  if (anchor) requestSectionScroll(anchor);
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
  const path = canonicalPath(normalizePath(window.location.pathname));
  if (path !== normalizePath(window.location.pathname)) {
    window.history.replaceState(null, "", path);
  }
  if (path === currentPath) return;

  const idx = historyStack.lastIndexOf(path);
  if (idx === -1) {
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

  if (historyStack[historyStack.length - 1] === path) {
    history.replaceState(null, "", path);
    setState(path, "back");
    return;
  }

  historyStack.push(path);
  history.pushState(null, "", path);
  setState(path, "forward");
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

interface SectionLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The band id on the home record, e.g. "contact". */
  section: string;
}

/**
 * Anchor to a band on the home record. On `/` it scrolls and updates the hash;
 * from a detail route it routes home first and lands on the band once it
 * mounts. Always a real anchor with a real href, so middle-click and "open in
 * a new tab" still work.
 */
export function SectionLink({ section, onClick, ...rest }: SectionLinkProps) {
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
    if (currentPath === "/") {
      window.history.replaceState(null, "", `#${section}`);
      scrollToSection(section);
    } else {
      requestSectionScroll(section);
      navigate("/");
    }
    onClick?.(e);
  };
  return (
    <a
      href={`/#${section}`}
      onClick={handleClick}
      {...rest}
    />
  );
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

/** Point the canonical link at the route, creating it on a document without one. */
function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

function dropCanonical() {
  document.head.querySelector('link[rel="canonical"]')?.remove();
}

/**
 * A 404 keeps the static document's `noindex` and has no canonical: the
 * address bar holds a path that does not exist, and a canonical pointing at it
 * would ask a crawler to index a page the site does not serve. Any other route
 * clears the marker the 404 set.
 */
function setRobots(content: "noindex, follow" | null) {
  const el = document.head.querySelector<HTMLMetaElement>(
    'meta[name="robots"]',
  );
  if (!content) {
    if (el?.getAttribute("content") === "noindex, follow") el.remove();
    return;
  }
  if (el) {
    el.setAttribute("content", content);
    return;
  }
  const meta = document.createElement("meta");
  meta.name = "robots";
  meta.content = content;
  document.head.appendChild(meta);
}

/**
 * Apply the active route's document.title + per-route SEO meta. The social
 * titles mirror the document title exactly, on every route, so a shared link
 * names the page the same way its own tab does. The home route keeps the
 * index.html descriptions verbatim for single-source parity; every other route
 * uses its recruiter-facing `metaDescription`. The canonical and og:url follow
 * the address bar, so a client-side route change cannot leave a `/experience`
 * page claiming to be the home page — and cannot leave the 404 claiming to be
 * a real one.
 */
export function applyRouteMeta(route: RouteDef): void {
  document.title = route.title;
  setMeta("property", "og:title", route.title);
  setMeta("name", "twitter:title", route.title);

  if (route.id === "notfound") {
    setMeta("name", "description", route.metaDescription);
    setMeta("property", "og:description", route.metaDescription);
    document.head
      .querySelector('meta[property="og:url"]')
      ?.remove();
    dropCanonical();
    setRobots("noindex, follow");
    return;
  }

  setCanonical(canonicalFor(route.path));
  setMeta("property", "og:url", canonicalFor(route.path));
  setRobots(null);

  if (route.path === "/") {
    setMeta("name", "description", HOME_META_DESCRIPTION);
    setMeta("property", "og:description", HOME_OG_DESCRIPTION);
    return;
  }
  setMeta("name", "description", route.metaDescription);
  setMeta("property", "og:description", route.metaDescription);
}

/** The route's section anchors, used by the mobile menu and the footer. */
export const HOME_SECTIONS = [
  { id: "proof", label: "Proof" },
  { id: "work", label: "Work" },
  { id: "atlas", label: "System atlas" },
  { id: "contact", label: "Contact" },
] as const;
