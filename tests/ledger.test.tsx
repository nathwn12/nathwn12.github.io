// @vitest-environment jsdom
/**
 * The event-horizon ledger's own floor: one navigation, five reachable
 * chapters, content truth from src/content, tokens as the only colour source,
 * and a complete static document when motion is off.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import LedgerPage from "../src/components/LedgerPage";
import { figures, proofRows } from "../src/content/ledger";
import { CONTACT_EMAIL } from "../src/lib/contact";

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const html = renderToStaticMarkup(createElement(LedgerPage));
const css = read("src/styles/ledger.css");
const base = read("src/styles/base.css");
const fonts = read("src/styles/fonts.css");
const tokens = read("src/styles/tokens.css");

describe("one navigation, every chapter reachable", () => {
  test("exactly one nav landmark with five in-page links", () => {
    expect(html.match(/<nav\b/g) ?? []).toHaveLength(1);
    const nav = html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/)?.[0] ?? "";
    const links = nav.match(/href="#(reduction|method|work|record|contact)"/g) ?? [];
    expect(links).toHaveLength(5);
  });

  test("one main, one header, the skip link first, five labelled sections", () => {
    expect(html.match(/<main\b/g) ?? []).toHaveLength(1);
    expect(html.match(/<header\b/g) ?? []).toHaveLength(1);
    expect(html.indexOf("skip-link")).toBeLessThan(html.indexOf("masthead"));
    for (const id of ["reduction", "method", "work", "record", "contact"]) {
      expect(html).toContain(`id="${id}"`);
      expect(html).toContain(`aria-labelledby="${id}-title"`);
    }
  });

  test("the footer is a colophon, not a second nav", () => {
    expect(html).toContain("colophon");
    expect(html).toContain("glsl-black-hole");
    expect(html).toContain("MIT");
  });
});

describe("content truth is the ledger", () => {
  test("the parsed figures render as tabular numerals", () => {
    expect(figures.commits).toBe("1,182");
    expect(figures.repositories).toBe("17");
    expect(figures.scanned).toBe("21");
    expect(html).toContain(figures.commits!);
    expect(html).toContain(figures.repositories!);
    expect(html).toContain(figures.scanned!);
  });

  test("the measured rows come from content, not retyped copy", () => {
    for (const row of proofRows) {
      expect(html).toContain(row.figure);
      expect(html).toContain(row.claim);
    }
    expect(html).toContain("−98%");
  });

  test("the contact is a large mailto, with no form", () => {
    expect(html).toContain(`mailto:${CONTACT_EMAIL}`);
    expect(html).toContain(CONTACT_EMAIL);
    expect(html).not.toContain("<form");
  });

  test("the work rows are open links, not cards", () => {
    expect(html.match(/class="work-row"/g)).toHaveLength(13);
    expect(html).not.toMatch(/class="[^"]*\bcard\b/);
  });
});

describe("tokens are the only colour source", () => {
  test("no raw hex in the new component, stylesheet or base", () => {
    for (const source of [
      read("src/components/LedgerPage.tsx"),
      read("src/components/HorizonCanvas.tsx"),
      css,
      base,
    ]) {
      expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
  });

  test("both skies are declared through data-theme", () => {
    expect(tokens).toContain('[data-theme="light"]');
    expect(css).toContain('[data-theme="light"] .horizon-plate');
    expect(base).toContain('html[data-motion="off"]');
  });
});

describe("reduced motion is a complete document", () => {
  test("reveals are hidden only when motion is explicitly on and allowed", () => {
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(css).toContain('html[data-motion="on"] [data-reveal]');
    expect(css).toContain('html[data-motion="on"] [data-reveal].is-in');
  });

  test("the canvas holds a still when motion is off", () => {
    const canvas = read("src/components/HorizonCanvas.tsx");
    expect(canvas).toContain("prefersReducedMotion");
    expect(canvas).toContain("renderStill");
    expect(canvas).toContain("webglcontextlost");
  });

  test("native scroll is never intercepted", () => {
    for (const source of [css, read("src/components/LedgerPage.tsx")]) {
      expect(source).not.toContain("preventDefault");
      expect(source).not.toMatch(/wheel|touchmove|scroll-snap-type/);
    }
  });
});

describe("the committed type stack is self-hosted", () => {
  for (const family of ["Playfair Display", "Source Serif 4", "Space Mono"]) {
    test(`${family} is declared with font-display swap`, () => {
      expect(fonts).toContain(`font-family: "${family}"`);
      expect(fonts).toContain("font-display: swap");
    });
  }

  test("the display cut is the single preload and the licence ships", () => {
    const htmlFile = read("index.html");
    expect(htmlFile).toContain("PlayfairDisplay-Variable.woff2");
    expect(htmlFile).not.toContain("Archivo-Variable");
    expect(htmlFile).not.toContain("JetBrainsMono-Regular");
    expect(read("public/fonts/OFL-Ledger.txt")).toContain("OPEN FONT LICENSE");
  });
});
