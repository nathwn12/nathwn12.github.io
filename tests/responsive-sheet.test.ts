/**
 * Responsive sheet — fix the measures, never the composition.
 *
 * The sheet is the viewport minus a fluid gutter per side, capped at 80rem
 * (96rem at 1600px+, where ALL added width lands in the outer grid columns
 * and gaps while text columns keep their ch measures). Short viewports
 * compress type and padding only — nothing hides, order and copy hold.
 *
 * Every count below can go red:
 *
 *   pnpm vitest run tests/responsive-sheet.test.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "..");
const css = readFileSync(resolve(root, "src", "index.css"), "utf8");
const band = readFileSync(
  resolve(root, "src", "components", "InstrumentBand.tsx"),
  "utf8",
);
const hero = readFileSync(
  resolve(root, "src", "components", "Hero.tsx"),
  "utf8",
);
const footer = readFileSync(
  resolve(root, "src", "components", "Footer.tsx"),
  "utf8",
);
const projects = readFileSync(
  resolve(root, "src", "components", "Projects.tsx"),
  "utf8",
);
const teaser = readFileSync(
  resolve(root, "src", "components", "WorkTeaser.tsx"),
  "utf8",
);
const experience = readFileSync(
  resolve(root, "src", "components", "Experience.tsx"),
  "utf8",
);
const app = readFileSync(resolve(root, "src", "App.tsx"), "utf8");

describe("sheet measure", () => {
  test("gutter token is the fluid per-side rule", () => {
    expect(css).toMatch(/--sheet-gutter:\s*clamp\(1\.5rem,\s*4vw,\s*3rem\)/);
  });

  test("sheet is viewport minus gutters, capped at 80rem", () => {
    expect(css).toMatch(
      /\.sheet\s*\{[^}]*width:\s*min\(100vw - \(var\(--sheet-gutter\) \* 2\), 80rem\)/,
    );
    expect(css).toMatch(/\.sheet\s*\{[^}]*margin-inline:\s*auto/);
  });

  test("at 1600px+ the cap rises to 96rem and gaps widen outward", () => {
    expect(css).toMatch(
      /@media\s*\(min-width:\s*1600px\)[\s\S]*?min\(100vw - \(var\(--sheet-gutter\) \* 2\), 96rem\)/,
    );
    expect(css).toMatch(
      /@media\s*\(min-width:\s*1600px\)[\s\S]*?\.sheet-grid\s*\{[^}]*column-gap:\s*2rem/,
    );
  });

  test("shared constants carry the sheet; the 12-col breakpoint stays at lg", () => {
    expect(band).toMatch(/GUTTER_CONTAINER = "sheet mx-auto"/);
    expect(band).toMatch(
      /GUTTER_GRID = "sheet-grid lg:grid lg:grid-cols-12 lg:gap-x-6"/,
    );
    expect(band).not.toMatch(/md:grid-cols-12/);
  });

  test("bands and hero spend the sheet, not fixed padding", () => {
    expect(band).toMatch(/\$\{GUTTER_CONTAINER\} sheet-pad/);
    expect(hero).toMatch(/\$\{GUTTER_CONTAINER\} sheet-pad hero-top/);
    expect(hero).not.toMatch(/\$\{GUTTER_CONTAINER\} px-6/);
  });
});

describe("prose measure holds at wide sheets", () => {
  test("text columns keep their ch measures (no line can reach ~75ch)", () => {
    expect(projects).toMatch(/max-w-\[62ch\]/);
    expect(teaser).toMatch(/max-w-\[62ch\]/);
    expect(hero).toMatch(/max-w-\[62ch\]/);
    expect(experience).toMatch(/max-w-\[65ch\]/);
    expect(app).toMatch(/max-w-\[68ch\]/);
    const caps: string[] = [];
    for (const [name, source] of [
      ["Hero", hero],
      ["Projects", projects],
      ["WorkTeaser", teaser],
      ["Experience", experience],
      ["App", app],
    ] as const) {
      for (const m of source.match(/max-w-\[(\d+)ch\]/g) ?? []) {
        caps.push(m);
        const n = Number(m.match(/\[(\d+)ch\]/)?.[1]);
        expect(n, `${name}: prose cap ${m} exceeds 68ch`).toBeLessThanOrEqual(
          68,
        );
      }
    }
    expect(caps.length, "no ch prose caps found").toBeGreaterThan(0);
  });
});

describe("height awareness compresses, never hides", () => {
  test("max-height 800px: masthead and deck step down, rhythm loses a quarter", () => {
    expect(css).toMatch(/@media\s*\(max-height:\s*800px\)/);
    expect(css).toMatch(
      /@media\s*\(max-height:\s*800px\)[\s\S]*?\.masthead-name\s*\{[^}]*font-size:\s*clamp\(2\.5rem, 8vw, 6rem\)/,
    );
    expect(css).toMatch(
      /@media\s*\(max-height:\s*800px\)[\s\S]*?\.hero-deck\s*\{[^}]*font-size:\s*clamp\(1\.125rem, 2\.5vw, 1\.5rem\)/,
    );
    expect(css).toMatch(
      /@media\s*\(max-height:\s*800px\)[\s\S]*?\.band-top\s*\{[^}]*padding-top:\s*1\.875rem/,
    );
    expect(css).toMatch(
      /@media\s*\(min-width:\s*1024px\) and \(max-height:\s*800px\)[\s\S]*?\.band-top\s*\{[^}]*padding-top:\s*2\.625rem/,
    );
  });

  test("max-height 640px: masthead steps down again, hero paddings halve", () => {
    expect(css).toMatch(/@media\s*\(max-height:\s*640px\)/);
    expect(css).toMatch(
      /@media\s*\(max-height:\s*640px\)[\s\S]*?\.masthead-name\s*\{[^}]*font-size:\s*clamp\(2rem, 8vw, 4\.5rem\)/,
    );
    expect(css).toMatch(
      /@media\s*\(max-height:\s*640px\)[\s\S]*?\.hero-top\s*\{[^}]*padding-top:\s*0\.5rem/,
    );
    expect(css).toMatch(
      /@media\s*\(min-width:\s*1024px\) and \(max-height:\s*640px\)[\s\S]*?\.hero-top\s*\{[^}]*padding-top:\s*1rem/,
    );
    expect(css).toMatch(
      /@media\s*\(max-height:\s*640px\)[\s\S]*?\.hero-deck\s*\{[^}]*padding-block:\s*0\.5rem/,
    );
    expect(css).toMatch(
      /@media\s*\(max-height:\s*640px\)[\s\S]*?\.hero-cta\s*\{[^}]*padding-bottom:\s*0\.25rem/,
    );
  });

  test("no height rule hides content to fit", () => {
    expect(css).not.toMatch(/display\s*:\s*none/);
  });

  test("hero consumes the height hooks", () => {
    for (const hook of [
      "hero-top",
      "hero-dateline",
      "hero-name",
      "hero-deck",
      "hero-cta",
      "hero-foot",
      "pullquote-pad",
    ]) {
      expect(hero, `Hero wires .${hook}`).toContain(hook);
    }
    expect(band).toContain("band-top");
    expect(band).toContain("band-grid");
  });
});

describe("footer stays a single compact row", () => {
  test("one row, no scroll container, 52px bar keeps focus clearance", () => {
    expect(footer).toMatch(/whitespace-nowrap/);
    const row = footer.match(/<div className="([^"]*whitespace-nowrap[^"]*)"/);
    expect(row?.[1]).toMatch(/flex/);
    expect(row?.[1]).not.toMatch(/flex-wrap/);
    expect(footer).not.toMatch(/overflow-x-(auto|scroll)/);
    expect(footer).toMatch(/min-h-11/);
    expect(footer).toMatch(/py-1/);
  });
});
