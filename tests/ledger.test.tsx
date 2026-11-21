// @vitest-environment jsdom
/**
 * The ledger's surviving floor: one nav, five clusters in descent order,
 * committed data, and a document with no committed design law.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import LedgerPage from "../src/components/LedgerPage";
import { fieldPoints } from "../src/content/field";
import { aiPractice, figures, proofRows } from "../src/content/ledger";
import { experience, provenance } from "../src/content/experience";
import { signal } from "../src/content/signal";
import { featuredRows, indexRows } from "../src/content/showcase";
import { CONTACT_EMAIL } from "../src/lib/contact";

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const html = renderToStaticMarkup(createElement(LedgerPage));
const indexHtml = read("index.html");
const ORDER = ["signal", "work", "proof", "method", "contact"];

describe("one nav, five clusters in descent order", () => {
  test("the nav lists the five stages in descent order", () => {
    expect(html.match(/<nav\b/g) ?? []).toHaveLength(1);
    const nav = html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/)?.[0] ?? "";
    const links = [...nav.matchAll(/href="#([a-z]+)"/g)].map((match) => match[1]);
    expect(links).toEqual(ORDER);
  });

  test("the sections render after the hero in the same order", () => {
    expect(html.match(/<main\b/g) ?? []).toHaveLength(1);
    expect(html.match(/<header\b/g) ?? []).toHaveLength(1);
    expect(html.indexOf("skip-link")).toBeLessThan(html.indexOf("stage-nav"));
    const ids = [...html.matchAll(/<section id="([a-z]+)"/g)].map((match) => match[1]);
    expect(ids.slice(0, 6)).toEqual(["horizon", ...ORDER]);
    for (const id of ORDER) {
      expect(html).toContain(`aria-labelledby="${id}-title"`);
    }
  });

  test("the footer is a colophon, not a second nav", () => {
    expect(html).toContain("colophon");
  });

  test("the masthead uses the owned mark once at width 120", () => {
    expect(html.match(/<img[^>]*brand\/signature\.svg/g) ?? []).toHaveLength(1);
    expect(html).toContain('width="120"');
    expect(html).not.toContain("stage-mark-tail");
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.stage-mark img\s*\{[^}]*width:\s*120px/);
  });

  test("the field is behind the plate and one chapter is active", () => {
    expect(html).toContain('class="field-canvas"');
    expect(html).toContain(`data-point-count="${fieldPoints.length}"`);
    expect(html.match(/aria-current="true"/g) ?? []).toHaveLength(1);
    expect(html.indexOf("field-canvas")).toBeLessThan(html.indexOf("hero-hud"));
  });

  test("the narrow constellation keeps five links on one row", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(
      /@media \(max-width: 700px\)[\s\S]*?\.stage-nav\s*\{[^}]*flex-wrap:\s*nowrap/,
    );
    expect(css).toMatch(
      /@media \(max-width: 700px\)[\s\S]*?\.stage-nav a\s*\{[^}]*min-width:\s*0/,
    );
  });

  test("the ticker shows complete text without a clip or marquee", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.ticker \{[^}]*overflow:\s*visible/);
    expect(css).toMatch(/\.ticker-track \{[^}]*white-space:\s*normal/);
    expect(css).not.toMatch(/@keyframes/);
  });

  test("sparklines are stroked rules, never black fills", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.spark polyline\s*\{[^}]*fill:\s*none/);
    expect(css).toMatch(/\.spark\.measure polyline/);
    expect(css).toContain("font-variant-numeric: tabular-nums");
    expect(html.match(/class="ticker-run"/g) ?? []).toHaveLength(0);
  });
});

describe("the content survives the strip", () => {
  test("every committed package draws one sparkline cell", () => {
    expect(html.match(/class="spark-cell"/g) ?? []).toHaveLength(
      signal.packages.length,
    );
    expect(signal.packages.length).toBeGreaterThanOrEqual(9);
    expect(html).toContain("34,603");
  });

  test("the activity strip is thirty measured cells with a text alternative", () => {
    expect(html.match(/class="heat-cell"/g) ?? []).toHaveLength(30);
    expect(html).toContain("active days from");
  });

  test("the bake date is visible in micro-type", () => {
    expect(html).toContain(signal.stamp);
    expect(html).toContain(signal.snapshotDate);
  });

  test("the ticker still renders its readout", () => {
    expect(html).toContain('class="ticker"');
  });

  test("three number-led features and ten compact index entries", () => {
    expect(featuredRows).toHaveLength(3);
    expect(indexRows).toHaveLength(10);
    expect(html.match(/class="featured-row"/g) ?? []).toHaveLength(3);
    expect(html.match(/class="index-row"/g) ?? []).toHaveLength(10);
    expect(
      (html.match(/class="featured-row"/g) ?? []).length +
        (html.match(/class="index-row"/g) ?? []).length,
    ).toBe(13);
    expect(html).not.toMatch(/class="[^"]*\bcard\b/);
  });

  test("the register draws a signal rule on hover, never a box", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.featured-row:hover::after/);
    expect(css).toMatch(/\.index-row:focus-within::after/);
    expect(css).toContain("border-block-end: 1px solid");
  });

  test("the proof keeps its four measured rows and their figures", () => {
    for (const row of proofRows) {
      expect(html).toContain(row.figure);
      expect(html).toContain(row.claim);
    }
    expect(html).toContain("−98%");
    expect(figures.commits).toBe("1,182");
    expect(html).toContain(figures.commits!);
  });

  test("the proof carries provenance and measured experience rows", () => {
    expect(html).toContain(provenance);
    expect(html.match(/class="experience-row/g) ?? []).toHaveLength(
      experience.length,
    );
    expect(html.match(/class="experience-figure"/g) ?? []).toHaveLength(
      experience.filter((entry) => entry.metric).length,
    );
    for (const entry of experience) {
      expect(html).toContain(entry.outcome);
    }
  });

  test("the method is prose at the measure, then a ruled spec", () => {
    const from = html.indexOf('id="method"');
    const to = html.indexOf('id="contact"');
    const method = html.slice(from, to);
    expect(method.match(/class="method-prose"/g) ?? []).toHaveLength(1);
    expect(method.match(/<p>/g) ?? []).toHaveLength(aiPractice.sentences.length);
    for (const sentence of aiPractice.sentences) {
      expect(method).toContain(sentence);
    }
    expect(method.match(/class="practice-list"/g) ?? []).toHaveLength(1);
    expect(method.match(/<li>/g) ?? []).toHaveLength(aiPractice.facts.length);
    expect(method).toContain("spec-line");
    expect(read("src/styles/ledger.css")).toContain("max-width: var(--measure)");
  });

  test("the contact is a mailto, with no form", () => {
    expect(html).toContain(`mailto:${CONTACT_EMAIL}`);
    expect(html).not.toContain("<form");
  });

  test("the address is a display link and the colophon is links", () => {
    expect(html).toContain('class="mailto"');
    const colophon = html.slice(html.indexOf('class="colophon'));
    expect(colophon.match(/<a /g) ?? []).toHaveLength(5);
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.mailto\s*\{[^}]*var\(--font-display\)/);
    expect(css).toContain(".colophon-links");
  });

  test("the og card is generated from the law and the record", () => {
    const script = read("scripts/gen-og.mjs");
    expect(script).toContain("src/styles/tokens.css");
    expect(script).toContain("DESIGN.md");
    expect(script).toContain("src/content/open-source-stats.json");
    expect(indexHtml).not.toContain("og-image-2026-11-13.png");
    expect(indexHtml).toMatch(/og-image-\d{4}-\d{2}-\d{2}\.png/);
  });
});

describe("the stripped floor", () => {
  test("index.html preloads one display cut and carries no theme law", () => {
    expect(indexHtml).not.toContain("data-theme");
    expect(indexHtml).not.toContain("theme-color");
    expect(indexHtml.match(/rel="preload"/g) ?? []).toHaveLength(1);
    expect(indexHtml).toContain('href="/fonts/libre-bodoni-latin-var.woff2"');
    expect(indexHtml).toContain('as="font"');
    expect(indexHtml).toContain("crossorigin");
    expect(indexHtml).toContain("<title>Nathaniel Nikolai Ladero — event horizon</title>");
  });

  test("tokens carry the committed palette, space scale and motion", () => {
    const tokens = read("src/styles/tokens.css");
    for (const [name, hex] of Object.entries({
      ground: "#000000", ink: "#E9E6E1", "ink-muted": "#9A968E",
      signal: "#C68E74", "on-signal": "#1A1512", measure: "#627AC2",
      selection: "#C68E7428",
    })) {
      expect(tokens).toContain(`--color-${name}: ${hex}`);
    }
    expect(tokens).toContain("@theme static");
    for (const step of [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128]) {
      expect(tokens).toContain(`--space-${step}:`);
    }
    expect(tokens).toContain("--motion-quick: 140ms");
    expect(tokens).toContain("--motion-base: 280ms");
    expect(tokens).toContain("--radius-none: 0px");
    expect(tokens).not.toMatch(/color-scheme\s*:/);
  });

  test("the base ground reads tokens and writes no color literal", () => {
    const base = read("src/styles/base.css");
    expect(base).toContain("background-color: var(--color-ground)");
    expect(base).toContain("font-family: var(--font-text)");
    expect(base).toContain(":focus-visible");
    expect(base).toContain("color-mix(in srgb, var(--color-ink-muted)");
    expect(base).toContain("::selection");
    expect(base).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  test("display, text and data fonts ship with their licences", () => {
    const dir = resolve(root, "public/fonts");
    const faces = [
      "libre-bodoni-latin-var.woff2",
      "newsreader-latin-var.woff2",
      "ibm-plex-mono-400-latin.woff2",
      "ibm-plex-mono-500-latin.woff2",
      "ibm-plex-mono-600-latin.woff2",
    ];
    for (const face of faces) {
      const file = readFileSync(resolve(dir, face));
      expect(file.subarray(0, 4).toString("ascii"), face).toBe("wOF2");
      expect(file.length, face).toBeGreaterThan(1000);
    }
    for (const licence of [
      "OFL-Libre-Bodoni.txt",
      "OFL-Newsreader.txt",
      "OFL-IBM-Plex-Mono.txt",
    ]) {
      expect(readFileSync(resolve(dir, licence), "utf8")).toContain(
        "SIL OPEN FONT LICENSE",
      );
    }
    expect(existsSync(resolve(root, "public/horizon-a-desktop.mp4"))).toBe(false);
    expect(existsSync(resolve(root, "src/lib/blackhole/renderer.ts"))).toBe(true);
    expect(existsSync(resolve(root, "src/lib/blackhole/shaders.ts"))).toBe(true);
    expect(existsSync(resolve(root, "src/components/HorizonVideo.tsx"))).toBe(false);
  });

  test("the only loop is the one settle field", () => {
    const sources = [
      "src/components/LedgerPage.tsx",
      "src/components/Instruments.tsx",
      "src/styles/base.css",
      "src/styles/ledger.css",
      "src/styles/tokens.css",
    ];
    for (const source of sources) {
      expect(read(source)).not.toMatch(/data-reveal|data-motion|@keyframes|requestAnimationFrame/);
    }
    const field = read("src/components/PointField.tsx");
    expect(field).toContain("requestAnimationFrame");
    expect(field).toContain("IntersectionObserver");
    expect(field).toContain("prefers-reduced-motion");
    expect(field).toContain("Math.min(window.devicePixelRatio || 1, 2)");
  });
});
