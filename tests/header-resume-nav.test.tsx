// @vitest-environment jsdom
/**
 * The chapter index is the one in-page navigation: five chapters, in order,
 * with no documents and no route links. A hash is the only address it writes.
 *
 * The masthead that used to sit above it is retired; this file now holds the
 * index that replaced it. Every assertion below can go red:
 *
 *   bunx vitest run tests/header-resume-nav.test.tsx
 */
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ChapterStage } from "../src/components/stage/ChapterStage";
import { Footer } from "../src/components/Footer";
import { FirstScreen } from "../src/components/FirstScreen";
import { CHAPTERS } from "../src/lib/chapters";
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
  window.history.replaceState(null, "", "/");
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

describe("the one chapter index", () => {
  test("offers the five chapters in order and no documents", async () => {
    await mount(createElement(ChapterStage));
    const nav = host.querySelector("nav");
    expect(nav, "the chapter index is missing").not.toBeNull();
    const links = [...nav!.querySelectorAll<HTMLAnchorElement>("a[href]")];
    expect(links).toHaveLength(CHAPTERS.length);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      CHAPTERS.map((chapter) => `#${chapter.id}`),
    );
    for (const chapter of CHAPTERS) {
      expect(nav!.textContent, chapter.label).toContain(chapter.label);
    }
    expect(nav!.querySelectorAll("a[download]")).toHaveLength(0);
    expect(nav!.querySelectorAll('a[href$=".pdf"]')).toHaveLength(0);
    expect(nav!.textContent).not.toMatch(/Résumé|Resume/);
  });

  test("marks exactly one chapter current", async () => {
    await mount(createElement(ChapterStage));
    const current = host.querySelectorAll('nav [aria-current="true"]');
    expect(current).toHaveLength(1);
    expect(current[0].getAttribute("data-chapter-link")).toBe(CHAPTERS[0].id);
  });

  test("renders all five chapter headings at once", async () => {
    await mount(createElement(ChapterStage));
    const headings = [...host.querySelectorAll(".stage-panel h1, .stage-panel h2")];
    expect(headings).toHaveLength(CHAPTERS.length);
  });
});

describe("the footer owns the documents", () => {
  test("rendered nav and main carry none; the footer carries the pair", async () => {
    act(() => {
      navigate("/");
    });
    await mount(
      createElement(() => (
        <>
          <ChapterStage />
          <Footer />
        </>
      )),
    );

    const main = host.querySelector(".stage");
    const footer = host.querySelector("footer");
    expect(main, "the stage is missing").not.toBeNull();
    expect(footer, "the footer is missing").not.toBeNull();

    const mainDocs = [
      ...main!.querySelectorAll<HTMLAnchorElement>('a[href$=".pdf"]'),
    ];
    const footerDocs = [
      ...footer!.querySelectorAll<HTMLAnchorElement>('a[href$=".pdf"]'),
    ];
    expect(mainDocs).toHaveLength(0);
    expect(footerDocs.map((a) => a.getAttribute("href")).sort()).toEqual(
      [CV_PATH, RESUME_PATH].sort(),
    );
  });
});

describe("the mark", () => {
  test("names the person once, in the colophon", () => {
    const markup = renderToStaticMarkup(createElement(Footer));
    expect(markup.match(/Nathaniel Nikolai Ladero/g)).toHaveLength(1);
    expect(markup).toContain(
      `© ${new Date().getFullYear()} Nathaniel Nikolai Ladero.`,
    );
    expect(markup).toContain("Source on GitHub");
  });
});

describe("homepage actions", () => {
  test("the first screen offers no documents: its two actions are the record's", async () => {
    await mount(createElement(FirstScreen));
    const hrefs = [...host.querySelectorAll<HTMLAnchorElement>("a[href]")].map(
      (anchor) => anchor.getAttribute("href"),
    );
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
