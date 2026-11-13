import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, test } from "vitest";

// The FIRST inline `<script>` in index.html runs before first paint and seeds
// `data-motion` on <html>. Its only failure mode is a flash of motion for a
// visitor who already turned it off, so it is pinned here by executing the real
// script body against a controlled jsdom global rather than by asserting on its
// text.
const root = resolve(import.meta.dirname, "..");
const HTML = readFileSync(resolve(root, "index.html"), "utf8");

function readPrepaintScript(): string {
  const match = HTML.match(/<script>([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error("index.html has no inline <script> block to test");
  }
  return match[1];
}

type StoredBehavior = string | null | "throw";

interface PrepaintCase {
  name: string;
  stored: StoredBehavior;
  expected: "on" | "off";
}

/**
 * Run the real script body. The document carries no theme-color metas and no
 * media query of any kind: the motion script must not need either.
 */
function runPrepaint(
  script: string,
  stored: StoredBehavior,
): { motion: string; theme: string | null; themeColors: string[] } {
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`, {
    url: "https://nathwn12.github.io/",
    runScripts: "outside-only",
  });
  const { window } = dom;

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => {
        if (stored === "throw") {
          throw new Error(`storage blocked while reading ${key}`);
        }
        return stored;
      },
    },
  });

  /* A throwing matchMedia is the harshest environment available: the script
     must still land on its default without asking the OS anything. */
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => {
      throw new Error("matchMedia must not be read before paint");
    },
  });

  window.eval(script);

  return {
    motion: window.document.documentElement.dataset.motion ?? "",
    theme: window.document.documentElement.getAttribute("data-theme"),
    themeColors: [
      ...window.document.querySelectorAll('meta[name="theme-color"]'),
    ].map((meta) => meta.getAttribute("content") ?? ""),
  };
}

const script = readPrepaintScript();

const matrix: PrepaintCase[] = [
  { name: "an absent stored value leaves motion on", stored: null, expected: "on" },
  { name: "a stored on is honoured", stored: "on", expected: "on" },
  { name: "a stored off turns motion off", stored: "off", expected: "off" },
  {
    name: "an unrecognized stored value falls through to on",
    stored: "maybe",
    expected: "on",
  },
];

describe("pre-paint motion script", () => {
  test.each(matrix)("$name", ({ stored, expected }) => {
    expect(runPrepaint(script, stored).motion).toBe(expected);
  });

  test("a storage exception still writes the attribute (its own try/catch)", () => {
    /* Load-bearing: localStorage.getItem throwing must not leave the page
       without `data-motion`, because the CSS kill switch keys off it and the
       first frame would then animate. */
    expect(runPrepaint(script, "throw").motion).toBe("on");
  });

  test("never writes a theme, and never paints a theme-color meta", () => {
    // There is one ground. A theme write here would be a second palette that
    // the stylesheet does not have.
    const result = runPrepaint(script, "off");
    expect(result.theme).toBeNull();
    expect(result.themeColors).toEqual([]);
    expect(script).not.toMatch(/dataset\.theme|localStorage\.getItem\("nnl-theme"\)/);
    expect(script).toContain("nnl-motion");
  });

  test("index.html ships one static ground, not a media pair", () => {
    const metas = [
      ...HTML.matchAll(/<meta name="theme-color"[^>]*>/g),
    ].map((match) => match[0]);
    expect(metas).toEqual(['<meta name="theme-color" content="#0A0C0E" />']);
  });
});
