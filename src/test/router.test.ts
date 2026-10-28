// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  ROUTES,
  applyRouteMeta,
  navigate,
  normalizePath,
  resolveRoute,
  routeByPath,
} from "../lib/router";

/** Router smoke test — mirrors src/lib/router.tsx behavior:
 *  navigate() pushes History state and, via applyRouteMeta (invoked from
 *  PageShell's keyed mount effect), sets document.title + per-route meta.
 *  Unknown paths are ignored. Home route keeps the index.html defaults.
 */
describe("router", () => {
  beforeEach(() => {
    window.history.pushState(null, "", "/");
    document.title = "";
    document.head.querySelectorAll("meta").forEach((m) => m.remove());
    document.head.querySelectorAll('link[rel="canonical"]').forEach((l) => l.remove());
  });

  it("navigate() updates location; applyRouteMeta updates document.title", () => {
    navigate("/experience");
    expect(window.location.pathname).toBe("/experience");

    const route = routeByPath("/experience");
    expect(route).toBeDefined();
    applyRouteMeta(route!);
    expect(document.title).toBe(route!.title);
  });

  it("applyRouteMeta writes the per-route description into meta[name=description]", () => {
    const route = routeByPath("/experience")!;
    applyRouteMeta(route);
    expect(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content"),
    ).toBe(route.metaDescription);
  });

  it("home route keeps the index.html meta defaults for parity", () => {
    applyRouteMeta(routeByPath("/")!);
    expect(document.title).toBe(ROUTES[0].title);
    expect(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content"),
    ).toBe(
      "Backend developer for payment and cash-management systems that ran in production — and the author of eleven open-source developer tools.",
    );
    expect(
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content"),
    ).toBe(ROUTES[0].title);
    expect(
      document
        .querySelector('meta[name="twitter:title"]')
        ?.getAttribute("content"),
    ).toBe(ROUTES[0].title);
  });

  it("every ROUTES entry carries a recruiter metaDescription", () => {
    for (const route of ROUTES) {
      expect(route.metaDescription.length, route.path).toBeGreaterThan(20);
    }
  });

  it("navigate() to an unknown path is a no-op", () => {
    const before = window.location.pathname;
    navigate("/definitely-not-a-route");
    expect(window.location.pathname).toBe(before);
  });

  it("resolves a single trailing slash to its route, not the 404", () => {
    /* GitHub Pages serves dist/experience/index.html for /experience/ and may
       redirect /experience to it, so the browser can report a trailing slash
       the route table never stores. Matching must normalise it. */
    expect(normalizePath("/experience/")).toBe("/experience");
    expect(routeByPath("/experience/")?.id).toBe("experience");
    expect(resolveRoute("/experience/").id).toBe("experience");
    expect(resolveRoute("/experience/").path).toBe("/experience");

    // Root keeps its single slash; query strings still come off first.
    expect(normalizePath("/")).toBe("/");
    // A retired path normalizes to the home record, not to a 404.
    expect(normalizePath("/skills/?tab=all")).toBe("/skills");
    expect(routeByPath("/skills/")?.path).toBe("/");
  });

  it("navigate() on a trailing-slash path lands on the canonical route", () => {
    navigate("/");
    navigate("/projects/");
    expect(window.location.pathname).toBe("/projects");
  });

  it("points the canonical and og:url at the active route", () => {
    applyRouteMeta(routeByPath("/projects")!);
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href"),
    ).toBe("https://nathwn12.github.io/projects");
    expect(
      document.head
        .querySelector('meta[property="og:url"]')
        ?.getAttribute("content"),
    ).toBe("https://nathwn12.github.io/projects");
    expect(document.title).toBe(routeByPath("/projects")!.title);
  });

  it("a 404 keeps the static noindex, drops the canonical, and is reversible", () => {
    // Seed the head the way the static document has it.
    applyRouteMeta(routeByPath("/")!);
    applyRouteMeta(resolveRoute("/definitely-not-a-route"));

    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(
      document.head.querySelector('meta[name="robots"]')?.getAttribute("content"),
    ).toBe("noindex, follow");
    expect(document.title).toContain("Not found");

    applyRouteMeta(routeByPath("/experience")!);
    expect(
      document.head.querySelector('meta[name="robots"]'),
    ).toBeNull();
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href"),
    ).toBe("https://nathwn12.github.io/experience");
  });
});