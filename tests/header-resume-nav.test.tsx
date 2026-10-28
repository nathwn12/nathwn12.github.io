// @vitest-environment jsdom
/**
 * The global header is page navigation, not a second résumé action.
 *
 * The Résumé item is gone from both the desktop nav row and the mobile menu,
 * while the four page destinations stay. The homepage's own résumé download
 * and the page-foot download are untouched.
 *
 * Every assertion below can go red:
 *
 *   pnpm vitest run tests/header-resume-nav.test.tsx
 */
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Header } from "../src/components/Header";
import { Hero } from "../src/components/Hero";
import { navigate } from "../src/lib/router";

vi.mock("../src/components/SystemAtlas", () => ({
  SystemAtlas: () => null,
}));
vi.mock("../src/components/ProofBand", () => ({
  ProofBand: () => null,
  CredentialsStrip: () => null,
}));
vi.mock("../src/components/WorkTeaser", () => ({
  WorkTeaser: () => null,
}));
vi.mock("../src/components/PageFoot", () => ({
  PageFoot: () => null,
}));
vi.mock("../src/components/ExperienceBand", () => ({
  ExperienceBand: () => null,
}));
vi.mock("../src/components/ForwardBand", () => ({
  ForwardBand: () => null,
}));

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

const PAGE_LABELS = ["Experience", "Skills", "Projects", "Contact"];

describe("global header navigation", () => {
  test("keeps the page destinations and drops the Résumé item", async () => {
    await mount(createElement(Header));
    const header = host.querySelector("header");
    expect(header).not.toBeNull();
    const text = header!.textContent ?? "";

    expect(text).not.toMatch(/Résumé|Resume/);
    for (const label of PAGE_LABELS) {
      expect(text, `${label} nav item is missing`).toContain(label);
    }
  });

  test("the mobile menu also drops the Résumé item", async () => {
    await mount(createElement(Header));
    const menuButton = host.querySelector<HTMLButtonElement>(
      'button[aria-controls="mobile-nav"]',
    );
    if (!menuButton) throw new Error("the mobile menu trigger is missing");
    await act(async () => {
      menuButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const mobileNav = host.querySelector("#mobile-nav");
    expect(mobileNav).not.toBeNull();
    expect(mobileNav!.textContent).not.toMatch(/Résumé|Resume/);
    for (const label of PAGE_LABELS) {
      expect(mobileNav!.textContent, `${label} mobile item is missing`).toContain(
        label,
      );
    }
  });
});

describe("homepage résumé control", () => {
  test("the homepage still offers the résumé and CV downloads", async () => {
    await mount(createElement(Hero));
    const resume = host.querySelector<HTMLAnchorElement>(
      'a[href="/Nathaniel-Nikolai-Ladero-Resume.pdf"][download]',
    );
    expect(resume, "the homepage résumé download is missing").not.toBeNull();
    expect(resume!.textContent).toContain("Résumé — PDF");

    const cv = host.querySelector<HTMLAnchorElement>(
      'a[href="/Nathaniel-Nikolai-Ladero-CV.pdf"][download]',
    );
    expect(cv, "the homepage CV download is missing").not.toBeNull();
    expect(cv!.textContent).toContain("CV — PDF");
    // Same treatment as the résumé control, not a one-off.
    expect(cv!.className).toBe(resume!.className);
  });
});
