// @vitest-environment jsdom
/**
 * The accessibility floor: skip link, visible focus, target size, and an
 * accessible name on every control — plus the motion contract, which is the one
 * place this file pins a pair rather than a single truth: every animated path
 * has a resting state that is already the final state, and the OS preference is
 * read in exactly one module.
 *
 * The first three are checked where they are decided — the shell for the skip
 * link and the main landmark, the stylesheet for the focus ring, the component
 * for the 44px target and the control's own label — and then once more on the
 * rendered record, so a component that forgets its label cannot hide behind
 * the CSS.
 *
 *   bunx vitest run tests/accessibility-floor.test.ts
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import App from "../src/App";
import { Record } from "../src/components/Record";
import { PROOF_FIGURES } from "../src/components/ProofBand";
import { SHIPPED_CSS, cssVar, remToPx } from "./shipped-css";

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");
const css = SHIPPED_CSS;

/** Source with comments removed — a comment is not a behavior. */
const code = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "");

let host: HTMLDivElement;
let mounted: Root | null = null;

async function mount(element: ReturnType<typeof createElement>) {
  host = document.createElement("div");
  document.body.appendChild(host);
  mounted = createRoot(host);
  await act(async () => {
    mounted!.render(element);
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

describe("skip link and main landmark", () => {
  test("the skip link is the first thing in the document and targets #main", () => {
    const app = read("src/App.tsx");
    const skip = app.indexOf('href="#main"');
    expect(skip).toBeGreaterThan(-1);
    expect(skip).toBeLessThan(app.indexOf("<Header"));
    expect(app).toContain('id="main"');
    expect(app).toContain("tabIndex={-1}");
  });

  test("the skip link is visible when focused, not merely present", () => {
    expect(css).toMatch(/\.skip-link\s*\{[^}]*transform: translateY\(-200%\)/s);
    expect(css).toMatch(/\.skip-link:focus-visible\s*\{[^}]*transform: translateY\(0\)/s);
  });

  test("renders before the header", async () => {
    await mount(createElement(App));
    const skip = host.ownerDocument.querySelector(".skip-link");
    expect(skip).not.toBeNull();
    expect(skip!.getAttribute("href")).toBe("#main");
    expect(skip!.textContent).toBe("Skip to content");
  });
});

describe("visible focus", () => {
  test("there is one focus ring, 2px, offset, and never removed", () => {
    const rule = css.match(/:focus-visible\s*\{([^}]*)\}/s)?.[1] ?? "";
    expect(rule).toContain("outline: 2px solid var(--rec-signal)");
    expect(rule).toContain("outline-offset: 3px");
  });

  test("the only removed outline is the programmatic main landmark", () => {
    const removals = [...css.matchAll(/([^{}]*)\{([^}]*)\}/g)]
      .filter((match) => /outline:\s*none/.test(match[2]))
      .map((match) => match[1].split("*/").pop()!.trim());
    expect(removals).toEqual(["#main:focus"]);
  });
});

describe("motion — two states, one resting truth", () => {
  /* The site has a switch (the footer's Motion control) and honours the OS
     preference; both converge on the same resting state, which is the finished
     page. The assertions below go red if an animated start state is ever
     written into CSS (a hidden block a JS-less visitor never gets back), or if
     a module other than src/lib/motion.ts starts reading the preference. */
  test("the stylesheet collapses motion for both the OS preference and the switch", () => {
    expect(code(css)).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(code(css)).toMatch(/html\[data-motion="off"\]/);
    expect(code(css)).toMatch(/transition-duration: 0\.01ms !important/);
  });

  test("the motion preference is read in one module", () => {
    const readers = [
      "src/lib/router.tsx",
      "src/components/FirstScreen.tsx",
      "src/components/Header.tsx",
      "src/components/RouteCurtain.tsx",
    ].filter((file) =>
      /prefers-reduced-motion|matchMedia/.test(code(read(file))),
    );
    expect(readers).toEqual([]);
    expect(code(read("src/lib/motion.ts"))).toMatch(/prefers-reduced-motion/);
  });

  test("an OS asking for less motion is served the final state, not a zero", async () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    await mount(createElement(Record));

    /* The measured results are in the DOM at their final values on the first
       paint: the counter is an enhancement, never the only source of the
       number. A GSAP tween would have written `0` over each of them first. */
    const figures = [...host.querySelectorAll<HTMLElement>("#proof dd")].map(
      (figure) => figure.textContent?.trim(),
    );
    expect(figures).toEqual(PROOF_FIGURES.map((figure) => figure.value));
    expect(host.textContent).toContain("1,182");

    delete (window as { matchMedia?: unknown }).matchMedia;
  });
});

describe("in-page scroll clearance", () => {
  test("the scrolling root offsets every target past the sticky bar", () => {
    /* `scroll-padding-top` on the scrolling root covers every scroll-into-view
       target - a band, a heading's id, focus moving into main - and it cannot
       stack with a per-section scroll-margin into a double gap. This is the
       regression gate for the mobile defect: with only `section[id]`
       scroll-margin, a heading target landed under the bar. */
    const htmlRule = css.match(/(?:^|\n)html\s*\{([^}]*)\}/)?.[1] ?? "";
    /* The offset is derived from the bar's own height token plus one step, so
       growing the bar cannot push a jumped-to heading under it. */
    expect(htmlRule).toMatch(
      /scroll-padding-top:\s*calc\(var\(--rec-header-h[^)]*\)\s*\+\s*var\(--rec-space-3\)\)/,
    );

    const row = css.match(/\.masthead__row\s*\{([^}]*)\}/s)?.[1] ?? "";
    expect(row, "the masthead row has no min-height").toMatch(
      /min-height:\s*var\(--rec-header-h\)/,
    );
    const header = css.match(/\.masthead\s*\{([^}]*)\}/s)?.[1] ?? "";
    expect(header, "the masthead has no structural rule").toMatch(
      /border-bottom:\s*var\(--rec-rule-w\)/,
    );

    const clearance =
      remToPx(cssVar("--rec-header-h")) +
      remToPx(cssVar("--rec-space-3")) -
      (remToPx(cssVar("--rec-header-h")) + 1);
    expect(
      clearance,
      `scroll-padding leaves the target ${clearance}px below the ${cssVar("--rec-header-h")} bar`,
    ).toBeGreaterThanOrEqual(8);
  });

  test("the offset is not duplicated on section targets", () => {
    // Padding and margin add. Keeping both would scroll a band 144px down.
    expect(css).not.toMatch(/section\[id\]\s*\{[^}]*scroll-margin-top/s);
  });

  test("an in-page jump is always the animated path", () => {
    const router = read("src/lib/router.tsx");
    expect(router).toMatch(/behavior: "smooth"/);
    expect(router).not.toMatch(/behavior:\s*[^,]*\?/);
  });
});

describe("target size", () => {
  const FLOOR = "2.75rem"; // 44px

  test.each([
    ".button",
    ".text-action",
    ".masthead__link",
    ".masthead__mark",
  ])("%s carries the 44px floor", (selector) => {
    const rule = css.match(
      new RegExp(`${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`, "s"),
    )?.[1];
    expect(rule, `${selector} has no rule`).toBeDefined();
    expect(rule, selector).toContain(`min-height: ${FLOOR}`);
  });

  test("the author mark keeps the floor on both axes", () => {
    /* The mark is a 36px signature, narrower than 44px, so the link's box has
       to carry the width itself. */
    const rule = css.match(/\.masthead__mark\s*\{([^}]*)\}/s)?.[1] ?? "";
    expect(rule).toContain("min-width: 2.75rem");
  });

  test("the motion switch carries the floor", () => {
    const rule = css.match(/\.motion-toggle__switch\s*\{([^}]*)\}/s)?.[1];
    expect(rule).toContain(`min-height: ${FLOOR}`);
  });

  test("the footer's smallest links keep both axes", () => {
    // The label alone is narrower than 44px at 13px, so the anchor owns the
    // floor on both axes (tests/footer-target-size.test.ts pins the same rule).
    const footer = read("src/components/Footer.tsx");
    expect(footer).toContain("min-h-11 min-w-11");
  });
});

describe("the rendered record", () => {
  test("every control has an accessible name and none is a div", async () => {
    await mount(createElement(Record));
    const controls = [
      ...host.querySelectorAll<HTMLElement>("a[href], button"),
    ];
    expect(controls.length).toBeGreaterThan(10);
    for (const control of controls) {
      const name =
        control.getAttribute("aria-label") ??
        control.getAttribute("title") ??
        control.textContent?.trim() ??
        "";
      expect(
        name.length,
        `${control.tagName.toLowerCase()} ${control.getAttribute("href") ?? ""} has no accessible name`,
      ).toBeGreaterThan(0);
    }
  });

  test("the before/after comparison is two labelled facts, not a control", async () => {
    /* The record shows both states at once: there is nothing to toggle, so
       there is no pressed state to keep in sync — and the fact is on the page
       for every reader, scripted or not. */
    await mount(createElement(Record));
    const instrument = host.querySelector<HTMLElement>("[data-instrument]");
    expect(instrument, "the latency instrument is not rendered").not.toBeNull();
    expect(instrument!.querySelectorAll("dl")).toHaveLength(2);
    const text = instrument!.textContent ?? "";
    expect(text).toContain("60 s");
    expect(text).toMatch(/under one second/);
    expect(host.querySelector('[role="group"]')).toBeNull();
  });

  test("the comparison reads before, then after", async () => {
    await mount(createElement(Record));
    const instrument = host.querySelector<HTMLElement>("[data-instrument]");
    const labels = [...instrument!.querySelectorAll("dt")].map((term) =>
      (term.textContent ?? "").trim(),
    );
    expect(labels).toHaveLength(2);
    expect(labels[0]).toMatch(/^before /);
    expect(labels[1]).toMatch(/^after /);
  });
});
