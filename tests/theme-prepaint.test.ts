import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, test } from "vitest";

// The FIRST inline `<script>` in index.html runs before first paint and seeds
// `data-theme` on <html>. Its only failure mode is a flash of the wrong theme
// for every visitor, so it is pinned here by executing the real script body
// against a controlled jsdom global rather than by asserting on its text.
const root = resolve(import.meta.dirname, "..");

function readPrepaintScript(): string {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error("index.html has no inline <script> block to test");
  }
  return match[1];
}

type StoredBehavior = string | null | "throw";
type MatchMediaBehavior = "absent" | "throw" | "matches" | "no-match";

interface PrepaintCase {
  name: string;
  stored: StoredBehavior;
  matchMedia: MatchMediaBehavior;
  expected: "light" | "dark";
}

function runPrepaint(
  script: string,
  behavior: Pick<PrepaintCase, "stored" | "matchMedia">,
): string {
  const dom = new JSDOM(
    "<!DOCTYPE html><html><head></head><body></body></html>",
    { url: "https://nathwn12.github.io/", runScripts: "outside-only" },
  );
  const { window } = dom;

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => {
        if (behavior.stored === "throw") {
          throw new Error(`storage blocked while reading ${key}`);
        }
        return behavior.stored;
      },
    },
  });

  if (behavior.matchMedia === "absent") {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: undefined,
    });
  } else if (behavior.matchMedia === "throw") {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => {
        throw new Error("matchMedia unavailable");
      },
    });
  } else {
    const matches = behavior.matchMedia === "matches";
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) => ({
        matches,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
  }

  window.eval(script);
  return window.document.documentElement.dataset.theme ?? "";
}

const script = readPrepaintScript();

const matrix: PrepaintCase[] = [
  {
    name: "stored dark wins over a light OS",
    stored: "dark",
    matchMedia: "no-match",
    expected: "dark",
  },
  {
    name: "stored light wins over a dark OS",
    stored: "light",
    matchMedia: "matches",
    expected: "light",
  },
  {
    name: "an unrecognized stored value falls through to the OS probe",
    stored: "solarized",
    matchMedia: "matches",
    expected: "dark",
  },
  {
    name: "an absent stored value probes the OS",
    stored: null,
    matchMedia: "no-match",
    expected: "light",
  },
  {
    name: "a storage read that throws still probes the OS",
    stored: "throw",
    matchMedia: "matches",
    expected: "dark",
  },
  {
    name: "a missing matchMedia degrades to light",
    stored: null,
    matchMedia: "absent",
    expected: "light",
  },
  {
    name: "a matchMedia that throws degrades to light",
    stored: null,
    matchMedia: "throw",
    expected: "light",
  },
];

describe("pre-paint theme script", () => {
  test.each(matrix)("$name", ({ stored, matchMedia, expected }) => {
    expect(runPrepaint(script, { stored, matchMedia })).toBe(expected);
  });

  test("a storage exception never suppresses OS detection (independent try/catches)", () => {
    // Load-bearing: localStorage.getItem throwing must not force the light
    // theme onto a dark-OS visitor. If the two try/catches are ever merged,
    // the OS probe becomes unreachable on the storage-failure path and the
    // first case here flips to "light".
    expect(runPrepaint(script, { stored: "throw", matchMedia: "matches" })).toBe(
      "dark",
    );
    expect(
      runPrepaint(script, { stored: "throw", matchMedia: "no-match" }),
    ).toBe("light");
  });

  test("only ever writes a resolved light/dark value", () => {
    // CSS has no "auto" branch — the script must resolve before it writes.
    expect(script).not.toMatch(/dataset\.theme\s*=\s*["']auto["']/);

    const written = matrix.map((entry) =>
      runPrepaint(script, { stored: entry.stored, matchMedia: entry.matchMedia }),
    );
    for (const theme of written) {
      expect(["light", "dark"]).toContain(theme);
    }
  });
});
