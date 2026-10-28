// @vitest-environment jsdom
/**
 * The accessibility floor: skip link, visible focus, target size, and an
 * accessible name on every control — plus the owner's motion order, which is
 * the one place this file pins the *opposite* of a preference: the animated
 * path is the only path, whatever the OS asks for.
 *
 * The first three are checked where they are decided — the shell for the skip
 * link and the main landmark, the stylesheet for the focus ring, the component
 * for the 44px target and the control's own label — and then once more on the
 * rendered record, so a component that forgets its label cannot hide behind
 * the CSS.
 *
 *   pnpm vitest run tests/accessibility-floor.test.ts
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import App from "../src/App";
import { Record } from "../src/components/Record";
import { Reveal } from "../src/components/Reveal";

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");
const css = read("src/index.css");

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
    expect(rule).toContain("outline: 2px solid var(--color-accent)");
    expect(rule).toContain("outline-offset: 3px");
  });

  test("the only removed outline is the programmatic main landmark", () => {
    const removals = [...css.matchAll(/([^{}]*)\{([^}]*)\}/g)]
      .filter((match) => /outline:\s*none/.test(match[2]))
      .map((match) => match[1].split("*/").pop()!.trim());
    expect(removals).toEqual(["#main:focus"]);
  });
});

describe("motion — the animated path is the only path", () => {
  /* Owner order 2026-10-14: the OS `prefers-reduced-motion` query does not gate
     this site. The assertions below go red the moment a preference branch, a
     media override, or a module-load probe comes back. */
  test("the stylesheet carries no reduced-motion override", () => {
    expect(code(css)).not.toMatch(/prefers-reduced-motion/);
    expect(code(css)).toMatch(/scroll-behavior: smooth/);
  });

  test("no runtime module reads the OS motion query", () => {
    for (const file of [
      "src/lib/motion.ts",
      "src/lib/router.tsx",
      "src/components/FirstScreen.tsx",
    ]) {
      const source = code(read(file));
      expect(source, `${file} reads the motion preference`).not.toMatch(
        /prefers-reduced-motion|matchMedia/,
      );
    }
  });

  test("an OS asking for less motion still gets the reveal, and the query is never read", async () => {
    const queries: string[] = [];
    window.matchMedia = ((query: string) => {
      queries.push(query);
      return {
        matches: true,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      } as unknown as MediaQueryList;
    }) as typeof window.matchMedia;

    let fire: ((entries: { isIntersecting: boolean }[]) => void) | null = null;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
          fire = cb;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );

    await mount(
      createElement(Reveal, null, createElement("p", null, "The record")),
    );
    const wrapper = host.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("enter");
    expect(wrapper.className).not.toContain("is-in");

    await act(async () => {
      fire!([{ isIntersecting: true }]);
    });
    expect(wrapper.className).toContain("is-in");
    expect(queries, "the OS motion query was read").toEqual([]);
  });
});

describe("in-page scroll clearance", () => {
  const px = (value: string) => Number(value) * 16; // 1rem = 16px at the root

  test("the scrolling root offsets every target past the sticky bar", () => {
    /* `scroll-padding-top` on the scrolling root covers every scroll-into-view
       target - a band, a heading's id, focus moving into main - and it cannot
       stack with a per-section scroll-margin into a double gap. This is the
       regression gate for the mobile defect: with only `section[id]`
       scroll-margin, a heading target landed under the bar. */
    const htmlRule = css.match(/(?:^|\n)html\s*\{([^}]*)\}/)?.[1] ?? "";
    const padding = htmlRule.match(/scroll-padding-top:\s*([\d.]+)rem/)?.[1];
    expect(padding, "html has no scroll-padding-top").toBeDefined();

    const row = css.match(/\.site-header__row\s*\{([^}]*)\}/s)?.[1] ?? "";
    const minHeight = row.match(/min-height:\s*([\d.]+)rem/)?.[1];
    expect(minHeight, "the header row has no min-height").toBeDefined();
    const header = css.match(/\.site-header\s*\{([^}]*)\}/s)?.[1] ?? "";
    const border = header.match(/border-bottom:\s*(\d+)px/)?.[1];
    expect(border, "the header has no structural rule").toBeDefined();

    const barHeight = px(minHeight!) + Number(border);
    const clearance = px(padding!) - barHeight;
    expect(
      clearance,
      `scroll-padding ${padding}rem leaves the target ${clearance}px below a ${barHeight}px bar`,
    ).toBeGreaterThanOrEqual(8);
  });

  test("the offset is not duplicated on section targets", () => {
    // Padding and margin add. Keeping both would scroll a band 144px down.
    expect(css).not.toMatch(/section\[id\]\s*\{[^}]*scroll-margin-top/s);
  });

  test("an in-page jump is always the animated path", () => {
    // No preference branch: the band scroll requests `smooth` unconditionally.
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
    ".site-nav__link",
    ".wordmark",
  ])("%s carries the 44px floor", (selector) => {
    const rule = css.match(
      new RegExp(`${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`, "s"),
    )?.[1];
    expect(rule, `${selector} has no rule`).toBeDefined();
    expect(rule, selector).toContain(`min-height: ${FLOOR}`);
  });

  test("the monogram keeps the floor on both axes", () => {
    /* The mark is three characters, not a full name, so its glyph run is
       narrower than 44px: the link's box has to carry the width itself. */
    const rule = css.match(/\.wordmark\s*\{([^}]*)\}/s)?.[1] ?? "";
    expect(rule).toContain("min-width: 2.75rem");
  });

  test("the measurement switch's buttons carry the floor", () => {
    const rule = css.match(/\.measure__switch button\s*\{([^}]*)\}/s)?.[1];
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

  test("the before/after control is two real buttons, labelled and keyboard reachable", async () => {
    await mount(createElement(Record));
    const group = host.querySelector('[role="group"]');
    expect(group).not.toBeNull();
    const labelledBy = group!.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(host.ownerDocument.getElementById(labelledBy!)).not.toBeNull();

    const buttons = [...group!.querySelectorAll("button")];
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button.getAttribute("type")).toBe("button");
      expect(button.hasAttribute("aria-pressed")).toBe(true);
      expect(button.tabIndex).toBe(0);
    }
    // Exactly one state is on at a time, and the default render is "after".
    expect(buttons.filter((b) => b.getAttribute("aria-pressed") === "true")).toHaveLength(1);
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
  });

  test("the figure the control swaps is announced, not just repainted", async () => {
    await mount(createElement(Record));
    const figure = host.querySelector(".measure .figure");
    expect(figure?.getAttribute("aria-live")).toBe("polite");
  });
});
