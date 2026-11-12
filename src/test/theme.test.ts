// @vitest-environment jsdom
/**
 * The design-system contract — dark-only, one token source.
 *
 * The "Recorder" redesign retired the light/dark pair: the site is an
 * instrument panel, so there is exactly one ground, and `src/lib/theme.ts`, its
 * `nnl-theme` storage key and the footer switch are gone. What replaces that
 * test file is this one: it pins the shipped `--rec-*` values (the plan's
 * table, verbatim), the contrast of every foreground/ground pair the page
 * paints, the legacy `--color-*` aliases the not-yet-rewritten sections still
 * consume, and the motion preference store that took the theme store's place.
 *
 * Every assertion reads the real stylesheet, so a palette edit flows into the
 * numbers here instead of leaving a stale copy behind.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  MOTION_KEY,
  readMotionEnabled,
  prefersReducedMotion,
  setMotionEnabled,
} from "../lib/motion";

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

describe("the recorder palette is the plan's table, verbatim", () => {
  it.each([
    ["--rec-ground", "#0a0c0e"],
    ["--rec-panel", "#111417"],
    ["--rec-panel-2", "#171b1f"],
    ["--rec-rule", "#23282d"],
    ["--rec-rule-strong", "#39424a"],
    ["--rec-ink", "#e9eef2"],
    ["--rec-ink-muted", "#8c979e"],
    ["--rec-signal", "#7c9cff"],
    ["--rec-measure", "#4dd4e8"],
    ["--rec-alarm", "#ff5d5d"],
  ])("%s is %s", (name, hex) => {
    expect(REC[name]).toBe(hex);
  });
});

describe("contrast — measured from the shipped tokens", () => {
  it.each([
    ["ink on ground", "--rec-ink", "--rec-ground", 13],
    ["muted on ground", "--rec-ink-muted", "--rec-ground", 5.2],
    ["signal on ground", "--rec-signal", "--rec-ground", 6],
    ["measure on ground", "--rec-measure", "--rec-ground", 9],
    ["ink on panel", "--rec-ink", "--rec-panel", 13],
    ["muted on panel", "--rec-ink-muted", "--rec-panel", 5.2],
  ])("%s is at least %d:1", (_role, fg, bg, minimum) => {
    const ratio = contrast(REC[fg], REC[bg]);
    expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
      minimum,
    );
  });
});

describe("one theme, and it is dark", () => {
  it("declares color-scheme: dark and carries no light block", () => {
    expect(TOKENS).toContain("color-scheme: dark");
    expect(TOKENS).not.toContain("data-theme");
    expect(TOKENS).not.toContain("prefers-color-scheme");
    expect(existsSync(resolve(root, "src/lib/theme.ts"))).toBe(false);
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
    expect(TOKENS).toMatch(/--rec-prose-measure:\s*62ch/);
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
    ["JetBrains Mono", "JetBrainsMono-Regular.woff2", "font-weight: 400"],
    ["JetBrains Mono", "JetBrainsMono-Medium.woff2", "font-weight: 500"],
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

describe("motion preference — the store that replaced the theme store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.motion;
  });

  afterEach(() => {
    delete document.documentElement.dataset.motion;
  });

  it("uses its own key, not the retired theme key", () => {
    expect(MOTION_KEY).toBe("nnl-motion");
    expect(MOTION_KEY).not.toBe("nnl-theme");
  });

  it("defaults to on, and off only when the visitor stored off", () => {
    expect(readMotionEnabled()).toBe(true);
    window.localStorage.setItem(MOTION_KEY, "off");
    expect(readMotionEnabled()).toBe(false);
    window.localStorage.setItem(MOTION_KEY, "on");
    expect(readMotionEnabled()).toBe(true);
    // An unrecognized value is not a preference: it falls through to on.
    window.localStorage.setItem(MOTION_KEY, "maybe");
    expect(readMotionEnabled()).toBe(true);
  });

  it("writes data-motion on <html> and persists the switch", () => {
    setMotionEnabled(false);
    expect(document.documentElement.dataset.motion).toBe("off");
    expect(window.localStorage.getItem(MOTION_KEY)).toBe("off");

    setMotionEnabled(true);
    expect(document.documentElement.dataset.motion).toBe("on");
    expect(window.localStorage.getItem(MOTION_KEY)).toBe("on");
  });

  it("treats a missing or throwing matchMedia as 'reduce'", () => {
    expect(prefersReducedMotion()).toBe(true);
    const original = window.matchMedia;
    window.matchMedia = (() => {
      throw new Error("matchMedia blocked");
    }) as typeof window.matchMedia;
    expect(prefersReducedMotion()).toBe(true);
    window.matchMedia = original;
  });
});
