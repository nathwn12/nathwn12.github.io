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
      : (value.split("?")[0] ?? "/");
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

describe("home dossier route merge", () => {
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

  test("keeps only the surviving routes in navigation order", async () => {
    const { router } = await loadRouter("/");

    expect(router.ROUTES.map((route) => route.path)).toEqual([
      "/",
      "/experience",
      "/skills",
      "/projects",
      "/contact",
    ]);
    expect(router.ROUTES).toHaveLength(5);
  });

  test("normalizes query strings and trailing slashes", async () => {
    const { router } = await loadRouter("/");

    expect(router.routeByPath("/?x=1")?.path).toBe("/");
    expect(router.routeByPath("/experience/?tab=all")?.path).toBe(
      "/experience",
    );
    expect(router.routeByPath("/contact/")?.path).toBe("/contact");
  });

  test("moves home to experience and clamps the last route", async () => {
    const { router } = await loadRouter("/");

    expect(router.routeAtOffset("/", 1).path).toBe("/experience");
    expect(router.routeAtOffset("/contact", 1).path).toBe("/contact");
    expect(router.routeAtOffset("/about", 1).path).toBe("/experience");
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

  test("deduplicates a stale /about history entry at canonical home", async () => {
    const { browser, router } = await loadRouter("/experience");

    router.navigate("/about");
    expect(browser.pushCalls).toEqual(["/"]);

    browser.location.pathname = "/about";
    browser.emitPopState();

    expect(browser.replaceCalls).toEqual(["/"]);
    expect(browser.pushCalls).toEqual(["/"]);
    expect(browser.location.pathname).toBe("/");
    expect(readRouteState(router)).toMatchObject({
      path: "/",
      direction: "back",
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
    const { browser, router } = await loadRouter("/experience");

    router.navigate("/about");
    router.navigate("/about.md");
    expect(browser.pushCalls).toEqual(["/"]);
    expect(readRouteState(router)).toMatchObject({
      path: "/",
      direction: "back",
    });

    browser.location.pathname = "/experience";
    browser.emitPopState();
    expect(readRouteState(router)).toMatchObject({
      path: "/experience",
      direction: "back",
    });

    browser.location.pathname = "/";
    browser.emitPopState();
    expect(readRouteState(router)).toMatchObject({
      path: "/",
      direction: "forward",
    });
  });

  test("keeps five terminal sections coherent with routes and aliases about", async () => {
    const { router } = await loadRouter("/");
    vi.resetModules();
    const terminal = await import("../src/components/CommandTerminal");

    expect(terminal.SECTIONS.map((section) => section.path)).toEqual(
      router.ROUTES.map((route) => route.path),
    );
    expect(terminal.SECTIONS).toHaveLength(5);
    expect(terminal.resolveTerminalSection("about")?.path).toBe("/");
    expect(terminal.resolveTerminalSection("about.md")?.path).toBe("/");
    expect(terminal.resolveTerminalSection("education")).toBeUndefined();
    expect(terminal.resolveTerminalSection("footprint")).toBeUndefined();
  });
});
