// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { ROUTES, applyRouteMeta, navigate, routeByPath } from "../lib/router";

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
      "Terminal-themed portfolio of Nathaniel Nikolai Ladero — Backend Developer specializing in C#, ASP.NET Core, and fintech systems.",
    );
    expect(
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content"),
    ).toBe("Nathaniel Nikolai Ladero | Backend Developer");
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
});