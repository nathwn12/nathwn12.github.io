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
 * No dependency — ~10 route defs, pushState, and a popstate listener.
 */

export type RouteDirection = "forward" | "back" | "none";

export interface RouteDef {
  path: string;
  id: string;
  /** Short nav label (Header tabs) */
  label: string;
  /** Terminal command displayed as the page's "section header" */
  command: string;
  /** Short description used in `ls` listing */
  description: string;
  /** Tailwind accent token for bordered chrome, e.g. "accent-2" */
  accent: string;
  /** document.title when this page is active */
  title: string;
}

export const ROUTES: readonly RouteDef[] = [
  {
    path: "/",
    id: "hero",
    label: "HOME",
    command: "whoami",
    description: "Identity & system profile",
    accent: "accent",
    title: "NNL — Backend Developer",
  },
  {
    path: "/experience",
    id: "experience",
    label: "EXP",
    command: "journalctl -u career.service --no-pager",
    description: "Service journal",
    accent: "accent",
    title: "experience — NNL",
  },
  {
    path: "/footprint",
    id: "footprint",
    label: "FOOTPRINT",
    command: "du -sh footprint/",
    description: "Delivery stats",
    accent: "accent-2",
    title: "footprint — NNL",
  },
  {
    path: "/skills",
    id: "skills",
    label: "SKILLS",
    command: "pacman -Qqe",
    description: "Installed packages",
    accent: "accent-3",
    title: "skills — NNL",
  },
  {
    path: "/projects",
    id: "projects",
    label: "PROJECTS",
    command: "ls -la projects/",
    description: "Production highlights",
    accent: "accent-4",
    title: "projects — NNL",
  },
  {
    path: "/education",
    id: "education",
    label: "EDUCATION",
    command: "cat education.md",
    description: "Education history",
    accent: "accent-2",
    title: "education — NNL",
  },
  {
    path: "/contact",
    id: "contact",
    label: "CONTACT",
    command: "mutt -f inbox",
    description: "Mail user agent",
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
