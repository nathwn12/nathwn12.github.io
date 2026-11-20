// @vitest-environment jsdom
/**
 * The event-horizon ledger's floor: one fixed stage nav, five instrument
 * clusters in descent order, the data traceable to committed snapshots, the
 * locked type stack, and a complete static document when motion is off.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import LedgerPage from "../src/components/LedgerPage";
import { heroVariantFromSearch } from "../src/components/HorizonVideo";
import { figures, proofRows } from "../src/content/ledger";
import { signal } from "../src/content/signal";
import { featuredRows, indexRows } from "../src/content/showcase";
import { CONTACT_EMAIL } from "../src/lib/contact";

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const html = renderToStaticMarkup(createElement(LedgerPage));
const css = read("src/styles/ledger.css");
const base = read("src/styles/base.css");
const instruments = read("src/styles/instruments.css");
const descent = read("src/styles/descent.css");
const fonts = read("src/styles/fonts.css");
const tokens = read("src/styles/tokens.css");
const indexHtml = read("index.html");
const ORDER = ["signal", "work", "proof", "method", "contact"];

describe("one fixed stage nav, five clusters in descent order", () => {
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
    expect(html).toContain("glsl-black-hole");
    expect(html).toContain("MIT");
  });
});

describe("the signal is a live instrument, not a stats list", () => {
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

  test("the ticker is a fixed bottom readout", () => {
    expect(html).toContain('class="ticker"');
    expect(instruments).toContain(".ticker {");
    expect(instruments).toContain("position: fixed");
    expect(instruments).toContain("@keyframes ticker-slide");
  });
});

describe("the work is a showcase plus a dense index", () => {
  test("three number-led features and ten compact index entries", () => {
    expect(featuredRows).toHaveLength(3);
    expect(indexRows).toHaveLength(10);
    expect(html.match(/class="featured-row"/g) ?? []).toHaveLength(3);
    expect(html.match(/class="index-row"/g) ?? []).toHaveLength(10);
    expect(html).not.toMatch(/class="[^"]*\bcard\b/);
  });

  test("the proof keeps its four measured rows and their ink-centre figures", () => {
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
});

describe("content truth, tokens and the one dark sky", () => {
  test("no raw hex in a component or stylesheet", () => {
    for (const source of [
      read("src/components/LedgerPage.tsx"),
      read("src/components/HorizonVideo.tsx"),
      css,
      base,
      instruments,
      descent,
    ]) {
      expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
  });

  test("the paper sky is deleted, not adapted", () => {
    expect(tokens).toContain("color-scheme: dark");
    expect(tokens).not.toContain('[data-theme="light"]');
    expect(indexHtml).toContain('data-theme="dark"');
    expect(indexHtml).not.toContain("prefers-color-scheme");
    expect(base).toContain('html[data-motion="off"]');
  });

  test("zero PAPER nodes ship", () => {
    expect(html).not.toMatch(/\bpaper\b|theme-toggle|void mode/i);
    expect(html).not.toContain("Switch to");
  });

  test("the contact is a large mailto, with no form", () => {
    expect(html).toContain(`mailto:${CONTACT_EMAIL}`);
    expect(html).not.toContain("<form");
  });
});

describe("the fixed descent layer keeps the C hero asset", () => {
  test("only a, b and c are real; anything else is the default c", () => {
    expect(heroVariantFromSearch("?hero=a")).toBe("a");
    expect(heroVariantFromSearch("?hero=b")).toBe("b");
    expect(heroVariantFromSearch("?hero=c")).toBe("c");
    expect(heroVariantFromSearch("")).toBe("c");
    expect(heroVariantFromSearch("?hero=zzz")).toBe("c");
    expect(heroVariantFromSearch("?hero=A")).toBe("c");
  });

  test("the layer is fixed and driven by one rAF, transform and opacity only", () => {
    expect(descent).toContain("position: fixed");
    expect(descent).toContain("will-change: transform, opacity");
    const video = read("src/components/HorizonVideo.tsx");
    expect(video).toContain("requestAnimationFrame");
    expect(video).toContain('passive: true');
    expect(video).not.toContain("getBoundingClientRect");
    expect(video).toContain("scrollY");
    expect(html).toContain("horizon-layer");
  });

  test("A keeps its dither crisp; B and C stay smooth", () => {
    expect(css).toContain(".horizon-video--a {");
    expect(css).toContain("image-rendering: pixelated");
    expect(css.match(/image-rendering/g) ?? []).toHaveLength(1);
  });

  test("the recorded loop keeps its sources and settled poster", () => {
    const video = read("src/components/HorizonVideo.tsx");
    expect(video).toContain('preload="metadata"');
    expect(video).toContain("playsInline");
    expect(video).toContain("RATE = 0.7");
    expect(video).toContain('classList.add("is-still")');
    expect(video).toContain("visibilitychange");
    expect(html).toContain("horizon-c-poster-phone.webp");
    expect(html).toContain("horizon-c-poster-desktop.webp");
    expect(html).not.toContain("<canvas");
  });

  test("two sources per aspect: AV1 first, H.264 second", () => {
    const video = read("src/components/HorizonVideo.tsx");
    expect(video).toContain('PORTRAIT_QUERY = "(max-aspect-ratio: 1/1)"');
    expect(video).toContain('media="(max-aspect-ratio: 1/1)"');
    expect(video).toContain('const source = `/horizon-${variant}-${master}`');
    expect(video).toContain('codecs="av01.0.05M.08"');
    expect(video).toContain('codecs="avc1.640028"');
    expect(video).toContain('classList.add("is-swapping")');
    expect(video).toContain("video.load()");
    const videoTag = video.match(/<video[\s\S]*?<\/video>/)?.[0] ?? "";
    expect(videoTag.match(/<source\b/g) ?? []).toHaveLength(2);
    expect(videoTag).not.toContain("video.src");
  });

  test("three variants, two aspects, two codecs and six posters are real assets", () => {
    const files: string[] = [];
    for (const variant of ["a", "b", "c"]) {
      for (const aspect of ["desktop", "phone"]) {
        files.push(
          `horizon-${variant}-${aspect}-av1.mp4`,
          `horizon-${variant}-${aspect}.mp4`,
          `horizon-${variant}-poster-${aspect}.webp`,
        );
      }
    }
    expect(files).toHaveLength(18);
    for (const file of files) {
      const path = resolve(root, "public", file);
      expect(existsSync(path), file).toBe(true);
      expect(statSync(path).size, `${file} is empty`).toBeGreaterThan(1000);
      if (file.endsWith(".webp")) {
        expect(statSync(path).size, `${file} exceeds 120 KB`).toBeLessThan(120 * 1024);
      }
    }
  });

  test("no live shader runs and native scroll is never intercepted", () => {
    expect(read("src/App.tsx")).not.toContain("blackhole");
    for (const source of [css, instruments, descent, read("src/components/LedgerPage.tsx")]) {
      expect(source).not.toContain("preventDefault");
      expect(source).not.toMatch(/wheel|touchmove|scroll-snap-type/);
    }
  });
});

describe("reduced motion is a complete document", () => {
  test("reveals are hidden only when motion is explicitly on and allowed", () => {
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(css).toContain('html[data-motion="on"] [data-reveal]');
    expect(css).toContain('html[data-motion="on"] [data-reveal].is-in');
  });

  test("the ticker stops dead and the layer holds a still", () => {
    expect(instruments).toContain("html[data-motion=\"off\"] .ticker-track");
    expect(instruments).toContain("@media (prefers-reduced-motion: reduce)");
    expect(descent).toContain('data-static="true"');
    expect(html).toContain("data-static");
  });

  test("the HUD respects the safe area and the dynamic viewport", () => {
    expect(css).toContain("env(safe-area-inset-top)");
    expect(css).toContain("env(safe-area-inset-bottom)");
    expect(css).toContain("100dvh");
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
    expect(indexHtml).toContain("PlayfairDisplay-Variable.woff2");
    expect(indexHtml).not.toContain("Archivo-Variable");
    expect(read("public/fonts/OFL-Ledger.txt")).toContain("OPEN FONT LICENSE");
  });
});
