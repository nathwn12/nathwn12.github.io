// @vitest-environment jsdom
/**
 * The design-system contract — two themes, one token source, one attribute.
 *
 * The site carries a dark "Recorder" palette in `:root` and a light "Paper"
 * palette in `[data-theme="light"]`. `<html data-theme="light|dark">` is the only
 * switch: there is no `prefers-color-scheme` block in CSS, so a stored choice and
 * the OS can never disagree on the page. This file pins the shipped `--rec-*`
 * values (the brief's table, verbatim), the contrast of every foreground/ground
 * pair the page paints, the legacy `--color-*` aliases the not-yet-rewritten
 * sections still consume, and the reduce-only motion state that replaced the
 * retired footer switch.
 *
 * Every assertion reads the real stylesheet, so a palette edit flows into the
 * numbers here instead of leaving a stale copy behind.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyStoredMotion,
  motionAllowed,
  prefersReducedMotion,
} from "../lib/motion";
import { applyTheme, THEME_KEY } from "../lib/theme";

const root = resolve(import.meta.dirname, "..", "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const TOKENS = read("src/styles/tokens.css");
const FONTS = read("src/styles/fonts.css");
const BASE = read("src/styles/base.css");
const BARREL = read("src/index.css");

/** A `{ ... }` block by its opening selector, or "" when absent. */
function block(source: string, selector: string): string {
  const from = source.indexOf(selector);
  if (from === -1) return "";
  const open = source.indexOf("{", from);
  const close = source.indexOf("\n}", open);
  if (open === -1 || close === -1) return "";
  return source.slice(open, close);
}

/** Every `--name: #hex` pair in a block, lowercased. */
function hexTokens(source: string, prefix = "--"): Record<string, string> {
  const found: Record<string, string> = {};
  for (const match of source.matchAll(
    new RegExp(`(${prefix}[a-z0-9-]+):\\s*(#[0-9a-f]{6})\\b`, "gi"),
  )) {
    found[match[1]] = match[2].toLowerCase();
  }
  return found;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [a, b] = [luminance(foreground), luminance(background)].sort(
    (x, y) => y - x,
  );
  return (a + 0.05) / (b + 0.05);
}

const REC = hexTokens(block(TOKENS, ":root"), "--rec-");
const PAPER = { ...REC, ...hexTokens(block(TOKENS, '[data-theme="light"]'), "--rec-") };

describe("the recorder palette is the brief's table, verbatim", () => {
  it.each([
    ["--rec-ground", "#07090b"],
    ["--rec-panel", "#0e1114"],
    ["--rec-panel-2", "#151a1e"],
    ["--rec-rule", "#20262b"],
    ["--rec-rule-strong", "#39424a"],
    ["--rec-ink", "#f2f6f8"],
    ["--rec-ink-muted", "#8e9ba3"],
    ["--rec-signal", "#4dd4e8"],
    ["--rec-measure", "#f5a524"],
    ["--rec-alarm", "#ff5d5d"],
    ["--rec-on-signal", "#04070a"],
  ])("%s is %s", (name, hex) => {
    expect(REC[name]).toBe(hex);
  });
});

describe("the paper palette is the brief's table, verbatim", () => {
  it.each([
    ["--rec-ground", "#f1f2ed"],
    ["--rec-panel", "#e8eae4"],
    ["--rec-panel-2", "#dde0d9"],
    ["--rec-rule", "#c9cdc6"],
    ["--rec-rule-strong", "#9aa09a"],
    ["--rec-ink", "#0d1013"],
    ["--rec-ink-muted", "#4a5257"],
    ["--rec-signal", "#1b2ed1"],
    ["--rec-measure", "#9a4708"],
    ["--rec-alarm", "#c81e1e"],
    ["--rec-on-signal", "#f7f8f4"],
  ])("%s is %s", (name, hex) => {
    expect(PAPER[name]).toBe(hex);
  });
});

describe("contrast — measured from the shipped tokens, both themes", () => {
  it.each([
    ["dark", REC],
    ["light", PAPER],
  ])("%s", (_theme, tokens) => {
    for (const [fg, bg, minimum] of [
      ["--rec-ink", "--rec-ground", 7],
      ["--rec-ink-muted", "--rec-ground", 4.5],
      ["--rec-signal", "--rec-ground", 4.5],
      ["--rec-measure", "--rec-ground", 4.5],
      ["--rec-ink", "--rec-panel", 7],
      ["--rec-ink-muted", "--rec-panel", 4.5],
      ["--rec-on-signal", "--rec-signal", 4.5],
    ] as Array<[string, string, number]>) {
      const ratio = contrast(tokens[fg], tokens[bg]);
      expect(
        ratio,
        `${_theme}: ${fg} on ${bg} = ${ratio.toFixed(2)}:1, needs ${minimum}:1`,
      ).toBeGreaterThanOrEqual(minimum);
    }
  });
});

describe("two themes, one switch", () => {
  it("declares both schemes and no CSS scheme branch", () => {
    expect(TOKENS).toContain("color-scheme: dark");
    expect(TOKENS).toContain('[data-theme="light"]');
    expect(TOKENS).toContain("color-scheme: light");
    expect(TOKENS).not.toMatch(/@media[^{]*prefers-color-scheme/);
  });

  it("paints the browser chrome from the resolved ground, not a second palette", () => {
    /* `theme-color` cannot read a custom property, so the meta is written from
       the ground the page resolved. Pinned through the cascade: the token is
       the only place the colour is named, and the meta follows it. */
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", "#000000");
    document.head.appendChild(meta);
    const root = document.documentElement;
    try {
      root.style.setProperty("--rec-ground", REC["--rec-ground"]);
      applyTheme("dark");
      expect(meta.getAttribute("content")).toBe(REC["--rec-ground"]);

      root.style.setProperty("--rec-ground", PAPER["--rec-ground"]);
      applyTheme("light");
      expect(meta.getAttribute("content")).toBe(PAPER["--rec-ground"]);
    } finally {
      meta.remove();
      root.style.removeProperty("--rec-ground");
      delete root.dataset.theme;
    }
    expect(THEME_KEY).toBe("nnl-theme");
  });

  it("keeps the type scale the plan fixes", () => {
    /* Display, text and data roles, each a distinct token so a section cannot
       invent its own size. The hero clamp, leading and tracking are the plan's
       numbers and are asserted as such. */
    expect(TOKENS).toMatch(
      /--rec-text-display:\s*clamp\(3\.5rem,\s*13vw,\s*15rem\)/,
    );
    expect(TOKENS).toMatch(/--rec-leading-display:\s*0\.86/);
    expect(TOKENS).toMatch(/--rec-tracking-display:\s*-0\.02em/);
    expect(TOKENS).toMatch(/--rec-text-body:\s*1\.0625rem/); // 17px
    expect(TOKENS).toMatch(/--rec-leading-body:\s*1\.6/);
    expect(TOKENS).toMatch(/--rec-prose-measure:\s*56ch/);
    expect(TOKENS).toMatch(/--rec-text-data:\s*0\.75rem/); // 12px
    expect(TOKENS).toMatch(/--rec-tracking-data:\s*0\.06em/);
  });
});

describe("legacy aliases — the sections nobody has rewritten yet", () => {
  const legacy = block(TOKENS, "@theme");

  it.each([
    ["--color-bg", "--rec-ground"],
    ["--color-text", "--rec-ink"],
    ["--color-text-muted", "--rec-ink-muted"],
    ["--color-accent", "--rec-signal"],
    ["--color-accent-text", "--rec-signal"],
    ["--color-surface", "--rec-panel"],
    ["--color-surface-2", "--rec-panel-2"],
    ["--color-field-accent", "--rec-panel-2"],
    ["--color-field-accent-text", "--rec-ink"],
    ["--color-field-accent-muted", "--rec-ink-muted"],
    ["--color-field-strong", "--rec-panel"],
    ["--color-field-strong-text", "--rec-ink"],
    ["--color-field-strong-muted", "--rec-ink-muted"],
  ])("%s aliases %s", (name, target) => {
    expect(legacy).toMatch(new RegExp(`${name}:\\s*var\\(${target}\\)`));
  });

  it("states no raw hex in the legacy layer", () => {
    /* A literal here would be a second palette: every legacy name must resolve
       through a `--rec-*` value so one edit moves the whole page. */
    expect(hexTokens(legacy, "--color-")).toEqual({});
  });
});

describe("the barrel imports in cascade order", () => {
  it("is tailwind, then fonts, tokens, base, chrome, legacy", () => {
    const imports = [...BARREL.matchAll(/@import\s+"([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(imports).toEqual([
      "tailwindcss",
      "./styles/fonts.css",
      "./styles/tokens.css",
      "./styles/base.css",
      "./styles/chrome.css",
      "./styles/legacy.css",
    ]);
  });

  it("carries no font or token definitions of its own", () => {
    expect(BARREL).not.toContain("@font-face");
    expect(BARREL).not.toContain("@theme");
  });
});

describe("the three faces are local, licensed and correctly declared", () => {
  it.each([
    ["Instrument Serif", "InstrumentSerif-Regular.woff2", "font-weight: 400"],
    ["Instrument Serif", "InstrumentSerif-Italic.woff2", "font-style: italic"],
    ["Archivo", "Archivo-Variable.woff2", "font-weight: 100 900"],
    ["JetBrains Mono", "JetBrainsMono-Regular.woff2", "font-weight: 400 500"],
  ])("%s ships %s", (_family, file, descriptor) => {
    const face = [...FONTS.matchAll(/@font-face\s*\{[^}]*\}/g)]
      .map((match) => match[0])
      .find((candidate) => candidate.includes(`/fonts/${file}`));
    expect(face, `no @font-face for ${file}`).toBeDefined();
    expect(face).toContain(descriptor);
    expect(face).toContain("font-display: swap");
    expect(face).toContain("unicode-range:");
    expect(existsSync(resolve(root, "public/fonts", file))).toBe(true);
    expect(
      readFileSync(resolve(root, "public/fonts", file)).toString("ascii", 0, 4),
    ).toBe("wOF2");
  });

  it("ships an OFL licence beside every family", () => {
    for (const licence of [
      "public/fonts/OFL-InstrumentSerif.txt",
      "public/fonts/OFL-Archivo.txt",
      "public/fonts/OFL-JetBrainsMono.txt",
    ]) {
      expect(read(licence)).toContain("SIL OPEN FONT LICENSE Version 1.1");
    }
  });

  it("requests no remote font, in any shipped source", () => {
    for (const source of [FONTS, BASE, TOKENS, BARREL]) {
      expect(source).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    }
  });
});

describe("the base layer keeps the floor", () => {
  it("rings focus in signal at 2px with a 3px offset, radius 0", () => {
    const ring = block(BASE, ":focus-visible");
    expect(ring).toContain("outline: 2px solid var(--rec-signal)");
    expect(ring).toContain("outline-offset: 3px");
    expect(ring).toContain("border-radius: 0");
  });

  it("stabilises the scrollbar gutter", () => {
    expect(BASE).toMatch(/scrollbar-gutter:\s*stable/);
  });

  it("kills motion for a reduced preference, and for the footer switch", () => {
    expect(BASE).toContain("@media (prefers-reduced-motion: reduce)");
    expect(BASE).toContain('[data-motion="off"]');
    expect(BASE).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(BASE).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });
});

describe("motion state — reduce only, no switch", () => {
  beforeEach(() => {
    delete document.documentElement.dataset.motion;
  });

  afterEach(() => {
    delete document.documentElement.dataset.motion;
  });

  it("has no motion switch left to persist", () => {
    // The footer control is gone: motion is a consequence of the OS preference,
    // so there is no key and no second state to disagree with it.
    expect(read("src/styles/chrome.css")).not.toContain("motion-toggle");
    expect(read("src/components/Footer.tsx")).not.toContain("MotionToggle");
    expect(existsSync(resolve(root, "src/components/MotionToggle.tsx"))).toBe(
      false,
    );
  });

  it("treats a missing or throwing matchMedia as 'reduce'", () => {
    expect(prefersReducedMotion()).toBe(true);
    expect(motionAllowed()).toBe(false);
    const original = window.matchMedia;
    window.matchMedia = (() => {
      throw new Error("matchMedia blocked");
    }) as typeof window.matchMedia;
    expect(prefersReducedMotion()).toBe(true);
    window.matchMedia = original;
  });

  it("writes data-motion from the OS preference, never from storage", () => {
    // jsdom has no matchMedia: the honest state is "off".
    applyStoredMotion();
    expect(document.documentElement.dataset.motion).toBe("off");

    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    applyStoredMotion();
    expect(document.documentElement.dataset.motion).toBe("on");
    expect(motionAllowed()).toBe(true);
  });
});
