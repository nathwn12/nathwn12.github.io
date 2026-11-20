// @vitest-environment jsdom
/**
 * The event-horizon ledger's own floor: one navigation, five reachable
 * chapters, content truth from src/content, tokens as the only colour source,
 * one dark sky, three selectable hero renders, and a complete static document
 * when motion is off.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import LedgerPage from "../src/components/LedgerPage";
import { heroVariantFromSearch } from "../src/components/HorizonVideo";
import { figures, proofRows } from "../src/content/ledger";
import { CONTACT_EMAIL } from "../src/lib/contact";

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const html = renderToStaticMarkup(createElement(LedgerPage));
const css = read("src/styles/ledger.css");
const base = read("src/styles/base.css");
const fonts = read("src/styles/fonts.css");
const tokens = read("src/styles/tokens.css");
const indexHtml = read("index.html");

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

describe("tokens are the only colour source, and dark is the only sky", () => {
  test("no raw hex in the new component, stylesheet or base", () => {
    for (const source of [
      read("src/components/LedgerPage.tsx"),
      read("src/components/HorizonVideo.tsx"),
      css,
      base,
    ]) {
      expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
  });

  test("the paper sky is deleted, not adapted", () => {
    expect(tokens).toContain("color-scheme: dark");
    expect(tokens).not.toContain('[data-theme="light"]');
    expect(css).not.toContain('[data-theme="light"]');
    expect(css).not.toContain("horizon-plate");
    expect(indexHtml).toContain('data-theme="dark"');
    expect(indexHtml).not.toContain("prefers-color-scheme");
    expect(base).toContain('html[data-motion="off"]');
  });

  test("zero PAPER nodes ship", () => {
    expect(html).not.toMatch(/\bpaper\b|theme-toggle|void mode/i);
    expect(html).not.toContain("Switch to");
  });
});

describe("three hero renders, one picking lever", () => {
  test("only a, b and c are real; anything else is the default c", () => {
    expect(heroVariantFromSearch("?hero=a")).toBe("a");
    expect(heroVariantFromSearch("?hero=b")).toBe("b");
    expect(heroVariantFromSearch("?hero=c")).toBe("c");
    expect(heroVariantFromSearch("")).toBe("c");
    expect(heroVariantFromSearch("?hero=")).toBe("c");
    expect(heroVariantFromSearch("?hero=zzz")).toBe("c");
    expect(heroVariantFromSearch("?hero=A")).toBe("c");
    expect(heroVariantFromSearch("?hero=dark")).toBe("c");
  });

  test("A keeps its dither crisp; B and C stay smooth", () => {
    expect(css).toContain(".horizon-video--a {");
    expect(css).toContain("image-rendering: pixelated");
    expect(css.match(/image-rendering/g) ?? []).toHaveLength(1);
  });
});

describe("reduced motion is a complete document", () => {
  test("reveals are hidden only when motion is explicitly on and allowed", () => {
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(css).toContain('html[data-motion="on"] [data-reveal]');
    expect(css).toContain('html[data-motion="on"] [data-reveal].is-in');
  });

  test("the hero is a recorded loop and shows only its poster under reduced motion", () => {
    const video = read("src/components/HorizonVideo.tsx");
    expect(video).toContain("preload=\"metadata\"");
    expect(video).toContain("playsInline");
    expect(video).toContain("RATE = 0.7");
    expect(video).toContain('classList.add("is-still")');
    expect(video).toContain("IntersectionObserver");
    expect(video).toContain("visibilitychange");
    expect(html).toContain("horizon-c-poster-phone.webp");
    expect(html).toContain("horizon-c-poster-desktop.webp");
    expect(html).not.toContain("<canvas");
  });

  test("two sources per aspect: AV1 first, H.264 second, browser picks", () => {
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
    const av1 = videoTag.indexOf("-av1.mp4");
    const h264 = videoTag.indexOf("type={H264}");
    expect(av1).toBeGreaterThan(-1);
    expect(h264).toBeGreaterThan(av1);
    expect(videoTag).not.toContain("video.src");
    expect(videoTag).not.toContain("<canvas");
  });

  test("no runtime overlay sits over the baked-in grain and vignette", () => {
    expect(css).not.toContain(".horizon-fade");
    expect(css).not.toContain(".hero::after");
  });

  test("the HUD respects the safe area and the dynamic viewport", () => {
    expect(css).toContain("env(safe-area-inset-top)");
    expect(css).toContain("env(safe-area-inset-bottom)");
    expect(css).toContain("100dvh");
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

  test("no live shader runs in the shipped page", () => {
    const app = read("src/App.tsx");
    const page = read("src/components/LedgerPage.tsx");
    expect(page).not.toContain("HorizonCanvas");
    expect(page).not.toContain("BlackHoleRenderer");
    expect(app).not.toContain("blackhole");
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
    expect(indexHtml).toContain("PlayfairDisplay-Variable.woff2");
    expect(indexHtml).not.toContain("Archivo-Variable");
    expect(indexHtml).not.toContain("JetBrainsMono-Regular");
    expect(read("public/fonts/OFL-Ledger.txt")).toContain("OPEN FONT LICENSE");
  });
});
