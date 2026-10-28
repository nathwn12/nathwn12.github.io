// @vitest-environment jsdom
/**
 * The router: three live paths, retired paths canonicalized on the way in, and
 * per-route title/description/canonical applied on every change.
 *
 *   pnpm vitest run tests/router.test.ts
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyRouteMeta,
  navigate,
  normalizePath,
  resolveRoute,
  routeByPath,
  ROUTES,
} from "../src/lib/router";
import { canonicalFor } from "../src/lib/routes";

describe("route matching", () => {
  it("normalizes one trailing slash and query strings", () => {
    expect(normalizePath("/record/")).toBe("/record");
    expect(normalizePath("/record/?x=1")).toBe("/record");
    expect(normalizePath("/")).toBe("/");
  });

  it("resolves a trailing-slash deep link to its route, not the 404", () => {
    expect(routeByPath("/record/")?.id).toBe("record");
    expect(resolveRoute("/work/").id).toBe("work");
  });

  it("canonicalizes retired paths to their live replacement", () => {
    expect(routeByPath("/experience")?.path).toBe("/record");
    expect(routeByPath("/projects")?.path).toBe("/work");
    expect(routeByPath("/skills")?.path).toBe("/");
    expect(routeByPath("/contact")?.path).toBe("/");
    expect(routeByPath("/thanks")?.path).toBe("/");
  });

  it("resolves an unknown path to the 404 route with the path echoed", () => {
    expect(routeByPath("/nope")).toBeUndefined();
    const notFound = resolveRoute("/nope");
    expect(notFound.id).toBe("notfound");
    expect(notFound.path).toBe("/nope");
  });
});

describe("navigation and meta", () => {
  beforeEach(() => {
    navigate("/");
  });

  it("navigate() updates location", () => {
    navigate("/record");
    expect(window.location.pathname).toBe("/record");
  });

  it("navigate() to an unknown path is a no-op", () => {
    navigate("/record");
    navigate("/does-not-exist");
    expect(window.location.pathname).toBe("/record");
  });

  it("navigate() on a retired path lands on the canonical route", () => {
    navigate("/experience");
    expect(window.location.pathname).toBe("/record");
    expect(resolveRoute("/record").id).toBe("record");
  });

  it("applies per-route title, description, and canonical", () => {
    const record = ROUTES.find((route) => route.path === "/record")!;
    applyRouteMeta(record);
    expect(document.title).toBe("The record | Nathaniel Nikolai Ladero");
    expect(
      document.head.querySelector('meta[name="description"]')?.getAttribute("content"),
    ).toBe(record.metaDescription);
    expect(
      document.head.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ).toBe(canonicalFor("/record"));
    expect(
      document.head.querySelector('meta[property="og:url"]')?.getAttribute("content"),
    ).toBe(canonicalFor("/record"));
  });

  it("home keeps the index.html defaults", () => {
    const home = ROUTES.find((route) => route.path === "/")!;
    applyRouteMeta(home);
    expect(document.title).toBe("Nathaniel Nikolai Ladero | backend developer");
    expect(
      document.head.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ).toBe("https://nathwn12.github.io/");
  });

  it("every route carries a recruiter-facing description", () => {
    for (const route of ROUTES) {
      expect(route.metaDescription.length, route.path).toBeGreaterThan(80);
    }
  });
});
