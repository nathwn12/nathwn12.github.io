import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, test } from "vitest";

// The FIRST inline `<script>` in index.html runs before first paint and seeds
// `data-theme` and `data-motion` on <html>. Its failure modes are a flash of the
// wrong ground and a flash of motion, so it is pinned here by executing the real
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
  /** What `(prefers-color-scheme: light)` answers, or null for no matchMedia. */
  osLight: boolean | null;
  expected: "light" | "dark";
}

/** Run the real script body against a document with the shipped meta. */
function runPrepaint(
  script: string,
  stored: StoredBehavior,
  osLight: boolean | null,
  reduceMotion = true,
): { motion: string; theme: string | null; themeColors: string[] } {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><head><meta name="theme-color" content="#07090B" /></head><body></body></html>`,
    { url: "https://nathwn12.github.io/", runScripts: "outside-only" },
  );
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

  /* No matchMedia at all is the harshest environment: the script must still
     land on its defaults without asking the OS anything. */
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value:
      osLight === null
        ? undefined
        : (query: string) => ({
            matches: query.includes("light") ? osLight : reduceMotion,
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
          }),
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
  {
    name: "an absent stored value follows a light OS",
    stored: null,
    osLight: true,
    expected: "light",
  },
  {
    name: "an absent stored value follows a dark OS",
    stored: null,
    osLight: false,
    expected: "dark",
  },
  {
    name: "a stored light pin beats a dark OS",
    stored: "light",
    osLight: false,
    expected: "light",
  },
  {
    name: "a stored dark pin beats a light OS",
    stored: "dark",
    osLight: true,
    expected: "dark",
  },
  {
    name: "an unrecognized stored value falls through to the OS",
    stored: "solarized",
    osLight: true,
    expected: "light",
  },
  {
    name: "no media query support falls back to the dark ground",
    stored: null,
    osLight: null,
    expected: "dark",
  },
];

describe("pre-paint theme script", () => {
  test.each(matrix)("$name", ({ stored, osLight, expected }) => {
    expect(runPrepaint(script, stored, osLight).theme).toBe(expected);
  });

  test("a storage exception still writes the attribute (its own try/catch)", () => {
    /* Load-bearing: localStorage.getItem throwing must not leave the page
       without `data-theme`, because the first frame would then paint the dark
       ground for a visitor who pinned Paper. */
    expect(runPrepaint(script, "throw", false).theme).toBe("dark");
    expect(runPrepaint(script, "throw", true).theme).toBe("light");
  });

  test("rewrites theme-color to the resolved ground", () => {
    expect(runPrepaint(script, null, true).themeColors).toEqual(["#F1F2ED"]);
    expect(runPrepaint(script, null, false).themeColors).toEqual(["#07090B"]);
  });

  test("writes one static meta, which the script then rewrites", () => {
    const metas = [...HTML.matchAll(/<meta name="theme-color"[^>]*>/g)].map(
      (match) => match[0],
    );
    expect(metas).toEqual(['<meta name="theme-color" content="#07090B" />']);
  });
});

describe("pre-paint motion state", () => {
  test("is on by default and off only when the OS asks for less", () => {
    expect(runPrepaint(script, null, false, false).motion).toBe("on");
    expect(runPrepaint(script, null, false, true).motion).toBe("off");
  });

  test("never reads a stored motion switch — there is no switch", () => {
    expect(script).not.toContain("nnl-motion");
  });
});
