import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { CASES } from "../src/content/cases";

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

async function renderApp(): Promise<string> {
  const { default: App } = await import("../src/App");
  return renderToStaticMarkup(createElement(App));
}

const DELETED_COMPONENTS = [
  "src/components/CopyButton.tsx",
  "src/components/InstallStrip.tsx",
  "src/components/FeaturedGrid.tsx",
  "src/components/SecondTier.tsx",
  "src/components/Projects.tsx",
  "src/components/Experience.tsx",
  "src/components/Skills.tsx",
  "src/components/SystemAtlas.tsx",
  "src/components/WorkTeaser.tsx",
  "src/components/ProofBand.tsx",
  "src/components/PageShell.tsx",
  "src/components/NotFound.tsx",
  "src/components/PageFoot.tsx",
  "src/components/Contact.tsx",
];

const DELETED_CONTENT = [
  "src/content/portfolio.ts",
  "src/content/projects.ts",
  "src/content/experience.ts",
  "src/content/skills.ts",
  "src/content/credentials.ts",
];

describe("hiring portfolio — structure", () => {
  test("hero carries name, role, one outcome sentence, and a contact CTA", async () => {
    const markup = await renderApp();
    expect(markup).toContain("Nathaniel Nikolai Ladero");
    expect(markup).toMatch(/Backend developer/i);
    expect(markup).toMatch(/hold up in production/);
    expect(markup).toContain('href="#contact"');
  });

  test("sections render in the guideline order", async () => {
    const markup = await renderApp();
    const order = [
      "hero-heading",
      "work-heading",
      "how-heading",
      "about-heading",
      "contact-heading",
    ].map((id) => {
      const at = markup.indexOf(`id="${id}"`);
      expect(at, `${id} present`).toBeGreaterThan(-1);
      return at;
    });
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  test("no install strings, copy buttons, repo tables, or shell listings in the rendered output", async () => {
    const markup = await renderApp();
    for (const banned of [
      /\bnpx\b/,
      /\bnpm\b/i,
      /\bcopy\b/i,
      /\bcopied\b/i,
      /ls -la/,
      /\bwhoami\b/,
      /\bstar\b/i,
    ]) {
      expect(banned.test(markup), `${banned} absent`).toBe(false);
    }
    // source tree carries no install commands either
    const srcFiles = [
      ...readdirSync(resolve(root, "src", "components")).map(
        (f) => `src/components/${f}`,
      ),
      "src/content/cases.ts",
      "src/App.tsx",
    ];
    for (const file of srcFiles) {
      const body = read(file);
      expect(body.includes("npx")).toBe(false);
      expect(body.includes("framer-motion")).toBe(false);
    }
    expect(existsSync(resolve(root, "src/components/CopyButton.tsx"))).toBe(
      false,
    );
    expect(existsSync(resolve(root, "src/components/InstallStrip.tsx"))).toBe(
      false,
    );
  });

  test("deleted developer-surface components and content are gone", () => {
    for (const rel of [...DELETED_COMPONENTS, ...DELETED_CONTENT]) {
      expect(existsSync(resolve(root, rel)), `${rel} deleted`).toBe(false);
    }
  });

  test("cases follow the guideline field list, 3 to 5 entries, one link each", () => {
    expect(CASES.length).toBeGreaterThanOrEqual(3);
    expect(CASES.length).toBeLessThanOrEqual(5);
    for (const c of CASES) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.whatItIs.length).toBeGreaterThan(0);
      expect(c.whoFor.length).toBeGreaterThan(0);
      expect(c.hardPart.length).toBeGreaterThan(0);
      expect(c.shipped.length).toBeGreaterThanOrEqual(2);
      expect(c.shipped.length).toBeLessThanOrEqual(3);
      expect(c.took.length).toBeGreaterThan(0);
      expect(c.linkUrl).toMatch(/^https:\/\//);
    }
  });

  test("contact is email plus one profile link", async () => {
    const markup = await renderApp();
    expect(markup).toContain("nathanielnikolai.ladero@gmail.com");
    expect(markup).toContain("https://github.com/nathwn12");
  });
});

describe("hiring portfolio — guideline tokens", () => {
  test("colour pairs and focus ring match the guideline", () => {
    const css = read("src/index.css").toLowerCase();
    expect(css).toContain("#111111");
    expect(css).toContain("#ffffff");
    expect(css).toContain("#595959");
    expect(css).toContain("#0b57d0");
    expect(css).toMatch(/outline:\s*2px solid/);
  });

  test("type scale, line length, spacing scale, and single column hold", () => {
    const css = read("src/index.css");
    const app = read("src/App.tsx");
    const components = readdirSync(resolve(root, "src", "components"))
      .map((f) => read(`src/components/${f}`))
      .join("\n");
    const all = `${css}\n${app}\n${components}`;
    // H1 40px/1.2/700, H2 28px/1.25/700
    expect(css).toContain("2.5rem");
    expect(css).toContain("1.75rem");
    expect(css).toMatch(/line-height:\s*1\.5/);
    // max line length 66ch, column max 720px, 16px gutters
    expect(all).toContain("66ch");
    expect(all).toContain("720px");
    expect(all).toContain("px-4");
    // section gap 64 → py-16
    expect(all).toContain("py-16");
  });

  test("motion is a 150ms hover only, killed by reduced motion", () => {
    const css = read("src/index.css");
    expect(css).toContain("150ms");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toMatch(/transition:\s*none/);
    for (const banned of [
      "autoplay",
      "marquee",
      "parallax",
      "framer-motion",
      "@keyframes",
    ]) {
      expect(css.toLowerCase().includes(banned)).toBe(false);
    }
    const srcAll =
      read("src/App.tsx") +
      readdirSync(resolve(root, "src", "components"))
        .map((f) => read(`src/components/${f}`))
        .join("\n");
    for (const banned of [
      "framer-motion",
      "animate(",
      "marquee",
      "parallax",
      "autoplay",
      "rotate(",
    ]) {
      expect(srcAll.includes(banned)).toBe(false);
    }
  });
});
