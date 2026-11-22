/**
 * Red proofs for the machine-summary probe: malformed front matter is
 * rejected, staleness is computed from the two dates, a missing file is named
 * rather than silently dropped, and a network failure keeps the last snapshot.
 */
import { mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  computeStale,
  measure,
  parseFrontMatter,
} from "../scripts/probe-summaries.mjs";
import {
  serializeRecord,
  writeRecordIfChanged,
} from "../scripts/probe-repos.mjs";
import committed from "../src/content/ai-summaries.json";

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const FRONT = `---
project: seed
one_line: 'A repo says what it does, with an apostrophe: it is true.'
stack: [Rust, C++]
status: draft
since: 2026-11
capabilities: [click, type]
limits: []
updated: 2026-11-22
draft: true
---

The body is not part of the summary.
`;

describe("the front-matter boundary", () => {
  test("parses all required keys, including quoted copy and inline lists", () => {
    const parsed = parseFrontMatter(FRONT);
    expect(parsed.project).toBe("seed");
    expect(parsed.one_line).toContain("it is true.");
    expect(parsed.stack).toEqual(["Rust", "C++"]);
    expect(parsed.capabilities).toEqual(["click", "type"]);
    expect(parsed.limits).toEqual([]);
    expect(parsed.updated).toBe("2026-11-22");
    expect(parsed.draft).toBe(true);
  });

  test("RED PROOF: malformed front matter is rejected with a named key", () => {
    expect(() => parseFrontMatter(FRONT.replace(/^one_line:.*\n/m, ""))).toThrow(
      /invalid front matter \(one_line\)/,
    );
    expect(() => parseFrontMatter(FRONT.replace("updated: 2026-11-22", "updated: yesterday"))).toThrow(
      /invalid front matter \(updated\)/,
    );
    expect(() => parseFrontMatter(FRONT.replace("draft: true", "draft: yes"))).toThrow(
      /invalid front matter \(draft\)/,
    );
  });

  test("RED PROOF: stale is true only when updated precedes the push", () => {
    expect(computeStale("2026-11-01", "2026-11-22")).toBe(true);
    expect(computeStale("2026-11-22", "2026-11-22")).toBe(false);
    expect(computeStale("2026-12-01", "2026-11-22")).toBe(false);
  });
});

describe("the measurement", () => {
  test("a missing repo file is skipped with a named line, not a silent gap", async () => {
    const { record, notes } = await measure({
      today: "2026-11-22",
      fetchText: async (repo) =>
        repo === "hand" ? { status: 404, text: "" } : { status: 200, text: FRONT },
    });
    expect(notes).toContain("skip hand: ai/llms.txt not found (404)");
    expect(record.summaries).toHaveLength(15);
    expect(record.summaries.some((summary) => summary.repo === "hand")).toBe(false);
  });

  test("a malformed remote file is skipped with its reason", async () => {
    const { notes } = await measure({
      today: "2026-11-22",
      fetchText: async (repo) => ({
        status: 200,
        text: repo === "hand" ? FRONT.replace(/^one_line:.*\n/m, "") : FRONT,
      }),
    });
    expect(notes.some((note) => note.startsWith("skip hand: ai/llms.txt: invalid front matter"))).toBe(true);
  });

  test("a failed fetch rejects the measurement so the last snapshot survives", async () => {
    await expect(
      measure({
        today: "2026-11-22",
        fetchText: async () => {
          throw new Error("ECONNRESET");
        },
      }),
    ).rejects.toThrow(/fetch failed for .*: ECONNRESET/);
  });
});

describe("the committed snapshot write", () => {
  test("serializes exactly as the committed file stores the record", () => {
    const onDisk = readFileSync(
      new URL("../src/content/ai-summaries.json", import.meta.url),
      "utf8",
    );
    expect(serializeRecord(committed)).toBe(onDisk);
    expect(committed.summaries).toHaveLength(16);
  });

  test("a byte-identical measurement does not touch the file", () => {
    const dir = mkdtempSync(join(tmpdir(), "ai-summaries-"));
    tempDirs.push(dir);
    const out = join(dir, "ai-summaries.json");
    writeFileSync(out, serializeRecord(committed), "utf8");
    const old = new Date("2020-01-01T00:00:00Z");
    utimesSync(out, old, old);
    expect(writeRecordIfChanged(out, committed)).toBe(false);
    expect(Math.abs(statSync(out).mtimeMs - old.getTime())).toBeLessThan(2000);
    expect(readFileSync(out, "utf8")).toBe(serializeRecord(committed));
  });
});
