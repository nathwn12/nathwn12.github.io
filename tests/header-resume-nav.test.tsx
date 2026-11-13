// @vitest-environment jsdom
/**
 * The global header is three destinations and nothing else.
 *
 * The nav is the record, the experience route and the projects route — set in
 * mono, lowercase, the same three places a reader can go. The two PDFs used to
 * sit here too, which made three copies of one action; they belong to the
 * footer now, on every route. Neither the cover nor the contact band repeats
 * them.
 *
 * Every assertion below can go red:
 *
 *   bunx vitest run tests/header-resume-nav.test.tsx
 */
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Header } from "../src/components/Header";
import { Footer } from "../src/components/Footer";
import { FirstScreen } from "../src/components/FirstScreen";
import App from "../src/App";
import { CV_PATH, RESUME_PATH } from "../src/lib/contact";
import { navigate } from "../src/lib/router";

let host: HTMLDivElement;
let root: Root | null = null;

async function mount(element: ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(element);
  });
}

beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  navigate("/");
});

afterEach(async () => {
  vi.unstubAllGlobals();
  if (root) {
    await act(async () => {
      root!.unmount();
    });
    root = null;
  }
  host?.remove();
});

const DESTINATIONS = ["the record", "experience", "projects"];

describe("global header navigation", () => {
  test("offers exactly three destinations and no documents", async () => {
    await mount(createElement(Header));
    const header = host.querySelector("header");
    expect(header).not.toBeNull();
    const text = header!.textContent ?? "";

    for (const label of DESTINATIONS) {
      expect(text, `${label} nav item is missing`).toContain(label);
    }
    /* Three, and no more: the bands are reached from the record's own links, so
       a fourth entry would be a second copy of a scroll target. */
    expect(header!.querySelectorAll("nav a[href]")).toHaveLength(3);
    // The retired pages are not destinations any more.
    expect(text).not.toContain("Skills");
    expect(text).not.toMatch(/Command|palette|⌘K/i);
    // Neither is a prev/next pager.
    expect(text).not.toMatch(/Previous:|Next:/);
    // Nor are the documents: the footer owns the pair on every route.
    expect(text).not.toMatch(/Résumé|Resume/);
    expect(text).not.toContain("CV (PDF)");
    expect(
      header!.querySelectorAll<HTMLAnchorElement>("a[download]"),
    ).toHaveLength(0);
  });

  test("the mobile menu holds the same destinations and no documents", async () => {
    await mount(createElement(Header));
    const menuButton = host.querySelector<HTMLButtonElement>(
      'button[aria-controls="site-nav"]',
    );
    if (!menuButton) throw new Error("the mobile menu trigger is missing");
    await act(async () => {
      menuButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const mobileNav = host.querySelector("#site-nav");
    expect(mobileNav).not.toBeNull();
    expect(mobileNav!.getAttribute("data-open")).toBe("true");
    for (const label of DESTINATIONS) {
      expect(mobileNav!.textContent, `${label} mobile item is missing`).toContain(
        label,
      );
    }
    expect(mobileNav!.textContent).not.toContain("Skills");
    expect(mobileNav!.textContent).not.toMatch(/Résumé|Resume/);
    expect(
      mobileNav!.querySelectorAll('a[href$=".pdf"][download]'),
    ).toHaveLength(0);

    // Escape closes the menu and returns focus to its trigger.
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(host.querySelector("#site-nav")?.getAttribute("data-open")).toBe(
      "false",
    );
    expect(document.activeElement).toBe(menuButton);
  });

  test("choosing a destination closes the open panel first", async () => {
    /* The panel is absolutely positioned under the bar, so an open menu covers
       the page the visitor just asked for. The link has to close it as part of
       the same activation; otherwise the sticky header (bar + panel) is still
       sitting over the new route's opening band. */
    await mount(createElement(Header));
    const menuButton = host.querySelector<HTMLButtonElement>(
      'button[aria-controls="site-nav"]',
    );
    await act(async () => {
      menuButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(host.querySelector("#site-nav")!.getAttribute("data-open")).toBe(
      "true",
    );

    const destination = host.querySelector<HTMLAnchorElement>(
      'a[href="/projects"]',
    );
    expect(destination, "the projects destination is missing").not.toBeNull();
    await act(async () => {
      destination!.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });

    expect(host.querySelector("#site-nav")!.getAttribute("data-open")).toBe(
      "false",
    );
    expect(window.location.pathname).toBe("/projects");
  });
});

describe("the footer owns the documents on every route", () => {
  /* It is the same component on all three routes (App.tsx), so mounting the
     real App is the only honest way to assert this per route: the Footer cannot
     know which page it is on, and it must not need to. */
  for (const route of ["/", "/experience", "/projects"] as const) {
    test(`${route} keeps the pair out of the header and main, in the footer`, async () => {
      act(() => {
        navigate(route);
      });
      await mount(createElement(App));

      const header = host.querySelector("header");
      const footer = host.querySelector("footer");
      const main = host.querySelector("main");
      expect(header, route).not.toBeNull();
      expect(footer, route).not.toBeNull();
      expect(main, route).not.toBeNull();

      expect(
        header!.querySelectorAll<HTMLAnchorElement>("a[download]"),
      ).toHaveLength(0);

      const footerDocs = [
        ...footer!.querySelectorAll<HTMLAnchorElement>('a[href$=".pdf"]'),
      ];
      const mainDocs = [
        ...main!.querySelectorAll<HTMLAnchorElement>('a[href$=".pdf"]'),
      ];

      expect(mainDocs, `${route} main repeats a document`).toHaveLength(0);
      expect(footerDocs.map((a) => a.getAttribute("href")).sort()).toEqual(
        [CV_PATH, RESUME_PATH].sort(),
      );
      for (const anchor of footerDocs) {
        expect(anchor.getAttribute("download")).toMatch(
          /^Nathaniel-Nikolai-Ladero-/,
        );
      }
      expect(footerDocs.length + mainDocs.length, route).toBe(2);
    });
  }
});

describe("the mark", () => {
  test("is the signature, and names the full person to assistive tech", async () => {
    await mount(createElement(Header));
    const mark = host.querySelector<HTMLAnchorElement>("a.masthead__mark");
    expect(mark, "the author mark is missing").not.toBeNull();

    /* Two halves of one contract, asserted together so neither can regress
       silently: the visible content is the drawn signature alone, and the
       accessible name — what a screen reader or voice control announces — is
       the full name. The image is decorative because the link already names
       the person. */
    expect(mark!.textContent?.trim()).toBe("");
    expect(mark!.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(mark!.getAttribute("aria-label")).toBe(
      "Nathaniel Nikolai Ladero, home",
    );
  });

  test("states the full name once, in the colophon, not as a display line", () => {
    /* Only `/` carries a display line, and it is the claim, not the name.
       `/experience` and `/projects` open with a page title. The footer is
       therefore where the name survives on those two routes, and it is the same
       component on all three (App.tsx), so its absence here would be absence
       everywhere. */
    const markup = renderToStaticMarkup(createElement(Footer));
    expect(markup.match(/Nathaniel Nikolai Ladero/g)).toHaveLength(1);
    expect(markup).toContain(
      `© ${new Date().getFullYear()} Nathaniel Nikolai Ladero.`,
    );
    expect(markup).toContain(
      "Set in Instrument Serif, Archivo and JetBrains Mono.",
    );
    expect(markup).toContain("Source on GitHub");
  });
});

describe("homepage actions", () => {
  test("the first screen offers the record's two actions, no documents", async () => {
    await mount(createElement(FirstScreen));
    const hrefs = [
      ...host.querySelectorAll<HTMLAnchorElement>("a[href]"),
    ].map((anchor) => anchor.getAttribute("href"));
    expect(hrefs).toContain("/#contact");
    expect(hrefs).toContain("/#proof");
    expect(host.querySelectorAll("a[download]")).toHaveLength(0);
  });

  test("the one contact action carries the one contact phrase", async () => {
    await mount(createElement(FirstScreen));
    const primary = host.querySelector<HTMLAnchorElement>('a[href="/#contact"]');
    expect(primary?.textContent?.trim()).toBe("Email me");
  });
});
