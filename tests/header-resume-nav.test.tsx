// @vitest-environment jsdom
/**
 * The global header is three destinations and nothing else.
 *
 * The redesign cut the nav from five routes (and a 22-item palette, a pager and
 * a duplicated mobile menu) to the three places a visitor can actually go -
 * the record's work and contact bands, and the experience page. The two PDFs
 * used to sit here too, which made three copies of one action; they now belong
 * to the cover on `/` and to the footer on the two detail routes, which have no
 * cover. The contact band repeats neither.
 *
 * Every assertion below can go red:
 *
 *   pnpm vitest run tests/header-resume-nav.test.tsx
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

const DESTINATIONS = ["Experience", "Projects", "Contact"];

describe("global header navigation", () => {
  test("offers exactly three destinations and no documents", async () => {
    await mount(createElement(Header));
    const header = host.querySelector("header");
    expect(header).not.toBeNull();
    const text = header!.textContent ?? "";

    for (const label of DESTINATIONS) {
      expect(text, `${label} nav item is missing`).toContain(label);
    }
    // The retired pages are not destinations any more.
    expect(text).not.toContain("Skills");
    expect(text).not.toMatch(/Command|palette|⌘K/i);
    // Neither is a prev/next pager.
    expect(text).not.toMatch(/Previous:|Next:/);
    // Nor are the documents: the cover owns the pair on `/` and the footer
    // owns it on the two detail routes. The header stays navigation.
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

  test("a section link closes the open panel before the target is read", async () => {
    /* The panel is absolutely positioned under the bar, so an open menu covers
       the band a section link scrolls to. The link has to close it as part of
       the same activation; otherwise the sticky header (bar + panel) hides the
       heading the visitor asked for. */
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

    const contact = host.querySelector<HTMLAnchorElement>('a[href="/#contact"]');
    expect(contact, "the contact section link is missing").not.toBeNull();
    await act(async () => {
      contact!.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });

    expect(host.querySelector("#site-nav")!.getAttribute("data-open")).toBe(
      "false",
    );
    expect(window.location.hash).toBe("#contact");
  });
});

describe("the footer carries the documents only where there is no cover", () => {
  /* `/experience` and `/projects` have no cover, so the footer is the only
     place their pair survives. `/` has the pair in the first screen, so the
     footer must not repeat it in the same closing viewport. Mounting the real
     App is the only honest way to assert this per route - the Footer component
     on its own cannot know which page it is on. */
  for (const route of ["/", "/experience", "/projects"] as const) {
    test(`${route} keeps the pair out of the header and puts it on one surface`, async () => {
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

      if (route === "/") {
        expect(footerDocs).toHaveLength(0);
        expect(mainDocs.map((a) => a.getAttribute("href")).sort()).toEqual(
          [CV_PATH, RESUME_PATH].sort(),
        );
      } else {
        expect(mainDocs).toHaveLength(0);
        expect(footerDocs.map((a) => a.getAttribute("href")).sort()).toEqual(
          [CV_PATH, RESUME_PATH].sort(),
        );
      }
      for (const anchor of [...footerDocs, ...mainDocs]) {
        expect(anchor.getAttribute("download")).toMatch(
          /^Nathaniel-Nikolai-Ladero-/,
        );
      }
      expect(footerDocs.length + mainDocs.length, route).toBe(2);
    });
  }
});

describe("the wordmark", () => {
  test("shows the monogram, and names the full person to assistive tech", async () => {
    await mount(createElement(Header));
    const mark = host.querySelector<HTMLAnchorElement>("a.wordmark");
    expect(mark, "the wordmark link is missing").not.toBeNull();

    /* Two halves of one contract, asserted together so neither can regress
       silently: the visible text is the mark alone, and the accessible name —
       what a screen reader or voice control announces — stays the full name.
       Three letters are meaningless on their own, and a full name painted back
       in would undo the redesign. */
    expect(mark!.textContent?.trim()).toBe("NNL");
    expect(mark!.getAttribute("aria-label")).toBe(
      "Nathaniel Nikolai Ladero — home",
    );
  });

  test("states the full name once, in the colophon, not as a display line", () => {
    /* Only `/` carries the full name in its h1; `/experience` and `/projects`
       open with a page title instead. The footer is therefore where the name
       survives on those two routes, and it is the same component on all three
       (App.tsx), so its absence here would be absence everywhere. It survives
       in the colophon, which also carries the imprint and the source credit,
       rather than being painted a second time above the links. */
    const markup = renderToStaticMarkup(createElement(Footer));
    expect(markup).not.toContain('class="site-footer__name"');
    expect(markup.match(/Nathaniel Nikolai Ladero/g)).toHaveLength(1);
    expect(markup).toContain(
      `© ${new Date().getFullYear()} Nathaniel Nikolai Ladero.`,
    );
    expect(markup).toContain("Set in Inter.");
    expect(markup).toContain("Source on GitHub.");
  });
});

describe("homepage document controls", () => {
  test("the first screen offers the résumé and CV downloads", async () => {
    await mount(createElement(FirstScreen));
    const resume = host.querySelector<HTMLAnchorElement>(
      'a[href="/Nathaniel-Nikolai-Ladero-Resume.pdf"][download]',
    );
    expect(resume, "the homepage résumé download is missing").not.toBeNull();
    expect(resume!.textContent).toContain("Résumé (PDF)");

    const cv = host.querySelector<HTMLAnchorElement>(
      'a[href="/Nathaniel-Nikolai-Ladero-CV.pdf"][download]',
    );
    expect(cv, "the homepage CV download is missing").not.toBeNull();
    expect(cv!.textContent).toContain("CV (PDF)");
    // Same treatment as the résumé control, not a one-off.
    expect(cv!.className).toBe(resume!.className);
  });

  test("the one contact action carries the one contact phrase", async () => {
    await mount(createElement(FirstScreen));
    const primary = host.querySelector<HTMLAnchorElement>("a.button");
    expect(primary?.textContent?.trim()).toBe("Email me");
    expect(primary?.getAttribute("href")).toBe("/#contact");
  });
});
