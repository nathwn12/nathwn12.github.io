import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";

interface BrowserStub {
  location: { pathname: string };
  replaceCalls: string[];
  pushCalls: string[];
  emitPopState: () => void;
}

function installBrowser(pathname: string): BrowserStub {
  const location = { pathname };
  const replaceCalls: string[] = [];
  const pushCalls: string[] = [];
  const popStateListeners: Array<() => void> = [];

  const applyPath = (url: string | URL | null | undefined) => {
    const value = String(url ?? location.pathname);
    const path = value.startsWith("http")
      ? new URL(value).pathname
      : (value.split("?")[0]?.split("#")[0] ?? "/");
    location.pathname = path || "/";
  };

  const history = {
    replaceState: (
      _state: unknown,
      _title: string,
      url?: string | URL | null,
    ) => {
      const value = String(url ?? location.pathname);
      replaceCalls.push(value);
      applyPath(url);
    },
    pushState: (_state: unknown, _title: string, url?: string | URL | null) => {
      const value = String(url ?? location.pathname);
      pushCalls.push(value);
      applyPath(url);
    },
  };

  const windowStub = {
    location,
    history,
    addEventListener: (type: string, listener: () => void) => {
      if (type === "popstate") popStateListeners.push(listener);
    },
    removeEventListener: () => undefined,
  };

  vi.stubGlobal("window", windowStub);
  vi.stubGlobal("history", history);

  return {
    location,
    replaceCalls,
    pushCalls,
    emitPopState: () => popStateListeners.forEach((listener) => listener()),
  };
}

async function loadRouter(pathname: string) {
  vi.resetModules();
  const browser = installBrowser(pathname);
  const router = await import("../src/lib/router");
  return { browser, router };
}

function readRouteState(
  router: Awaited<ReturnType<typeof loadRouter>>["router"],
) {
  let state: { path: string; direction: string } | undefined;
  function Probe() {
    const routeState = router.useRoute();
    state = { path: routeState.path, direction: routeState.direction };
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  return state;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the record's route merge", () => {
  test.each([
    "/about",
    "/about/",
    "/about?x",
    "/education",
    "/education/",
    "/education?x",
    "/footprint",
    "/footprint?x",
  ])("canonicalizes an initial legacy path %s", async (pathname) => {
    const { browser, router } = await loadRouter(pathname);

    expect(browser.replaceCalls).toEqual(["/"]);
    expect(browser.location.pathname).toBe("/");
    expect(router.routeByPath(pathname)?.path).toBe("/");
    expect(readRouteState(router)).toMatchObject({ path: "/" });
  });

  test.each(["/skills", "/skills/", "/contact", "/contact/"])(
    "canonicalizes the retired page %s to the record and hands over its band",
    async (pathname) => {
      const { browser, router } = await loadRouter(pathname);

      expect(browser.replaceCalls).toEqual(["/"]);
      expect(browser.location.pathname).toBe("/");
      expect(router.routeByPath(pathname)?.path).toBe("/");
      expect(router.legacyAnchorFor(pathname)).toBe(
        pathname.startsWith("/skills") ? "atlas" : "contact",
      );
      expect(router.consumeSectionScroll()).toBe(
        pathname.startsWith("/skills") ? "atlas" : "contact",
      );
      expect(router.consumeSectionScroll()).toBeNull();
    },
  );

  test("keeps only the surviving routes in navigation order", async () => {
    const { router } = await loadRouter("/");

    expect(router.ROUTES.map((route) => route.path)).toEqual(["/"]);
    expect(router.ROUTES).toHaveLength(1);
    for (const retired of [
      "/skills",
      "/contact",
      "/about",
      "/experience",
      "/projects",
    ]) {
      expect(router.ROUTES.map((route) => route.path)).not.toContain(retired);
    }
  });

  test("normalizes query strings and trailing slashes", async () => {
    const { router } = await loadRouter("/");

    expect(router.routeByPath("/?x=1")?.path).toBe("/");
    expect(router.routeByPath("/experience/?tab=all")?.path).toBe("/");
    expect(router.routeByPath("/projects/")?.path).toBe("/");
  });

  test("boots a retired trailing-slash deep link onto the record, not the 404", async () => {
    const { browser, router } = await loadRouter("/experience/");

    expect(browser.location.pathname).toBe("/");
    expect(router.resolveRoute("/experience/").id).toBe("record");
    expect(router.consumeSectionScroll()).toBe("experience");
    expect(readRouteState(router)).toMatchObject({ path: "/" });
  });

  test("makes canonical home and unknown navigation no-ops", async () => {
    const { browser, router } = await loadRouter("/");

    router.navigate("/about");
    router.navigate("/about/");
    router.navigate("/about?x=1");
    router.navigate("/education");
    router.navigate("/footprint");
    router.navigate("/not-a-route");

    expect(browser.pushCalls).toEqual([]);
    expect(browser.location.pathname).toBe("/");
  });

  test("resolves unknown paths to the 404 route while keeping the requested path", async () => {
    const { router } = await loadRouter("/definitely-not-a-page");

    expect(router.routeByPath("/definitely-not-a-page")).toBeUndefined();

    const resolved = router.resolveRoute("/definitely-not-a-page");
    expect(resolved.id).toBe("notfound");
    expect(resolved.path).toBe("/definitely-not-a-page");
    expect(resolved.title).toContain("Not found");

    expect(router.resolveRoute("/projects").id).toBe("record");
    expect(router.resolveRoute("/projects").path).toBe("/");
    expect(readRouteState(router)).toMatchObject({
      path: "/definitely-not-a-page",
    });
  });

  test("deduplicates a stale /about history entry at canonical home", async () => {
    const { browser, router } = await loadRouter("/unknown");

    router.navigate("/about");
    expect(browser.pushCalls).toEqual(["/"]);

    browser.location.pathname = "/about";
    browser.emitPopState();

    expect(browser.replaceCalls).toEqual(["/"]);
    expect(browser.pushCalls).toEqual(["/"]);
    expect(browser.location.pathname).toBe("/");
    expect(readRouteState(router)).toMatchObject({
      path: "/",
      direction: "forward",
    });
  });

  test("ignores a stale about popstate when home is already current", async () => {
    const { browser, router } = await loadRouter("/");

    browser.location.pathname = "/about";
    browser.emitPopState();

    expect(browser.replaceCalls).toEqual(["/"]);
    expect(readRouteState(router)).toMatchObject({
      path: "/",
      direction: "none",
    });
  });

  test("keeps history direction while suppressing stale home duplicates", async () => {
    const { browser, router } = await loadRouter("/unknown");

    router.navigate("/about");
    router.navigate("/about.md");
    expect(browser.pushCalls).toEqual(["/"]);
    expect(readRouteState(router)).toMatchObject({
      path: "/",
      direction: "forward",
    });

    browser.location.pathname = "/unknown";
    browser.emitPopState();
    expect(readRouteState(router)).toMatchObject({
      path: "/unknown",
      direction: "back",
    });

    browser.location.pathname = "/";
    browser.emitPopState();
    expect(readRouteState(router)).toMatchObject({
      path: "/",
      direction: "forward",
    });
  });
});
