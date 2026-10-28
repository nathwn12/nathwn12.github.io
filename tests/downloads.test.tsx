// @vitest-environment jsdom
/**
 * The two documents: one pair per route, never two in the closing viewport.
 *
 * `/Nathaniel-Nikolai-Ladero-Resume.pdf` and `/Nathaniel-Nikolai-Ladero-CV.pdf`
 * are the immutable floor: root-absolute URLs with a download attribute, and
 * both files in the built `dist/`. Where they appear is the contract:
 *
 *   `/`           the cover's primary action row only. The contact band and
 *                 the footer repeat neither - the closing viewport used to
 *                 hold three copies of one pair.
 *   `/experience` the footer only; that route has no cover.
 *   `/projects`   the footer only; that route has no cover.
 *
 * The header carries neither on any route. A relative href, a renamed file, or
 * a second pair in the closing viewport fails here.
 *
 *   pnpm vitest run tests/downloads.test.tsx
 */
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import App from "../src/App";
import { Contact } from "../src/components/Contact";
import { FirstScreen } from "../src/components/FirstScreen";
import { Header } from "../src/components/Header";
import { CV_PATH, RESUME_PATH } from "../src/lib/contact";
import { navigate } from "../src/lib/router";

const RESUME = "/Nathaniel-Nikolai-Ladero-Resume.pdf";
const CV = "/Nathaniel-Nikolai-Ladero-CV.pdf";
const FILENAMES: Record<string, string> = {
  [RESUME]: "Nathaniel-Nikolai-Ladero-Resume.pdf",
  [CV]: "Nathaniel-Nikolai-Ladero-CV.pdf",
};
const root = resolve(import.meta.dirname, "..");

let host: HTMLDivElement;
let mounted: Root | null = null;

async function mount(element: ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  mounted = createRoot(host);
  await act(async () => {
    mounted!.render(element);
  });
}

function downloadsIn(scope: ParentNode): HTMLAnchorElement[] {
  return [...scope.querySelectorAll<HTMLAnchorElement>("a[download]")];
}

function hrefs(links: HTMLAnchorElement[]): string[] {
  return links.map((link) => link.getAttribute("href") ?? "").sort();
}

function expectPair(links: HTMLAnchorElement[], where: string) {
  expect(hrefs(links), `${where} does not offer the pair`).toEqual(
    [CV, RESUME].sort(),
  );
  for (const link of links) {
    const href = link.getAttribute("href")!;
    expect(href.startsWith("/"), `${where}: ${href} is not root-absolute`).toBe(
      true,
    );
    expect(link.getAttribute("download"), `${where}: ${href}`).toBe(
      FILENAMES[href],
    );
  }
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
  if (mounted) {
    await act(async () => {
      mounted!.unmount();
    });
    mounted = null;
  }
  host?.remove();
});

describe("the document URLs are fixed", () => {
  test("the path constants are the root files", () => {
    expect(RESUME_PATH).toBe(RESUME);
    expect(CV_PATH).toBe(CV);
  });

  test("the production build ships both files at the site root", () => {
    expect(existsSync(resolve(root, "dist", RESUME.slice(1)))).toBe(true);
    expect(existsSync(resolve(root, "dist", CV.slice(1)))).toBe(true);
  });
});

describe("the single pair on the cover", () => {
  test("the header is navigation only: no download anchors at all", async () => {
    await mount(createElement(Header));
    expect(host.querySelectorAll("a[download]")).toHaveLength(0);
    expect(host.querySelectorAll('a[href$=".pdf"]')).toHaveLength(0);
    expect(host.textContent).not.toMatch(/Résumé|Resume/);
  });

  test("the first screen offers the pair as its primary documents", async () => {
    await mount(createElement(FirstScreen));
    expectPair(downloadsIn(host), "the first screen");
  });

  test("the contact band offers neither document", async () => {
    await mount(createElement(Contact));
    expect(host.querySelectorAll("a[download]")).toHaveLength(0);
    expect(host.querySelectorAll('a[href$=".pdf"]')).toHaveLength(0);
    expect(host.textContent).not.toContain("Nathaniel-Nikolai-Ladero-Resume.pdf");
    expect(host.textContent).not.toContain("Nathaniel-Nikolai-Ladero-CV.pdf");
  });
});

describe.each([
  ["/", { main: [RESUME, CV], footer: [] }],
  ["/experience", { main: [], footer: [RESUME, CV] }],
  ["/projects", { main: [], footer: [RESUME, CV] }],
] as const)("%s offers exactly one pair", (route, expected) => {
  test("the header is empty, the cover or footer owns the pair, and the total is two", async () => {
    act(() => {
      navigate(route);
    });
    await mount(createElement(App));

    const header = host.querySelector("header")!;
    const main = host.querySelector("main")!;
    const footer = host.querySelector("footer")!;

    expect(downloadsIn(header), `${route} header`).toHaveLength(0);
    expect(hrefs(downloadsIn(main)), `${route} main`).toEqual(
      [...expected.main].sort(),
    );
    expect(hrefs(downloadsIn(footer)), `${route} footer`).toEqual(
      [...expected.footer].sort(),
    );
    expectPair(downloadsIn(host), route);
    expect(downloadsIn(host), `${route} repeats a document`).toHaveLength(2);

    // The contact band exists only on the record, and carries no downloads.
    const contact = host.querySelector("#contact");
    if (route === "/") {
      expect(contact, "the record has no contact band").not.toBeNull();
      expect(downloadsIn(contact!)).toHaveLength(0);
    }
  });
});
