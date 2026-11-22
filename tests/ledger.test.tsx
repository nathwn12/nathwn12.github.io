// @vitest-environment jsdom
/**
 * The ledger's surviving floor: one nav, four chapters in consequence order,
 * committed data, and a document with no committed design law.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import LedgerPage from "../src/components/LedgerPage";
import { aiPractice, consequenceHeadline, consequenceLede, contactBlock, displayName, figures, heroRoleLine, name, proofRows, spineStamp, statusLine, systemArea, teamSize, teamWord, workBand, workFacts } from "../src/content/ledger";
import { experience, formerRoleLine, spineDate, teamLine } from "../src/content/experience";
import { projects } from "../src/content/projects";
import { signal, specLines } from "../src/content/signal";
import { featuredRows, indexRows, metaOf, workShelfIntro } from "../src/content/showcase";
import probe from "../src/content/repos.probe.json";
import { CONTACT_EMAIL } from "../src/lib/contact";
import { publicRepoCount } from "../src/lib/repo-probe";
import { coldRead, coordinates } from "../src/content/coordinates";

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const html = renderToStaticMarkup(createElement(LedgerPage));
const indexHtml = read("index.html");
const ORDER = ["work", "oss", "method", "contact"];

describe("one nav, four chapters in consequence order", () => {
  test("the nav lists the four stages in consequence order", () => {
    expect(html.match(/<nav\b/g) ?? []).toHaveLength(2);
    const nav = html.match(/<nav class="links"[\s\S]*?<\/nav>/)?.[0] ?? "";
    const links = [...nav.matchAll(/href="#([a-z]+)"/g)].map((match) => match[1]);
    expect(links).toEqual(ORDER);
  });

  test("the sections render after the hero in the same order", () => {
    expect(html.match(/<main\b/g) ?? []).toHaveLength(1);
    expect(html.match(/<header\b/g) ?? []).toHaveLength(1);
    expect(html.indexOf("skip-link")).toBeLessThan(html.indexOf("lab-nav"));
    const ids = [...html.matchAll(/<section id="([a-z]+)"/g)].map((match) => match[1]);
    expect(ids.slice(0, 5)).toEqual(["horizon", ...ORDER]);
    for (const id of ORDER) {
      expect(html).toContain(`aria-labelledby="${id}-title"`);
    }
  });

  test("the scroll-spy marks the last chapter active at the page end", () => {
    const src = read("src/components/LedgerPage.tsx");
    expect(src).toMatch(/const atEnd = \(\) =>/);
    expect(src).toMatch(/window\.addEventListener\("scroll", onScroll/);
    expect(src).toMatch(/if \(atEnd\(\) && lastId\) setActive\(lastId\)/);
  });

  test("the footer is a colophon, not a second nav", () => {
    expect(html).toContain("colophon");
  });

  test("the banner ticker is decorative and the mark reserves its box", () => {
    expect(html).toMatch(/class="nav-ticker" aria-hidden="true"/);
    expect(html).toMatch(/<img[^>]*brand\/signature-glyph\.svg[^>]*width="300"[^>]*height="252"/);
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.wc \.a-name \{[^}]*text-wrap:\s*balance/);
    expect(css).toMatch(/\.wc \.intro \{[^}]*text-wrap:\s*pretty/);
  });

  test("the masthead uses the owned glyph once as a token-scaled imprint", () => {
    expect(html.match(/<img[^>]*brand\/signature-glyph\.svg/g) ?? []).toHaveLength(1);
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.lab-nav \.mark img\s*\{[^}]*height:\s*var\(--nav-mark\)/);
    expect(css).toMatch(/\.lab-nav \.mark img\s*\{[^}]*opacity:\s*0\.6/);
  });

  test("the final labels are visible with stable ids", () => {
    for (const [id, label] of [
      ["work", "Work"], ["oss", "Open Source"],
      ["method", "Approach"], ["contact", "Contact"],
    ]) {
      expect(html).toContain(`id="${id}"`);
      expect(html).toContain(`>${label}</h2>`);
    }
  });

  test("one chapter is active in each navigation", () => {
    expect(html.match(/aria-current="true"/g) ?? []).toHaveLength(2);
  });

  test("the field is fluid from phone to native", () => {
    const tokens = read("src/styles/tokens.css");
    const css = read("src/styles/ledger.css");
    expect(tokens).toMatch(/--gutter:\s*3vw/);
    expect(tokens).toMatch(/--index-rail:\s*5vw/);
    expect(tokens).not.toContain("--frame-native");
    expect(tokens).not.toContain("--frame:");
    expect(tokens).not.toContain("--field:");
    expect(css).toMatch(/\.field \{[^}]*width:\s*100%[^}]*padding-inline:\s*var\(--gutter\)/);
    expect(css).toMatch(/\.hero-hud \{[^}]*width:\s*100%[^}]*padding-inline-start:\s*calc\(var\(--gutter\) \+ var\(--index-rail\)\)/);
  });

  test("nav B scales from tokens and hides the ticker on phone", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.lab-nav \{[^}]*height:\s*var\(--nav-height\)/);
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

  test("Open Source carries the npm evidence in the approved shells", () => {
    const ossSection = html.slice(
      html.indexOf('id="oss"'),
      html.indexOf('id="method"'),
    );
    expect(ossSection).toContain('class="v-body wc sa"');
    expect(ossSection).toContain('class="top"');
    expect(ossSection).toContain('class="strip"');
    expect(ossSection).toContain('class="lower"');
    expect(ossSection).toContain('class="stamp"');
    // The evidence follows the intro and precedes the public activity row.
    expect(ossSection.indexOf('class="intro"')).toBeLessThan(
      ossSection.indexOf('class="top"'),
    );
    expect(ossSection.indexOf('class="ledger"')).toBeLessThan(
      ossSection.indexOf('class="lower"'),
    );
  });

  test("the heat strip wraps at narrow widths instead of widening the page", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.sa \.lower > div:not\(\.micros\) \{[^}]*min-width:\s*0/);
    expect(css).toMatch(/\.sa \.heat \.heatmap \{[^}]*flex-wrap:\s*wrap/);
  });

  test("the npm strip trades columns for cell width and breaks only at tokens", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.sa \.strip \{[^}]*grid-template-columns:\s*repeat\(auto-fit, minmax\(110px, 1fr\)\)/);
    expect(css).toMatch(/\.sa \.pname \{[^}]*overflow-wrap:\s*normal/);
    expect(css).toMatch(/\.sa \.pname \{[^}]*word-break:\s*normal/);
    expect(css).toMatch(/\.sa \.pname \{[^}]*hyphens:\s*none/);
    expect(css).not.toMatch(/\.sa \.pname \{[^}]*overflow-wrap:\s*anywhere/);
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

  test("the ledger has three tier-A rows and eleven tier-B rows", () => {
    expect(featuredRows).toHaveLength(3);
    expect(indexRows).toHaveLength(11);
    expect(html.match(/class="tier-a"/g) ?? []).toHaveLength(3);
    expect(html.match(/class="tier-b"/g) ?? []).toHaveLength(11);
    expect(html.match(/class="card"/g) ?? []).toHaveLength(0);
    expect(html.match(/class="item"/g) ?? []).toHaveLength(0);
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
    const work = html.slice(html.indexOf('id="oss"'), html.indexOf('id="method"'));
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

  test("Work carries the commit record; the npm evidence stays in Open Source", () => {
    const work = html.slice(html.indexOf('id="work"'), html.indexOf('id="oss"'));
    const evidence = [
      ...signal.packages.map((item) => item.month.toLocaleString("en-US")),
      signal.allTime.toLocaleString("en-US"),
      signal.month.toLocaleString("en-US"),
      "last 30 days",
    ];
    for (const figure of evidence) {
      expect(work).not.toContain(figure);
    }
    expect(work).not.toContain('class="spark"');
    expect(work).toContain(figures.commits!);

    const oss = html.slice(html.indexOf('id="oss"'), html.indexOf('id="method"'));
    for (const figure of evidence) {
      expect(oss).toContain(figure);
    }
  });

  test("the shelf keeps every real repository link", () => {
    const work = html.slice(html.indexOf('id="oss"'), html.indexOf('id="method"'));
    expect(work).toContain("opencode-harness");
    expect(work).toContain("The public harness I drive every day.");
    expect(work.match(/target="_blank"/g) ?? []).toHaveLength(14);
  });

  test("the shelf is one ruled ledger, never boxed cards", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.wc \.ledger \{[^}]*border-block-start:\s*1px solid/);
    expect(css).toMatch(/\.wc \.tier-a,\s*\.wc \.tier-b \{[^}]*border-block-end:\s*1px solid/);
    expect(css).not.toMatch(/\.wc \.tier-a \{[^}]*background:/);
    expect(css).not.toMatch(/\.wc \.tier-b \{[^}]*background:/);
    expect(css).toMatch(/\.wc \.tier-a \{[^}]*min-height:\s*48px/);
    expect(css).toMatch(/\.wc \.tier-b \{[^}]*min-height:\s*48px/);
    expect(css).toMatch(/\.wc \.tier-b \{[^}]*display:\s*block/);
    expect(css).toMatch(/\.wc \.tier-b a \{[^}]*display:\s*inline/);
    expect(css).toMatch(/@media \(min-width: 1100px\)[\s\S]*?\.wc \.tier-b \{[^}]*grid-template-columns:\s*5fr 3fr/);
    expect(css).toMatch(/\.wc \.b-meta \{[^}]*text-align:\s*right/);
    expect(read("DESIGN.md")).toContain("ruled data bands");
    expect(read("DESIGN.md")).not.toContain("one exception");
  });

  test("tier A is one whole-row link; tier B links only the name", () => {
    const work = html.slice(html.indexOf('id="oss"'), html.indexOf('id="method"'));
    const anchors = work.match(/<a class="tier-a"[^>]*>[\s\S]*?<\/a>/g) ?? [];
    for (const row of featuredRows) {
      const anchor = anchors.find((part) => part.includes(row.name)) ?? "";
      expect(anchor).toContain(row.claim);
      expect(anchor).toContain(row.detail);
      expect(anchor).toContain(row.tech[0]!);
      expect(anchor).toContain(row.language);
      expect(anchor.match(/<a /g) ?? []).toHaveLength(1);
    }
    for (const row of indexRows) {
      const lines = work.match(/<div class="tier-b">[\s\S]*?<\/div>/g) ?? [];
      const entry = lines.find((part) => part.includes(row.name)) ?? "";
      expect(entry).toContain(
        `<a href="${row.url}" target="_blank" rel="noreferrer">${row.name}</a>`,
      );
      expect(entry).toContain(` · ${row.claim}</span>`);
      const metas = [...entry.matchAll(/<span class="b-meta">([^<]*)<\/span>/g)].map(
        (match) => match[1],
      );
      expect(metas).toEqual([metaOf(row)]);
      expect(entry).not.toContain('class="b-life"');
      expect(entry).not.toContain('class="b-lang"');
    }
  });

  test("the built page has no placeholder-only cells", () => {
    const built = read("dist/index.html");
    const work = built.slice(built.indexOf('id="oss"'), built.indexOf('id="method"'));
    const text = work.replace(/<[^>]*>/g, " ").toLowerCase();
    for (const banned of ["no package", "n/a", "unknown"]) {
      expect(text).not.toContain(banned);
    }
    const placeholders = (built.match(/<(span|div|p)\b[^>]*>([^<]*)<\/\1>/g) ?? [])
      .map((cell) => cell.replace(/<[^>]*>/g, "").trim())
      .filter((inner) => ["—", "–", "-", "N/A", "unknown", "no package"].includes(inner));
    expect(placeholders).toEqual([]);
  });

  test("the proof figures survive the spine composition", () => {
    expect(html).toContain("−98%");
    expect(html).not.toContain("−40%+");
    expect(html).toContain("−40%");
    expect(html).toContain("over 40%");
    expect(figures.commits).toBe("1,182");
    expect(html).toContain(figures.commits!);
  });

  test("Work body fills the field and the dates leave the rail", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.pc \.spine \{[^}]*grid-column:\s*measure-start \/ field-end/);
    expect(css).toMatch(/\.pc \.node \{[^}]*grid-column:\s*measure-start \/ field-end/);
    expect(css).toMatch(/\.node-body \{[^}]*display:\s*contents/);
    expect(css).toMatch(/\.pc \.spine \{[^}]*padding-inline-start:\s*0/);
    expect(css).toMatch(/\.pc \.spine::before \{[^}]*inset-inline-start:\s*calc\(-1 \* var\(--space-16\)\)/);
    expect(css).toMatch(/\.pc \.date \{[^}]*font-size:\s*var\(--text-mono\)/);
    expect(css).toMatch(/\.pc \.tex \{[^}]*grid-column:\s*band-start \/ field-end/);
    expect(css).toMatch(/@media \(min-width: 1100px\)[\s\S]*?\.pc \.tex \{[^}]*grid-row:\s*1 \/ span 2/);
    expect(css).toMatch(/@media \(max-width: 1099px\)[\s\S]*?\.pc \.tex \{[^}]*grid-column:\s*1 \/ -1/);
  });

  test("Work dates move to the aside at 1100 and stack above below it", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.pc \.date,\s*\.pc \.stampfig \{[^}]*grid-column:\s*measure-start \/ aside-start/);
    expect(css).toMatch(/@media \(min-width: 1100px\)[\s\S]*?\.pc \.date,\s*\.pc \.stampfig \{[^}]*grid-column:\s*aside-start \/ band-start/);
    expect(css).not.toMatch(/\.pc \.date \{[^}]*position:\s*absolute/);
  });

  test("the Work band and spine derive from the measured record", () => {
    const work = html.slice(html.indexOf('id="work"'), html.indexOf('id="oss"'));
    expect(work).toContain('class="band"');
    expect(work).toContain('class="spine"');
    expect(work.match(/class="node"/g) ?? []).toHaveLength(experience.length);
    for (const item of workBand) {
      expect(work).toContain(item.figure);
      expect(work).toContain(item.label);
    }
    expect(work.match(/class="stampfig"/g) ?? []).toHaveLength(2);
    for (const entry of experience) {
      expect(work).toContain(spineDate(entry.date));
      expect(work).toContain(entry.name);
      expect(work).toContain(entry.outcome);
      expect(work).toContain(entry.texture.replace(/'/g, "&#x27;"));
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

  test("display statements balance and prose avoids lone-word orphans", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.ca \.line \{[^}]*text-wrap:\s*balance/);
    expect(css).toMatch(/\.ma \.prose p \{[^}]*text-wrap:\s*pretty/);
    const tokens = read("src/styles/tokens.css");
    expect(tokens).toMatch(/--measure-wide:\s*(6[0-9]|7[0-5])ch/);
  });

  test("Contact uses the approved variant A structure", () => {
    const contact = html.slice(html.indexOf('id="contact"'));
    expect(contact).toContain('class="line"');
    expect(contact).toContain('class="mail"');
    expect(contact).toContain(contactBlock.nextStep);
    expect(contact.match(new RegExp(contactBlock.nextStep, "g")) ?? []).toHaveLength(1);
    const colophon = html.slice(html.indexOf('class="colophon'));
    expect(colophon.match(/<a /g) ?? []).toHaveLength(6);
    expect(colophon).toContain('href="/llms.txt"');
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.ca \.line \{[^}]*max-width:\s*var\(--measure-contact\)/);
    expect(css).toMatch(/\.ca \.mail \{[^}]*border-block-end:\s*1px solid var\(--color-signal\)/);
    expect(css).toContain(".colophon-links");
  });

  test("all four chapters share one field, type scale and rhythm", () => {
    const css = read("src/styles/ledger.css");
    const tokens = read("src/styles/tokens.css");
    // One 12-track field inside every chapter, with subgrid children.
    expect(css).toMatch(/\.field \{[^}]*width:\s*100%[^}]*padding-inline:\s*var\(--gutter\)/);
    expect(css).toMatch(/\.chapter > \.field \{[^}]*display:\s*grid/);
    expect(css).toMatch(/\.ch-head,\s*\.v-body,\s*\.chapter-margin \{[^}]*grid-column:\s*field-start \/ field-end/);
    // One type scale: the same roles across all four variants.
    expect(css).toMatch(/\.ma \.prose p \{[^}]*font-size:\s*var\(--text-lede\)/);
    expect(css).toMatch(/\.wc \.intro \{[^}]*font-size:\s*var\(--text-lede\)/);
    expect(css).toMatch(/\.pc h3 \{[^}]*font-size:\s*var\(--text-lede\)/);
    expect(css).toMatch(/\.sa \.pval \{[^}]*font-size:\s*var\(--text-detail\)/);
    expect(css).toMatch(/\.wc \.tier-b \{[^}]*font-size:\s*var\(--text-mono\)/);
    expect(css).toMatch(/\.pc \.tex \{[^}]*font-size:\s*var\(--text-detail\)/);
    expect(css).toMatch(/\.sa \.flabel \{[^}]*font-size:\s*var\(--text-mono\)/);
    expect(css).toMatch(/\.sa \.flabel \{[^}]*text-align:\s*right/);
    expect(css).toMatch(/\.chapter-margin \{[^}]*font-size:\s*var\(--text-mono\)/);
    // The npm evidence figures and the Work band share one display token;
    // both are data bands spanning the same field.
    expect(css).toMatch(/\.sa \.figure \{[^}]*font-size:\s*var\(--text-figure\)/);
    expect(css).toMatch(/\.pc \.band b \{[^}]*font-size:\s*var\(--text-figure\)/);
    expect(css).toMatch(/\.pc \.band \{[^}]*justify-content:\s*space-between/);
    expect(css).toMatch(/\.pc \.tex \{[^}]*max-width:\s*var\(--measure-wide\)/);
    // Contact uses the chapter display scale, not a lab clamp.
    expect(css).toMatch(/\.ca \.line \{[^}]*font-size:\s*var\(--text-chapter\)/);
    // Geometry is fluid; the native steps tune only measure and type scale.
    expect(tokens).toMatch(/--gutter:\s*3vw/);
    expect(tokens).toMatch(/--text-variant-value:\s*clamp\(/);
    expect(css).toMatch(/@media \(min-width: 1600px\)[\s\S]*?--measure-wide:/);
    expect(css).toMatch(/@media \(min-width: 2200px\)[\s\S]*?--text-date-margin:/);
    // Below the measure the spec stacks on the measure line, not in the rail.
    expect(css).toMatch(/@media \(min-width: 701px\) and \(max-width: 1100px\)[\s\S]*?\.ma \.prose,[\s\S]*?grid-column:\s*measure-start \/ field-end/);
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
    expect(indexHtml).not.toContain("og-image-2026-11-21-singularity.png");
    expect(indexHtml).toContain("og-image-2026-11-22-singularity.png");
    expect(existsSync(resolve(root, "public/og-image-2026-11-22-singularity.png"))).toBe(true);
  });
});

describe("the 12-column field law", () => {
  test("every chapter and both strips share one centred field", () => {
    expect(html.match(/class="field"/g) ?? []).toHaveLength(7);
    expect(html).toMatch(/<header class="lab-nav" aria-label="Site"><div class="field">/);
    expect(html).toMatch(/<footer class="colophon">[\s\S]*?<div class="field">/);
    for (const id of ORDER) {
      const at = html.indexOf(`id="${id}"`);
      expect(html.slice(at, at + 900)).toContain('class="field"');
    }
  });

  test("the chapter field declares twelve tracks and four named lines", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.chapter > \.field \{[^}]*column-gap:\s*var\(--gutter\)/);
    expect(css).toMatch(/grid-template-columns:\s*\[field-start\]\s*calc\(var\(--index-rail\) - var\(--gutter\)\)\s*\[measure-start\]\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)\s*\[aside-start\]\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*\[band-start\]\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)\s*\[field-end\]/);
  });

  test("head, body and margin ride the same subgrid lines", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.ch-head,\s*\.v-body,\s*\.chapter-margin \{[^}]*display:\s*grid/);
    expect(css).toMatch(/\.ch-head,\s*\.v-body,\s*\.chapter-margin \{[^}]*grid-template-columns:\s*subgrid/);
    expect(css).toMatch(/\.ch-head > \* \{[^}]*grid-column:\s*measure-start \/ aside-start/);
    expect(css).toMatch(/\.v-body > \* \{[^}]*grid-column:\s*measure-start \/ field-end/);
  });

  test("the orphaned lab blocks are gone and the live islands remain", () => {
    const css = read("src/styles/ledger.css");
    for (const dead of [
      ".cluster {", ".cluster-corner {", ".section-index {",
      ".signal-pair {", ".signal-figure {", ".spark-bank {",
      ".signal-lower {", ".micro-figures {", ".featured-list {",
      ".featured-row {", ".work-intro {", ".proof-table {",
      ".proof-row {", ".experience-register {", ".practice-list {",
      ".spec-grid {", ".data-line {",
    ]) {
      expect(css).not.toContain(dead);
    }
    for (const live of [
      ".spark {", ".spark polyline {", ".spark.measure polyline {",
      ".heatmap {", ".heat-cell {", ".stamp {", ".claim,",
    ]) {
      expect(css).toContain(live);
    }
    expect(css).not.toContain("--spine-rail:");
  });
});

describe("the coordinate and margin lines", () => {
  const stamps = [
    ["work", "01", "Work", `${experience.length} ENGAGEMENTS`],
    ["oss", "02", "Open Source", `${probe.publicRepos} REPOS`],
    ["method", "03", "Approach", `${specLines.length} STEPS`],
    ["contact", "04", "Contact", "OPEN"],
  ] as const;

  test("each chapter carries one coordinate line with derived values", () => {
    for (const [id, num, label, value] of stamps) {
      const at = html.indexOf(`id="${id}"`);
      const next = html.indexOf('<section id="', at + 8);
      const section = html.slice(at, next === -1 ? undefined : next);
      expect(section.match(/class="ch-coordinate"/g) ?? []).toHaveLength(1);
      const head = section.slice(
        section.indexOf('<span class="ch-coordinate">'),
        section.indexOf("<h2"),
      );
      expect(head.replace(/<[^>]+>/g, "")).toBe(
        `${num} / ${label.toUpperCase()} / ${value} / ${coordinates[id].date}`,
      );
      expect(coordinates[id].value).toBe(value);
      expect(coordinates[id].date).toBe(
        id === "oss" ? probe.measuredAt : signal.snapshotDate,
      );
    }
    expect(html).not.toContain('class="ch-index"');
  });

  test("the Open Source coordinate is the account's public repo count", () => {
    expect(publicRepoCount(probe)).toBe(probe.publicRepos);
    expect(coordinates.oss.value).toBe(`${probe.publicRepos} REPOS`);
    expect(coordinates.oss.date).toBe(probe.measuredAt);
  });

  test("a missing probe field fails instead of rendering a guess", () => {
    expect(() => publicRepoCount({ measuredAt: probe.measuredAt, repos: probe.repos })).toThrow(
      /publicRepos is missing or invalid/,
    );
    expect(() => publicRepoCount({ ...probe, publicRepos: -1 })).toThrow(
      /publicRepos is missing or invalid/,
    );
  });

  test("the coordinate role is mono data, uppercase, with a signal NN", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.ch-coordinate \{[^}]*font-family:\s*var\(--font-data\)/);
    expect(css).toMatch(/\.ch-coordinate \{[^}]*font-size:\s*var\(--text-data\)/);
    expect(css).toMatch(/\.ch-coordinate \{[^}]*font-weight:\s*500/);
    expect(css).toMatch(/\.ch-coordinate \{[^}]*text-transform:\s*uppercase/);
    expect(css).toMatch(/\.ch-num \{[^}]*color:\s*var\(--color-ink-muted\)/);
    expect(css).toMatch(/\.ch-num\.is-active \{[^}]*color:\s*var\(--color-signal\)/);
    expect(html.match(/class="ch-num is-active"/g) ?? []).toHaveLength(1);
    expect(html.match(/class="coord-tail"/g) ?? []).toHaveLength(4);
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.coord-tail \{[^}]*display:\s*none/);
  });

  test("one margin note per chapter, with Approach intentionally bare", () => {
    expect(html.match(/class="chapter-margin"/g) ?? []).toHaveLength(3);
    for (const [id] of stamps) {
      const at = html.indexOf(`id="${id}"`);
      const next = html.indexOf('<section id="', at + 8);
      const section = html.slice(at, next === -1 ? undefined : next);
      expect(section.match(/class="chapter-margin"/g) ?? []).toHaveLength(
        id === "method" ? 0 : 1,
      );
      if (id !== "method") expect(section).toContain(coordinates[id].margin);
    }
    expect(coordinates.work.margin).toContain("Xentra");
    expect(coordinates.method.margin).toBe("");
    expect(read("DESIGN.md")).toContain("intentionally bare");
    expect(coordinates.contact.margin).toBe(contactBlock.nextStep);
  });

  test("the Open Source caveat names the committed snapshot cron", () => {
    expect(coordinates.oss.cron).toBe("0 6 * * 1");
    expect(html).toContain('<span class="cron-value">0 6 * * 1</span>');
    expect(read(".github/workflows/open-source-stats.yml")).toMatch(
      /cron:\s*'0 6 \* \* 1'/,
    );
  });

  test("the margin sits beside the head and folds below at 1100", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.chapter-margin \{[^}]*grid-column:\s*aside-start \/ band-start/);
    expect(css).toMatch(/\.chapter-margin \{[^}]*grid-row:\s*1/);
    expect(css).toMatch(/\.chapter-margin \{[^}]*max-width:\s*22ch/);
    expect(css).toMatch(/@media \(max-width: 1100px\)[\s\S]*?\.chapter-margin \{[^}]*grid-column:\s*measure-start \/ field-end/);
    expect(css).toMatch(/@media \(min-width: 1101px\)[\s\S]*?\.chapter-margin \{[^}]*padding-block-start:\s*var\(--space-64\)/);
    expect(css).toMatch(/@media \(max-width: 1100px\)[\s\S]*?\.chapter-margin \{[^}]*padding-block-start:\s*0/);
    expect(css).toMatch(/@media \(max-width: 1100px\)[\s\S]*?\.chapter-margin \{[^}]*display:\s*block[^}]*max-width:\s*none/);
    expect(css).toMatch(/\.chapter-margin \{[^}]*display:\s*block[^}]*grid-column:\s*measure-start \/ field-end[^}]*max-width:\s*none/);
  });
});

describe("the corrected record", () => {
  test("derived data uses the committed casing", () => {
    expect(signal.stamp).toContain("GitHub annual");
    expect(signal.stamp).not.toContain("github annual");
    expect(workBand[1].label).toBe("high or critical Snyk findings");
    expect(html).toContain(signal.stamp);
    expect(html).toContain("high or critical Snyk findings");
  });

  test("Open Source speaks in the first person and names its rows", () => {
    expect(workShelfIntro).toContain("each in its own words");
    expect(workShelfIntro).not.toContain("one line each");
    expect(workShelfIntro).not.toContain("case notes");
    expect(html).toContain(workShelfIntro);
    expect(html).not.toContain("his own harness");
    expect(html).toContain("my own harness");
    expect(html).toContain("The public harness I drive every day.");
  });

  test("the Work dates and prose use typographic punctuation", () => {
    expect(spineDate("June 2024 – May 2026")).toBe("JUN 2024 – MAY 2026");
    expect(html).toContain("JUN 2024 – MAY 2026");
    expect(html).not.toContain("JUN 2024 — MAY 2026");
    expect(html).toContain("team’s review workflow");
    expect(html).not.toContain("team's review workflow");
  });

  test("the redirect stubs point at live chapters", () => {
    const stubs = read("scripts/prerender-routes.mjs");
    expect(stubs).not.toContain("#record");
    for (const target of ["/#work", "/#oss", "/#method", "/#contact"]) {
      expect(stubs).toContain(`"${target}"`);
    }
    expect(stubs).toContain("chapter 01.");
    expect(stubs).toContain("chapter 04.");
  });
});

describe("the data layer", () => {
  test("mono data reads one 12px token and one tracking value", () => {
    const tokens = read("src/styles/tokens.css");
    const css = read("src/styles/ledger.css");
    expect(tokens).toMatch(/--text-mono:\s*0\.75rem/);
    expect(tokens).not.toContain("--text-mono-label");
    expect(css).not.toMatch(/letter-spacing:\s*0(?:\.\d+)?em/);
    expect(css.match(/letter-spacing:\s*var\(--tracking-data\)/g)?.length).toBeGreaterThan(10);
    expect(css).toMatch(/\.sa \.flabel \{[^}]*width:\s*max-content/);
    expect(css).toMatch(/\.chapter-margin \{[^}]*line-height:\s*1\.45/);
    expect(css).toMatch(/\.eyebrow \{[^}]*margin-block-end:\s*clamp\(16px, 1\.2vw, 32px\)/);
    expect(css).toMatch(/\.zero-seal \.seal-stamp \{[^}]*line-height:\s*1/);
    // Mono tracking belongs to labels, not the display figures inside a micro.
    expect(css).toMatch(/\.sa \.micro span:not\(\.count-up\) \{[^}]*font-family:\s*var\(--font-data\)/);
  });

  test("the Work headline is a larger step than the chapter title", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.pc \.consequence \{[^}]*font-size:\s*clamp\(3\.25rem, 4\.4vw, 5rem\)/);
    expect(css).toMatch(/@media \(max-width: 430px\)[\s\S]*?\.pc \.consequence \{[^}]*font-size:\s*2\.5rem/);
    expect(html).toContain(`<p class="consequence">${consequenceHeadline}</p>`);
  });
});

describe("the Work consequence", () => {
  test("the headline is parsed from the newest outcome, not retyped", () => {
    expect(experience[0]!.outcome).toContain(
      "from about 60 seconds to under one second",
    );
    expect(consequenceHeadline).toBe("60 seconds → under 1 second");
  });

  test("the chapter opens with the outcome, then the lede, then the band", () => {
    const work = html.slice(html.indexOf('id="work"'), html.indexOf('id="oss"'));
    expect(work).toContain(`<p class="consequence">${consequenceHeadline}</p>`);
    expect(work).toContain(`<p class="consequence-lede">${consequenceLede}</p>`);
    expect(work.indexOf('class="consequence"')).toBeLessThan(
      work.indexOf('class="consequence-lede"'),
    );
    expect(work.indexOf('class="consequence-lede"')).toBeLessThan(
      work.indexOf('class="band"'),
    );
    for (const part of [
      formerRoleLine,
      "payments, cash management, and access control",
      `a team of ${teamWord(teamLine)}`,
      "C#/.NET", "EF Core", "Dapper", "Redis",
    ]) {
      expect(consequenceLede).toContain(part);
    }
    expect(teamLine).toContain(`Team of ${teamWord(teamLine)}`);
    expect(consequenceLede.endsWith(".")).toBe(true);
    // The facts row follows the Approach pattern, with all three values read
    // from committed strings — none of them typed into the component.
    expect(workFacts).toEqual([
      `team ${teamSize(teamLine)}`,
      "tenure 3 yrs 2 mos",
      "systems 3",
    ]);
    expect(work).toContain(`<div class="facts">${workFacts.join(" · ")}</div>`);
    expect(work.indexOf('class="spine"')).toBeLessThan(
      work.indexOf('class="facts"'),
    );
    // The internship keeps its text and date but no longer stands as a peer row.
    expect(work.match(/<div class="node" data-closing="true">/g) ?? []).toHaveLength(1);
    expect(work).toContain("MAR 2023 – JUN 2023");
    expect(work).toContain("Scoped ASP.NET Core and MySQL fixes");
    expect(read("src/styles/ledger.css")).toMatch(/\.pc \.node\[data-closing\]/);
  });

  test("the stated team size equals the sum of the role breakdown", () => {
    const counts = [...teamLine.matchAll(/(\d+)\s+[A-Za-z]+/g)].map((match) =>
      Number(match[1]),
    );
    const sum = counts.reduce((total, count) => total + count, 0);
    expect(Number(teamSize(teamLine))).toBe(sum);
  });

  test("the hero role names the work and keeps the status line", () => {
    expect(systemArea).toBe("payment and cash-management services");
    expect(heroRoleLine).toBe(
      "Backend developer · payment and cash-management services",
    );
    expect(html).toContain(`<p>${heroRoleLine}</p>`);
    expect(html).not.toContain("Backend systems, then the tools around them.");
    expect(html).toContain(statusLine);
  });
});

describe("the one-line coordinate", () => {
  test("the tablet measure gives the coordinate the full field", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/@media \(min-width: 701px\) and \(max-width: 1100px\)[\s\S]*?\.ch-coordinate \{[^}]*grid-column:\s*measure-start \/ field-end/);
  });
});

describe("the Work zero seal", () => {
  test("the band is flush to the field right, with the seal at its end", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.pc \.band \{[^}]*grid-column:\s*band-start \/ field-end/);
    const work = html.slice(html.indexOf('id="work"'), html.indexOf('id="oss"'));
    expect(work).toContain(workBand[0].figure!);
    expect(work).toContain('class="zero-seal"');
    expect(work.indexOf(workBand[0].figure!)).toBeLessThan(
      work.indexOf('class="zero-seal"'),
    );
  });

  test("the zero is the only hollow figure, with its stamp as real text", () => {
    const css = read("src/styles/ledger.css");
    const work = html.slice(html.indexOf('id="work"'), html.indexOf('id="oss"'));
    expect(work).toContain('class="seal-zero"');
    expect(work).toContain('class="seal-stamp"');
    expect(work).toContain(spineStamp("03")!);
    expect(css).toMatch(/\.seal-zero \{[^}]*font-family:\s*var\(--font-data\)/);
    expect(css).toMatch(/\.seal-zero \{[^}]*font-size:\s*var\(--text-figure\)/);
    expect(css).toMatch(/\.seal-zero \{[^}]*color:\s*var\(--color-ink-muted\)/);
    expect(css).toMatch(/\.seal-zero \{[^}]*-webkit-text-stroke:\s*1px var\(--color-ink-muted\)/);
    expect(css).toMatch(/@supports \([-a-z]*-webkit-text-stroke/);
    expect(css.match(/-webkit-text-stroke/g) ?? []).toHaveLength(2);
    expect(css).toMatch(/\.seal-stamp \{[^}]*font-size:\s*var\(--text-mono\)/);
    expect(css).toMatch(/\.pc \.band > div > span \{/);
    expect(css).not.toMatch(/\.pc \.band span \{[^}]*font-size/);
  });
});

describe("chapter placement on the field", () => {
  test("Open Source stacks the monthly figure in the band; the strip is full", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.sa \.top \{[^}]*grid-column:\s*band-start \/ field-end/);
    expect(css).toMatch(/\.sa \.top \{[^}]*flex-direction:\s*column/);
    expect(css).toMatch(/\.sa \.figure \{[^}]*text-align:\s*right/);
    expect(css).toMatch(/\.sa \.strip \{[^}]*grid-column:\s*measure-start \/ field-end/);
    const ossSection = html.slice(
      html.indexOf('id="oss"'),
      html.indexOf('id="method"'),
    );
    // Both npm figures stay in-band; the coordinate now counts repositories.
    expect(ossSection.match(/class="count-up figure"/g) ?? []).toHaveLength(2);
    expect(ossSection.indexOf('class="top"')).toBeLessThan(
      ossSection.indexOf('class="strip"'),
    );
  });

  test("Approach puts prose at measure, spec flush right, facts full", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.ma \.prose \{[^}]*grid-column:\s*measure-start \/ aside-start/);
    expect(css).toMatch(/\.ma \.spec \{[^}]*grid-column:\s*aside-start \/ field-end/);
    expect(css).toMatch(/\.ma \.facts \{[^}]*grid-column:\s*measure-start \/ field-end/);
    expect(css).toMatch(/\.ma \.dl \{[^}]*grid-column:\s*measure-start \/ field-end/);
    const method = html.slice(html.indexOf('id="method"'), html.indexOf('id="contact"'));
    const body = method.slice(method.indexOf('<div class="v-body ma">'));
    expect(body.indexOf('class="prose"')).toBeLessThan(body.indexOf('class="facts"'));
    expect(body).toMatch(/<\/div><div class="facts">/);
  });

  test("Contact asks and mails at measure; the aside carries the next step", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.ca \.line \{[^}]*grid-column:\s*measure-start \/ aside-start/);
    expect(css).toMatch(/\.ca \.mail \{[^}]*grid-column:\s*measure-start \/ aside-start/);
    const contact = html.slice(html.indexOf('id="contact"'));
    expect(contact).not.toContain('class="next"');
    expect(contact).toMatch(/<p class="chapter-margin">The address opens a message in your mail app\.<\/p>/);
  });

  test("the narrow field keeps both bands inside the field", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.sa \.top \{[^}]*grid-column:\s*measure-start \/ field-end/);
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.pc \.band \{[^}]*grid-column:\s*measure-start \/ field-end/);
    expect(css).toContain(".ch-head > *,");
    expect(css).toMatch(/\.ca \.line,[\s\S]*?grid-column:\s*measure-start \/ field-end/);
    expect(css).toMatch(/\.chapter-margin \{[^}]*max-width:\s*none/);
  });
});

describe("one-time motion", () => {
  test("the cold read is armed after mount and reveals once", () => {
    const src = read("src/components/LedgerPage.tsx");
    expect(src).toContain('classList.add("is-armed")');
    expect(src).toContain('classList.add("is-shown")');
    expect(src).toContain("observer.disconnect()");
    expect(src).toContain("prefers-reduced-motion: reduce");
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.cold-read\.is-armed p \{[^}]*opacity:\s*0/);
    expect(css).toMatch(/translateY\(8px\)/);
    expect(css).toMatch(/\.cold-read\.is-armed\.is-shown p \{[^}]*transition:/);
    expect(css).toMatch(/\.ch-coordinate \{[^}]*transition:\s*opacity var\(--motion-quick\)/);
    expect(css).not.toMatch(/\.ch-coordinate \{[^}]*opacity:\s*0\.6/);
    expect(css).toMatch(/\.chapter\.is-active \.ch-coordinate \{[^}]*opacity:\s*1/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.cold-read p,[\s\S]*?transition:\s*none/);
    // The prerendered DOM bakes `is-armed`; with scripting off the noscript
    // override keeps the About beat in the static document.
    expect(indexHtml).toContain(".cold-read.is-armed p{opacity:1!important;transform:none!important}");
  });
});

describe("the space law", () => {
  test("DESIGN.md declares one scale and the proximity rules", () => {
    const design = read("DESIGN.md");
    expect(design).toContain("### Space law");
    expect(design).toMatch(/4 \/ 8 \/ 12 \/ 16 \/ 24 \/ 32 \/ 48 \/ 64 \/ 96/);
    expect(design).toContain("No gap above 96px inside a chapter");
  });

  test("chapter and group spacing comes from tokens", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.ch-head \{[^}]*padding-block:\s*var\(--space-64\) var\(--space-16\)/);
    expect(css).toMatch(/\.v-body \{[^}]*padding-block:\s*var\(--space-32\) var\(--space-48\)/);
    expect(css).toMatch(/\.wc \.tier-a \{[^}]*min-height:\s*48px[^}]*padding-block:\s*var\(--space-12\)/);
    expect(css).toMatch(/\.pc \.node \+ \.node \{[^}]*margin-block-start:\s*var\(--space-24\)/);
    expect(css).toMatch(/\.ca \.mail \{[^}]*margin-block-start:\s*var\(--space-24\)/);
  });
});

describe("the quadrant pass", () => {
  test("Work's head holds the outcome and the figure pair", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.pc \.ch-head > \.band \{[^}]*grid-column:\s*band-start \/ field-end/);
    expect(css).toMatch(/\.pc \.ch-head > \.band \{[^}]*grid-row:\s*3 \/ span 2/);
    const work = html.slice(html.indexOf('id="work"'), html.indexOf('class="v-body pc"'));
    expect(work).toContain('class="consequence"');
    expect(work).toContain('class="band"');
  });

  test("Open Source sets the two figures on one row at measure", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.sa \.top \{[^}]*grid-column:\s*aside-start \/ field-end[^}]*flex-direction:\s*row/);
    expect(css).toMatch(/\.sa \.figure,\s*\.sa \.flabel \{[^}]*text-align:\s*left/);
  });

  test("Approach spreads its three facts on one baseline", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.dl \{[^}]*justify-content:\s*space-between/);
    expect(css).toMatch(/\.ma \.v-body \{[^}]*padding-block-end:\s*var\(--space-48\)/);
  });

  test("the phone band stacks and the dock is opaque", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/nav\.spine \{[^}]*background-color:\s*var\(--color-ground\)/);
    expect(css).toMatch(/nav\.spine \{[^}]*border-block-start:\s*1px solid var\(--color-rule-strong\)/);
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.pc \.band \{[^}]*flex-direction:\s*column/);
    expect(css).toMatch(/\.pc \.zero-seal \.seal-label \{[^}]*text-align:\s*left/);
  });
});

describe("the clear masthead and readable notes", () => {
  test("the hero pays for the masthead without losing the fold", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.beat-one \{[^}]*min-height:\s*calc\(100vh - var\(--nav-height\)\)[^}]*padding-block-start:\s*var\(--nav-height\)/);
    expect(css).toMatch(/\.beat-one \.hero-hud \{[^}]*min-height:\s*calc\(100vh - var\(--nav-height\) - var\(--nav-height\)\)/);
  });

  test("notes read as blocks and can reach past the aside", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.chapter-margin \{[^}]*display:\s*block/);
    expect(css).toMatch(/@media \(min-width: 1101px\)[\s\S]*?#oss \.chapter-margin,\s*#contact \.chapter-margin \{[^}]*width:\s*46ch/);
    expect(css).not.toMatch(/#oss \.chapter-margin,\s*#contact \.chapter-margin \{[^}]*width:\s*\d+px/);
  });
});

describe("the restored nav and band pair", () => {
  test("the masthead sits on the content axis with a word gap", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.lab-nav \.field \{[^}]*padding-inline-start:\s*calc\(var\(--gutter\) \+ var\(--index-rail\)\)/);
    expect(css).toMatch(/@media \(min-width: 701px\)[\s\S]*?\.lab-nav \.links a \{\s*gap:\s*0\.4em/);
    expect(css).toMatch(/\.lab-nav \.links a \{[^}]*min-height:\s*44px/);
  });

  test("the figure and seal are a pair at the field right", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/@media \(min-width: 1100px\) and \(max-width: 1600px\)[\s\S]*?\.pc \.band \{[^}]*grid-column:\s*band-start \/ field-end/);
    expect(css).toMatch(/@media \(min-width: 1100px\) and \(max-width: 1600px\)[\s\S]*?\.pc \.band b \{[^}]*font-size:\s*clamp\(2rem, calc\(13\.2vw - 114px\), 7rem\)/);
  });

  test("the tablet caption stays with the figure, not the band", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/@media \(max-width: 1099px\)[\s\S]*?\.pc \.band > div \{\s*display:\s*block/);
    expect(css).toMatch(/@media \(max-width: 1099px\)[\s\S]*?\.pc \.band > div > span \{[^}]*white-space:\s*normal/);
  });
});

describe("the breathing band", () => {
  test("the desktop band gives the seal room inside the field", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/@media \(min-width: 1100px\) and \(max-width: 1600px\)[\s\S]*?\.pc \.zero-seal \{[^}]*min-width:\s*150px/);
  });

  test("the caption keeps the recovered form only on the native canvas", () => {
    const css = read("src/styles/ledger.css");
    expect(workBand[0].label).toContain("commits · ");
    expect(workBand[0].labelLong).toContain("commits recovered · ");
    expect(html).toContain(`class="band-caption">${workBand[0].label}</span>`);
    expect(html).toContain(`class="band-caption-long">${workBand[0].labelLong}</span>`);
    expect(css).toMatch(/\.pc \.band-caption-long \{\s*display:\s*none/);
    expect(css).toMatch(/@media \(min-width: 2200px\)[\s\S]*?\.pc \.band-caption-long \{\s*display:\s*inline/);
  });

  test("the Work margin note is the short range by default", () => {
    expect(coordinates.work.margin).toBe("Xentra · 2023 – 2026");
    expect(coordinates.work.marginLong).toBe("Xentra · MAR 2023 – MAY 2026");
    expect(html).toContain('class="margin-short">Xentra · 2023 – 2026');
    expect(html).toContain('class="margin-long">Xentra · MAR 2023 – MAY 2026');
    expect(read("src/styles/ledger.css")).toMatch(/#work \.chapter-margin \{[^}]*display:\s*block[^}]*max-width:\s*34ch/);
  });

  test("the phone dock has an end-of-document reserve", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.colophon \{[^}]*padding-block-end:\s*calc\(44px \+ env\(safe-area-inset-bottom\) \+ 5vh \+ var\(--space-16\)\)/);
  });
});

describe("the held navigation", () => {
  test("the masthead sticks above the chapters and anchors clear it", () => {
    const css = read("src/styles/ledger.css");
    const tokens = read("src/styles/tokens.css");
    expect(css).toMatch(/\.lab-nav \{[^}]*position:\s*sticky/);
    expect(css).toMatch(/\.lab-nav \{[^}]*z-index:\s*20/);
    expect(css).toMatch(/\.lab-nav \{[^}]*background-color:\s*var\(--color-ground\)/);
    expect(css).toMatch(/\.chapter \{[^}]*scroll-margin-block-start:\s*calc\(var\(--nav-height\) \+ var\(--space-4\)\)/);
    expect(tokens).toMatch(/--nav-height:\s*2\.75rem/);
  });

  test("both navigations hold 44px targets and the dock names its chapter", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.lab-nav \.links a \{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/nav\.spine a \{[^}]*min-width:\s*44px/);
    expect(css).toMatch(/padding-block-end:\s*env\(safe-area-inset-bottom\)/);
    expect(css).toMatch(/aria-current="true"\] span \{[^}]*text-decoration:\s*underline/);
    expect(css).toMatch(/@media \(max-width: 359px\)[\s\S]*?\.lab-nav \.links a \{[^}]*font-size:\s*0\.625rem/);
    const spine = html.match(/<nav class="spine"[\s\S]*?<\/nav>/)?.[0] ?? "";
    for (const [id, num, label] of [
      ["work", "01", "Work"], ["oss", "02", "Open Source"],
      ["method", "03", "Approach"], ["contact", "04", "Contact"],
    ]) {
      expect(spine).toContain(`href="#${id}"`);
      expect(spine).toContain(`aria-label="${num} — ${label}"`);
    }
  });
});

describe("the phone spine", () => {
  test("one fixed spine carries 01-04 with a single active item", () => {
    expect(html.match(/<nav class="spine" aria-label="Chapters, phone">/g) ?? []).toHaveLength(1);
    const spine = html.match(/<nav class="spine"[\s\S]*?<\/nav>/)?.[0] ?? "";
    expect(spine.match(/href="#[a-z]+"/g) ?? []).toHaveLength(4);
    expect(spine.match(/aria-current="true"/g) ?? []).toHaveLength(1);
    for (const [id, num] of [
      ["work", "01"], ["oss", "02"],
      ["method", "03"], ["contact", "04"],
    ]) {
      expect(spine).toContain(`href="#${id}"`);
      expect(spine).toContain(`<span>${num}</span>`);
    }
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/nav\.spine \{[^}]*display:\s*none/);
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?nav\.spine \{[^}]*position:\s*fixed/);
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?nav\.spine \{[^}]*flex-direction:\s*row/);
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?nav\.spine \{[^}]*left:\s*0/);
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?nav\.spine \{[^}]*right:\s*0/);
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?nav\.spine \{[^}]*bottom:\s*0/);
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?nav\.spine \{[^}]*justify-content:\s*center/);
    expect(css).not.toMatch(/nav\.spine \{[^}]*translateX\(-50%\)/);
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?nav\.spine \{[^}]*top:\s*auto/);
    expect(css).toMatch(/nav\.spine a \{[^}]*width:\s*44px/);
    expect(css).toMatch(/nav\.spine a \{[^}]*height:\s*44px/);
    expect(css).toMatch(/\.spine a \{[^}]*transition:\s*color var\(--motion-quick\)/);
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?--index-rail:\s*12vw/);
    expect(css).toMatch(/\.hero-hud \{[^}]*padding-inline-start:\s*calc\(var\(--gutter\) \+ var\(--index-rail\)\)/);
    expect(css).toMatch(/\.lab-nav \.links a span\s*\{[^}]*display:\s*none/);
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

  test("the hero is still-first and the video is opt-in", () => {
    expect(html.match(/class="horizon-media horizon-still/g) ?? []).toHaveLength(2);
    expect(html).toContain('src="/horizon-poster-desktop.webp"');
    expect(html).toContain('src="/horizon-poster-phone.webp"');
    expect(html.match(/loading="eager"/g) ?? []).toHaveLength(2);
    // React hoists two matching image preloads, so two stills emit four marks.
    expect(html.match(/fetchPriority="high"/g) ?? []).toHaveLength(4);
    expect(html.match(/<img[^>]*fetchPriority="high"/g) ?? []).toHaveLength(2);
    expect(html).toContain("<video");
    expect(html).toContain("/horizon-desktop.webm");
    expect(html).toContain("/horizon-desktop.mp4");
    expect(html).toContain("/horizon-phone.webm");
    expect(html.match(/preload="none"/g) ?? []).toHaveLength(2);
    expect(html).not.toMatch(/<video[^>]*\bposter=/);
    const media = read("src/components/HorizonVideo.tsx");
    expect(html).not.toMatch(/<video[^>]*\bautoPlay\b/);
    expect(media).toContain("inactive?.pause()");
    for (const token of [
      "(pointer: fine)", "(min-width: 1100px)",
      "(prefers-reduced-motion: no-preference)", "saveData",
      "IntersectionObserver", "document.hidden",
    ]) {
      expect(media).toContain(token);
    }
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.horizon-still \{[^}]*display:\s*block/);
    // At 1440 the phone still must stay hidden: its display:none rule has to
    // come after the still rule, since the phone <img> carries both classes.
    expect(css.indexOf(".horizon-still {")).toBeLessThan(
      css.indexOf(".horizon-phone {"),
    );
    expect(css).toMatch(/video\.horizon-media \{[^}]*opacity:\s*0/);
    expect(css).toMatch(/video\.horizon-media\.is-playing \{[^}]*opacity:\s*1/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?video\.horizon-media \{[^}]*display:\s*none/);
    for (const asset of [
      "horizon-desktop.webm", "horizon-desktop.mp4", "horizon-phone.webm",
      "horizon-phone.mp4", "horizon-poster-desktop.webp", "horizon-poster-phone.webp",
    ]) {
      expect(existsSync(resolve(root, `public/${asset}`))).toBe(true);
    }
  });

  test("the hero has two beats and one stacked name block", () => {
    expect(html).toContain('class="beat beat-one"');
    expect(html).toContain('class="beat beat-cold"');
    for (const line of coldRead) expect(html).toContain(line);
    expect(html.match(/class="name-line"/g) ?? []).toHaveLength(2);
    expect(html).toContain('<span class="name-line">Nathaniel</span>');
    expect(html).toContain('<span class="name-line">Ladero</span>');
    expect(html).not.toContain('class="name-first"');
    expect(html).not.toContain('class="name-last"');
    expect(html).not.toContain("Nathaniel Nikolai</span>");
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.hero-hud \{[^}]*padding-inline-start:\s*calc\(var\(--gutter\) \+ var\(--index-rail\)\)/);
    expect(css).toMatch(/\.hud-role > p \{[^}]*margin-inline-start:\s*auto/);
    expect(css).toMatch(/#hero-name \.name-line \{[^}]*display:\s*block/);
    expect(css).not.toMatch(/\.name-last/);
    expect(css).not.toMatch(/left:\s*53%/);
  });

  test("only the hero display shortens; the legal name stays everywhere else", () => {
    expect(name).toBe("Nathaniel Nikolai Ladero");
    expect(displayName).toBe("Nathaniel Ladero");
    expect(indexHtml).toContain("<title>Nathaniel Nikolai Ladero — event horizon</title>");
    for (const meta of [
      'property="og:title" content="Nathaniel Nikolai Ladero',
      'name="twitter:title" content="Nathaniel Nikolai Ladero',
      'property="og:image:alt" content="Deep Field Ledger card for Nathaniel Nikolai Ladero',
      'name="twitter:image:alt" content="Deep Field Ledger card for Nathaniel Nikolai Ladero',
    ]) {
      expect(indexHtml).toContain(meta);
    }
    const ld = JSON.parse(indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? "{}");
    expect(ld.name).toBe("Nathaniel Nikolai Ladero");
    expect(ld.email).toMatch(/^mailto:/);
    expect(html).toContain(`mailto:${CONTACT_EMAIL}`);
    const src = read("src/components/LedgerPage.tsx");
    expect(src).toMatch(/document\.title =\s*`\$\{name\}/);
  });

  test("only the witness rotates; there is no runtime field loop", () => {
    const sources = [
      "src/components/LedgerPage.tsx",
      "src/components/Instruments.tsx",
      "src/styles/base.css",
      "src/styles/ledger.css",
      "src/styles/tokens.css",
    ];
    const css = read("src/styles/ledger.css");
    expect(css.match(/@keyframes/g) ?? []).toHaveLength(2);
    expect(css.replace(/@keyframes witness-(spin|spin-reverse)/g, "")).not.toMatch(/@keyframes/);
    for (const source of sources) {
      const text = read(source);
      expect(text).not.toMatch(/data-reveal|data-motion|requestAnimationFrame/);
    }
    expect(existsSync(resolve(root, "src/components/PointField.tsx"))).toBe(false);
    expect(existsSync(resolve(root, "src/content/field.ts"))).toBe(false);
  });

  test("the witness mark is the one stilled ornament", () => {
    expect(html.match(/class="witness /g) ?? []).toHaveLength(4);
    expect(html).toContain('class="witness witness-hero"');
    expect(html).toContain('class="witness witness-cold"');
    expect(html).toContain('class="witness witness-contact"');
    expect(html).toContain('class="witness witness-footer"');
    expect(html.match(/<circle /g) ?? []).toHaveLength(20);
    expect(html.match(/class="witness-outer"/g) ?? []).toHaveLength(4);
    expect(html.match(/class="witness-inner"/g) ?? []).toHaveLength(4);
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/\.witness circle \{[^}]*stroke:\s*currentColor/);
    expect(css).toMatch(/\.witness \{[^}]*color:\s*var\(--color-witness\)/);
    expect(css).toMatch(/\.witness-outer \{[^}]*witness-spin 240s linear infinite/);
    expect(css).toMatch(/\.witness-inner \{[^}]*witness-spin-reverse 240s linear infinite/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.witness-outer,[\s\S]*?animation:\s*none/);
  });
});

describe("the lead's pixel-pass residuals", () => {
  test("stacked tier-B rows keep the inline separator", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/@media \(max-width: 1099px\)[\s\S]*?\.wc \.b-meta::before \{[^}]*content:\s*" · "/);
  });

  test("the stacked Work node fills the field", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/@media \(max-width: 1099px\)[\s\S]*?\.pc \.tex \{\s*max-width:\s*none/);
  });

  test("the Work commit label stays on one line at native", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/@media \(min-width: 2200px\)[\s\S]*?\.pc \.band > div > span \{[^}]*white-space:\s*nowrap/);
  });

  test("the Open Source margin keeps the measured date whole and names the coverage gap", () => {
    expect(coordinates.oss.date).toBe(probe.measuredAt);
    expect(coordinates.oss.margin).toContain(`measured ${probe.measuredAt.replace(/-/g, "\u2011")}`);
    expect(coordinates.oss.margin).not.toContain(probe.measuredAt);
    expect(coordinates.oss.margin).toContain(
      `${probe.publicRepos} public, ${featuredRows.length + indexRows.length} shown`,
    );
    // The coordinate line and the bake-date stamp still print the raw values.
    expect(html).toContain(probe.measuredAt);
    expect(html).toContain(signal.snapshotDate);
  });

  test("the phone hero keeps the field gutter on its right edge", () => {
    const css = read("src/styles/ledger.css");
    expect(css).not.toMatch(/\.hero-hud \{[^}]*padding-inline-end:/);
  });
});

describe("the lead's hand-pass tablet faults", () => {
  test("the tablet band spans the measure and its children can shrink", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/@media \(max-width: 1099px\)[\s\S]*?\.pc \.band \{[^}]*grid-column:\s*measure-start \/ field-end/);
    expect(css).toMatch(/@media \(max-width: 1099px\)[\s\S]*?\.pc \.band > \* \{[^}]*min-width:\s*0/);
    expect(css).toMatch(/@media \(max-width: 1099px\)[\s\S]*?\.pc \.band b,\s*\.zero-seal \.seal-zero \{[^}]*font-size:\s*clamp\(/);
  });

  test("coordinate value and date are indivisible tokens", () => {
    const css = read("src/styles/ledger.css");
    expect(html.match(/class="coord-value"/g) ?? []).toHaveLength(4);
    expect(html.match(/class="coord-date"/g) ?? []).toHaveLength(4);
    expect(css).toMatch(/\.coord-value,\s*\.coord-date \{[^}]*white-space:\s*nowrap/);
  });

  test("the phone role block runs to the field right and stays left-aligned", () => {
    const css = read("src/styles/ledger.css");
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.hud-role \{[^}]*justify-self:\s*stretch/);
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.hud-role > p \{[^}]*margin-inline-start:\s*0[^}]*max-width:\s*none/);
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.hud-role,[\s\S]*?text-align:\s*left/);
  });
});
