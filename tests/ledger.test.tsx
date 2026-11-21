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
import { aiPractice, figures, proofRows, workBand } from "../src/content/ledger";
import { experience, spineDate } from "../src/content/experience";
import { projects } from "../src/content/projects";
import { signal, specLines } from "../src/content/signal";
import { featuredRows, indexRows, workShelfIntro } from "../src/content/showcase";
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
    expect(html.indexOf("skip-link")).toBeLessThan(html.indexOf("lab-nav"));
    const ids = [...html.matchAll(/<section id="([a-z]+)"/g)].map((match) => match[1]);
    expect(ids.slice(0, 6)).toEqual(["horizon", ...ORDER]);
    for (const id of ORDER) {
      expect(html).toContain(`aria-labelledby="${id}-title"`);
    }
  });

  test("the footer is a colophon, not a second nav", () => {
    expect(html).toContain("colophon");
  });

  test("the masthead uses the owned glyph once as a 12px imprint", () => {
    expect(html.match(/<img[^>]*brand\/signature-glyph\.svg/g) ?? []).toHaveLength(1);
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.lab-nav \.mark img\s*\{[^}]*height:\s*12px/);
    expect(css).toMatch(/\.lab-nav \.mark img\s*\{[^}]*opacity:\s*0\.6/);
  });

  test("the final labels are visible with stable ids", () => {
    for (const [id, label] of [
      ["signal", "Numbers"], ["work", "Open Source"], ["proof", "Work"],
      ["method", "Approach"], ["contact", "Contact"],
    ]) {
      expect(html).toContain(`id="${id}"`);
      expect(html).toContain(`>${label}</h2>`);
    }
  });

  test("one chapter is active in the single navigation", () => {
    expect(html.match(/aria-current="true"/g) ?? []).toHaveLength(1);
  });

  test("the frame widens for the native 2560 composition", () => {
    const tokens = read("src/styles/tokens.css");
    const css = read("src/styles/ledger.css");
    expect(tokens).toContain("--frame-native: 82rem");
    expect(css).toMatch(/@media \(min-width: 2200px\)[\s\S]*?--frame-native:\s*110rem/);
    expect(css).toContain("width: min(100% - (var(--gutter) * 2), var(--frame-native))");
  });

  test("nav B keeps the strip at 34px and hides the ticker on phone", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.lab-nav \{[^}]*height:\s*34px/);
    expect(css).toMatch(/@media \(max-width: 900px\)[\s\S]*?\.lab-nav \.nav-ticker\s*\{[^}]*display:\s*none/);
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.lab-nav \.links a\s*\{[^}]*font-size/);
    expect(css).toMatch(/\.lab-nav \.links a span\s*\{[^}]*display:\s*none/);
  });

  test("the readout lives in the nav, free of figures", () => {
    expect(html.match(/class="nav-ticker"/g) ?? []).toHaveLength(1);
    expect(html).not.toContain('class="ticker"');
    expect(signal.ticker.length).toBeLessThanOrEqual(2);
    for (const note of signal.ticker) {
      expect(note).not.toMatch(/\d/);
    }
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
    expect(html.match(/class="cell"/g) ?? []).toHaveLength(
      signal.packages.length,
    );
    expect(signal.packages.length).toBeGreaterThanOrEqual(9);
    expect(html).toContain(signal.allTime.toLocaleString("en-US"));
  });

  test("Numbers uses the approved variant A shell", () => {
    const signalSection = html.slice(
      html.indexOf('id="signal"'),
      html.indexOf('id="work"'),
    );
    expect(signalSection).toContain('class="v-body sa"');
    expect(signalSection).toContain('class="top"');
    expect(signalSection).toContain('class="strip"');
    expect(signalSection).toContain('class="lower"');
    expect(signalSection).toContain('class="stamp"');
  });

  test("the activity strip is thirty measured cells with a text alternative", () => {
    expect(html.match(/class="heat-cell"/g) ?? []).toHaveLength(30);
    expect(html).toContain("active days from");
  });

  test("the bake date is visible in micro-type", () => {
    expect(html).toContain(signal.stamp);
    expect(html).toContain(signal.snapshotDate);
  });

  test("the nav carries the readout text", () => {
    expect(html).toContain(signal.ticker.join(" · "));
  });

  test("three cards and eleven two-column list entries", () => {
    expect(featuredRows).toHaveLength(3);
    expect(indexRows).toHaveLength(11);
    expect(html.match(/class="card"/g) ?? []).toHaveLength(3);
    expect(html.match(/class="item"/g) ?? []).toHaveLength(11);
  });

  test("the shelf intro and card detail come from content", () => {
    for (const row of featuredRows) {
      expect(row.detail.length).toBeGreaterThan(60);
      expect(row.detail).not.toBe(row.claim);
    }
    expect(html).toContain(workShelfIntro);
    const intro = read("src/content/showcase.ts");
    expect(intro).toContain("export const workShelfIntro");
  });

  test("the cards keep lifetime downloads and language in the foot", () => {
    const work = html.slice(html.indexOf('id="work"'), html.indexOf('id="proof"'));
    for (const row of featuredRows) {
      expect(work).toContain(row.lifetime!.toLocaleString("en-US"));
      expect(work).toContain(row.language);
    }
    // The evidenced count is 35 in projects.ts, not the lead's suggested 40.
    const toolCount = projects
      .find((project) => project.dir === "hand")
      ?.stats.find((stat) => stat.label === "tools")?.value;
    expect(toolCount).toBeTruthy();
    expect(featuredRows[0]!.detail).toContain(toolCount!);
    expect(work).not.toContain("40 MCP tools");
  });

  test("the work section repeats no signal or proof figure", () => {
    const work = html.slice(html.indexOf('id="work"'), html.indexOf('id="proof"'));
    const repeats = [
      ...signal.packages.map((item) => item.month.toLocaleString("en-US")),
      signal.allTime.toLocaleString("en-US"),
      signal.month.toLocaleString("en-US"),
      figures.commits!,
      "/ 30d",
    ];
    for (const figure of repeats) {
      expect(work).not.toContain(figure);
    }
    expect(work).not.toContain("class=\"spark\"");
  });

  test("the shelf keeps every real repository link", () => {
    const work = html.slice(html.indexOf('id="work"'), html.indexOf('id="proof"'));
    expect(work).toContain("opencode-harness");
    expect(work).toContain("The public harness he drives every day.");
    expect(work.match(/target="_blank"/g) ?? []).toHaveLength(14);
  });

  test("the shelf uses hairline cards and list rules", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.wc \.cards \{[^}]*grid-template-columns:\s*repeat\(3, 1fr\)/);
    expect(css).toMatch(/\.wc \.item \{[^}]*border-block-end:\s*1px solid/);
    expect(read("DESIGN.md")).toContain("one exception");
  });

  test("the proof figures survive the spine composition", () => {
    expect(html).toContain("−98%");
    expect(html).not.toContain("−40%+");
    expect(html).toContain("−40%");
    expect(html).toContain("over 40%");
    expect(figures.commits).toBe("1,182");
    expect(html).toContain(figures.commits!);
  });

  test("the Work band and spine derive from the measured record", () => {
    const proof = html.slice(html.indexOf('id="proof"'), html.indexOf('id="method"'));
    expect(proof).toContain('class="band"');
    expect(proof).toContain('class="spine"');
    expect(proof.match(/class="node"/g) ?? []).toHaveLength(experience.length);
    for (const item of workBand) {
      expect(proof).toContain(item.figure);
      expect(proof).toContain(item.label);
    }
    expect(proof.match(/class="stampfig"/g) ?? []).toHaveLength(2);
    for (const entry of experience) {
      expect(proof).toContain(spineDate(entry.date));
      expect(proof).toContain(entry.name);
      expect(proof).toContain(entry.outcome);
      expect(proof).toContain(entry.texture.replace(/'/g, "&#x27;"));
    }
  });

  test("Approach is prose left, five ruled lines right, facts and data below", () => {
    const from = html.indexOf('id="method"');
    const to = html.indexOf('id="contact"');
    const method = html.slice(from, to);
    expect(method).toContain('class="prose"');
    expect(method.match(/<p>/g) ?? []).toHaveLength(aiPractice.sentences.length);
    for (const sentence of aiPractice.sentences) {
      expect(method).toContain(sentence);
    }
    expect(method).toContain(aiPractice.facts.join(" · "));
    expect(method.match(/class="sline"/g) ?? []).toHaveLength(specLines.length);
    expect(method).toContain('class="spec"');
    expect(method).toContain('class="dl"');
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

  test("the stats workflow calls a script that exists", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.scripts["check:refresh"]).toContain("vitest run");
    expect(read(".github/workflows/open-source-stats.yml")).toContain(
      "bun run check:refresh",
    );
  });

  test("the og card depicts the singularity from the law and the record", () => {
    const script = read("scripts/gen-og.mjs");
    expect(script).toContain("src/styles/tokens.css");
    expect(script).toContain("DESIGN.md");
    expect(script).toContain("src/content/ledger.ts");
    expect(script).toContain("horizon-poster-desktop.webp");
    expect(indexHtml).not.toContain("og-image-2026-11-21.png");
    expect(indexHtml).toMatch(/og-image-\d{4}-\d{2}-\d{2}-singularity\.png/);
  });
});

describe("the stripped floor", () => {
  test("index.html preloads the three shipped cuts and carries no theme law", () => {
    expect(indexHtml).not.toContain("data-theme");
    expect(indexHtml).not.toContain("theme-color");
    expect(indexHtml.match(/rel="preload"/g) ?? []).toHaveLength(3);
    expect(indexHtml).toContain('href="/fonts/libre-bodoni-latin-var.woff2"');
    expect(indexHtml).toContain('href="/fonts/newsreader-latin-var.woff2"');
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
    expect(existsSync(resolve(root, "src/components/HorizonVideo.tsx"))).toBe(true);
  });

  test("the hero plays an AV1-first recorded loop with a still fallback", () => {
    expect(html).toContain("<video");
    expect(html).toContain("/horizon-desktop.webm");
    expect(html).toContain("/horizon-desktop.mp4");
    expect(html).toContain("/horizon-phone.webm");
    expect(html).toContain('poster="/horizon-poster-desktop.webp"');
    const media = read("src/components/HorizonVideo.tsx");
    expect(html).not.toMatch(/<video[^>]*\bautoPlay\b/);
    expect(media).toContain("inactive?.pause()");
    expect(media).toContain('(max-aspect-ratio: 3/4)');
    expect(media).toContain("prefers-reduced-motion: reduce");
    expect(media).toContain("IntersectionObserver");
    expect(media).toContain("document.hidden");
    for (const asset of [
      "horizon-desktop.webm", "horizon-desktop.mp4", "horizon-phone.webm",
      "horizon-phone.mp4", "horizon-poster-desktop.webp", "horizon-poster-phone.webp",
    ]) {
      expect(existsSync(resolve(root, `public/${asset}`))).toBe(true);
    }
  });

  test("the hero has no runtime field loop", () => {
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
    expect(existsSync(resolve(root, "src/components/PointField.tsx"))).toBe(false);
    expect(existsSync(resolve(root, "src/content/field.ts"))).toBe(false);
  });
});
