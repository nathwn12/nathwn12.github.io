// @vitest-environment jsdom
/**
 * Tier-B rows carry one honest meta cell: exact all-time installs when the
 * repo ships on npm, otherwise the probe language plus up to two allowlisted
 * tokens found literally in that repo's own prose. Nothing blank survives.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import LedgerPage from "../src/components/LedgerPage";
import {
  indexRows,
  metaOf,
  PACKAGE_NAMES,
  STACK_ALLOWLIST,
  stackTokensOf,
} from "../src/content/showcase";
import downloads from "../src/content/npm-downloads.json";

const html = renderToStaticMarkup(createElement(LedgerPage));
const work = html.slice(html.indexOf('id="oss"'), html.indexOf('id="method"'));
const entries = work.match(/<div class="tier-b">[\s\S]*?<\/div>/g) ?? [];

// A bare placeholder is forbidden; a hyphen inside real copy ("A-B loop") is
// not. Check the placeholder phrases in text, and the dash forms only when a
// whole cell consists of one.
const PLACEHOLDER_PHRASES = ["no package", "n/a", "unknown"];
const PLACEHOLDER_CELLS = ["—", "–", "-", "N/A", "unknown", "no package"];

describe("one honest meta cell per tier-B row", () => {
  test("every tier-B row renders exactly one non-empty meta cell", () => {
    expect(entries).toHaveLength(indexRows.length);
    for (const entry of entries) {
      const cells = [...entry.matchAll(/<span class="b-meta">([^<]*)<\/span>/g)].map(
        (match) => match[1]!.trim(),
      );
      expect(cells).toHaveLength(1);
      expect(cells[0]).not.toBe("");
      expect(entry).not.toContain('class="b-life"');
      expect(entry).not.toContain('class="b-lang"');
    }
  });

  test("no banned placeholder string appears in the rendered ledger", () => {
    const text = work.replace(/<[^>]*>/g, " ").toLowerCase();
    for (const phrase of PLACEHOLDER_PHRASES) {
      expect(text, phrase).not.toContain(phrase);
    }
    const cells = (html.match(/<(span|div|p)\b[^>]*>([^<]*)<\/\1>/g) ?? [])
      .map((cell) => cell.replace(/<[^>]*>/g, "").trim());
    for (const cell of cells) {
      expect(PLACEHOLDER_CELLS, cell).not.toContain(cell);
    }
  });

  test("installs cells equal the snapshot value for the mapped package", () => {
    const byPackage = new Map(
      downloads.packages.map((item) => [item.name, item.downloads]),
    );
    const installed = indexRows.filter((row) => row.lifetime !== null);
    expect(installed.map((row) => row.dir)).toEqual(["oc-collections"]);
    for (const row of installed) {
      const expected = PACKAGE_NAMES[row.dir]!.reduce(
        (sum, name) => sum + (byPackage.get(name) ?? 0),
        0,
      );
      expect(row.lifetime).toBe(expected);
      expect(metaOf(row)).toBe(`${expected.toLocaleString("en-US")} installs`);
      expect(entries.join(" ")).toContain(
        `<span class="b-meta">${expected.toLocaleString("en-US")} installs</span>`,
      );
    }
  });

  test("stack tokens are allowlisted and literally present in the seed text", () => {
    for (const row of indexRows.filter((item) => item.lifetime === null)) {
      const tokens = stackTokensOf(row);
      expect(tokens.length, row.dir).toBeLessThanOrEqual(2);
      for (const token of tokens) {
        expect(STACK_ALLOWLIST, `${row.dir}: ${token}`).toContain(token);
        expect(row.metaSource, `${row.dir}: ${token}`).toContain(token);
      }
      expect(metaOf(row), row.dir).toBe(
        [row.language, ...tokens].filter(Boolean).join(" · "),
      );
      expect(metaOf(row), row.dir).not.toBe("");
    }
  });

  test("the ten repo rows and the harness each produce one derived value", () => {
    const repoRows = indexRows.filter((row) => row.dir !== "opencode-harness");
    expect(repoRows).toHaveLength(10);
    expect(repoRows.filter((row) => metaOf(row).endsWith(" installs"))).toHaveLength(1);
    expect(repoRows.filter((row) => !metaOf(row).endsWith(" installs"))).toHaveLength(9);
    expect(metaOf(indexRows.find((row) => row.dir === "opencode-harness")!)).toBe(
      "OpenCode",
    );
  });
});
