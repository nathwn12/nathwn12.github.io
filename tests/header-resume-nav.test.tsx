// @vitest-environment jsdom
/**
 * The global header is three destinations: Record, Work, Contact.
 *
 * The Résumé is a home-page action, never a nav item. The contact destination
 * carries the cover's section hash. The homepage still offers both documents
 * with real download attributes at their root URLs.
 *
 *   pnpm vitest run tests/header-resume-nav.test.tsx
 */
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SiteHead } from "../src/components/SiteHead";
import { Cover } from "../src/components/Cover";
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

describe("global header navigation", () => {
  test("names exactly Record, Work, Contact in that order", async () => {
    await mount(createElement(SiteHead));
    const links = [...host.querySelectorAll("header nav a")].map((a) => ({
      label: a.textContent.trim(),
      href: a.getAttribute("href"),
    }));
    expect(links).toEqual([
      { label: "Record", href: "/record" },
      { label: "Work", href: "/work" },
      { label: "Contact", href: "/#contact" },
    ]);
  });

  test("drops the résumé item and every retired destination", async () => {
    await mount(createElement(SiteHead));
    const text = host.querySelector("header")!.textContent ?? "";
    expect(text).not.toMatch(/Résumé|Resume/);
    for (const retired of ["Experience", "Skills", "Projects", "Thanks"]) {
      expect(text, retired).not.toContain(retired);
    }
  });

  test("marks the active route with aria-current, and never on the cover", async () => {
    navigate("/record");
    await mount(createElement(SiteHead));
    expect(
      host.querySelector('header nav a[aria-current="page"]')?.textContent,
    ).toBe("Record");

    await act(async () => {
      root!.unmount();
    });
    host.remove();
    navigate("/");
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(SiteHead));
    });
    expect(host.querySelector('header nav a[aria-current="page"]')).toBeNull();
  });
});

describe("homepage documents", () => {
  test("offers the résumé and CV at their root URLs with download", async () => {
    await mount(createElement(Cover));
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
  });
});
