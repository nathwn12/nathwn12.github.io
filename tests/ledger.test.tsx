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
import { figures, proofRows } from "../src/content/ledger";
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
    expect(html).not.toMatch(/class="[^"]*\bcard\b/);
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

  test("the method is a spec sheet with no prose paragraphs", () => {
    const from = html.indexOf('id="method"');
    const to = html.indexOf('id="contact"');
    const method = html.slice(from, to);
    expect(method).not.toMatch(/<p\b/);
    expect(method).toContain("spec-line");
  });

  test("the contact is a mailto, with no form", () => {
    expect(html).toContain(`mailto:${CONTACT_EMAIL}`);
    expect(html).not.toContain("<form");
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
      ground: "#121214", ink: "#E9E6E1", "ink-muted": "#9A968E",
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
    expect(existsSync(resolve(root, "src/lib/blackhole"))).toBe(false);
    expect(existsSync(resolve(root, "src/components/HorizonVideo.tsx"))).toBe(false);
  });

  test("no motion machinery survives in the source", () => {
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
  });
});
