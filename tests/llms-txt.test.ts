// @vitest-environment jsdom
/**
 * The site's machine description and the ledger's seeded copy come from one
 * committed snapshot: 16 summaries, 16 link lines, and every repo row that
 * has a summary speaking in its own words.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import LedgerPage from "../src/components/LedgerPage";
import { featuredRows, indexRows } from "../src/content/showcase";
import summaries from "../src/content/ai-summaries.json";

const root = resolve(import.meta.dirname, "..");
const llms = readFileSync(resolve(root, "dist", "llms.txt"), "utf8");
const lines = llms.split("\n");
const links = lines.filter((line) => line.startsWith("- ["));
const html = renderToStaticMarkup(createElement(LedgerPage));
const allRows = [...featuredRows, ...indexRows];

describe("the site's machine description", () => {
  test("opens with an H1, a blockquote summary, then one line per repo", () => {
    expect(lines[0]).toMatch(/^# /);
    expect(lines[1]).toBe("");
    expect(lines[2]).toMatch(/^> /);
    expect(lines[2]).toContain(summaries.measuredAt);
    expect(links).toHaveLength(16);
  });

  test("all 16 summary rows carry their own one-liner and stack", () => {
    expect(summaries.summaries).toHaveLength(16);
    for (const summary of summaries.summaries) {
      expect(summary.one_line.length).toBeGreaterThan(10);
      const line = links.find((item) => item.startsWith(`- [${summary.repo}]`));
      expect(line).toBeDefined();
      expect(line).toContain(`https://github.com/nathwn12/${summary.repo}`);
      expect(line).toContain(summary.one_line);
      for (const tech of summary.stack) expect(line).toContain(tech);
    }
  });

  test("the page ships llms.txt at the root and adds no star counts", () => {
    expect(llms).not.toMatch(/stars?\b/i);
    expect(readFileSync(resolve(root, "dist", "llms.txt"), "utf8")).toBe(llms);
  });
});

describe("the ledger in each repo's own words", () => {
  test("every repo row with a summary uses its one_line as the claim", () => {
    const byRepo = new Map(summaries.summaries.map((summary) => [summary.repo, summary]));
    const seeded = allRows.filter((row) => byRepo.has(row.dir));
    expect(seeded).toHaveLength(13);
    expect(allRows.filter((row) => row.seeded)).toHaveLength(13);
    for (const row of seeded) {
      const oneLine = byRepo.get(row.dir)!.one_line;
      expect(row.claim).toContain(oneLine);
      // The seeded copy replaces the authored claim, not the name or figures.
      expect(html).toContain(row.name);
      const escaped = oneLine
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/'/g, "&#x27;")
        .replace(/"/g, "&quot;");
      expect(html).toContain(escaped);
      if (row.lifetime !== null) {
        expect(html).toContain(row.lifetime.toLocaleString("en-US"));
      }
    }
  });

  test("draft seeds and stale summaries are shown as quiet tokens", () => {
    const seeded = allRows.filter((row) => row.seeded);
    expect(seeded.filter((row) => row.seed).length).toBeGreaterThan(0);
    for (const row of seeded) {
      if (row.seed) expect(row.claim).toContain("seed");
      if (row.stale) expect(row.claim).toContain("stale");
    }
    // The harness has no public summary, so it keeps its authored claim.
    const harness = allRows.find((row) => row.dir === "opencode-harness")!;
    expect(harness.seeded).toBe(false);
    expect(harness.claim).toBe("The public harness I drive every day.");
  });
});
