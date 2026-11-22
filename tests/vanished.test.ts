/**
 * Mark, never prune. A 404 or a repo leaving the account keeps its last row;
 * a return clears the mark; only an explicit --prune --yes deletes named rows.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { measure } from "../scripts/probe-summaries.mjs";

const root = resolve(import.meta.dirname, "..");
const script = resolve(root, "scripts", "refresh-repos.mjs");
const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const FRONT = `---
project: hand
one_line: A repo says what it does in its own words.
stack: [Rust]
status: draft
since: 2026-11
capabilities: []
limits: []
updated: 2026-11-22
draft: true
---

body
`;

const priorRow = (over = {}) => ({
  repo: "hand",
  one_line: "The last known line about this repo.",
  stack: ["Rust"],
  updated: "2026-11-01",
  pushedAt: "2026-11-01",
  draft: true,
  stale: false,
  vanished: false,
  lastSeen: null,
  ...over,
});
const previous = (row = priorRow()) => ({ measuredAt: "2026-11-22", summaries: [row] });
const account = [{ name: "hand", pushedAt: "2026-11-01" }];
const options = (fetchText) => ({
  today: "2026-11-22",
  repos: account,
  previous: previous(),
  fetchText,
});

describe("vanished repos are marked, never deleted", () => {
  test("RED PROOF: a seeded 404 keeps the row and marks it with the first missed date", async () => {
    const { record, notes } = await measure(
      options(async () => ({ status: 404, text: "" })),
    );
    expect(record.summaries).toHaveLength(1);
    const row = record.summaries[0];
    expect(row.vanished).toBe(true);
    expect(row.lastSeen).toBe("2026-11-22");
    expect(row.one_line).toBe("The last known line about this repo.");
    expect(notes.some((note) => note.startsWith("vanished hand:"))).toBe(true);
  });

  test("an already-marked row keeps its original first-missed date", async () => {
    const { record } = await measure(
      options(async () => ({ status: 404, text: "" })),
    );
    const again = await measure({
      ...options(async () => ({ status: 404, text: "" })),
      today: "2026-12-01",
      previous: previous(record.summaries[0]),
    });
    expect(again.record.summaries[0].lastSeen).toBe("2026-11-22");
  });

  test("RED PROOF: a seeded return clears the mark and restores the row", async () => {
    const marked = priorRow({ vanished: true, lastSeen: "2026-11-01" });
    const { record, notes } = await measure({
      ...options(async () => ({ status: 200, text: FRONT })),
      previous: previous(marked),
    });
    expect(record.summaries[0].vanished).toBe(false);
    expect(record.summaries[0].lastSeen).toBeNull();
    expect(notes.some((note) => note.startsWith("returned hand:"))).toBe(true);
  });

  test("a repo that leaves the account is marked without a fetch", async () => {
    let fetched = false;
    const { record, notes } = await measure({
      today: "2026-11-22",
      repos: [],
      previous: previous(),
      fetchText: async () => {
        fetched = true;
        return { status: 200, text: FRONT };
      },
    });
    expect(fetched).toBe(false);
    expect(record.summaries[0].vanished).toBe(true);
    expect(notes.some((note) => note.includes("no longer in the public account"))).toBe(true);
  });

  test("the row keeps its name and one-liner with a quiet disabled marker", () => {
    const showcase = readFileSync(resolve(root, "src", "content", "showcase.ts"), "utf8");
    const page = readFileSync(resolve(root, "src", "components", "LedgerPage.tsx"), "utf8");
    expect(showcase).toContain("unavailable since ${summary.lastSeen}");
    expect(showcase).toContain("seeded: Boolean(summary)");
    expect(page).toContain('aria-disabled={row.vanished ? "true" : undefined}');
    expect(page).toContain('<span className="b-name">{row.name}</span>');
  });
});

describe("pruning needs an explicit --yes", () => {
  function pruneFixture() {
    const dir = mkdtempSync(join(tmpdir(), "prune-policy-"));
    tempDirs.push(dir);
    const content = join(dir, "src", "content");
    mkdirSync(content, { recursive: true });
    writeFileSync(
      join(content, "repos.probe.json"),
      JSON.stringify({ measuredAt: "2026-11-22", publicRepos: 16, repos: [] }),
      "utf8",
    );
    const snapshot = {
      measuredAt: "2026-11-22",
      summaries: [
        priorRow({ repo: "gone", lastSeen: "2026-11-15", vanished: true }),
        priorRow({ repo: "hand", vanished: false, lastSeen: null }),
      ],
    };
    writeFileSync(join(content, "ai-summaries.json"), JSON.stringify(snapshot, null, 2) + "\n");
    return { dir, file: join(content, "ai-summaries.json") };
  }

  function prune(dir, args) {
    return spawnSync(process.execPath, [script, ...args], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        LEDGER_ROOT: dir,
        LEDGER_TODAY: "2026-11-22",
        LEDGER_PROBE_OFFLINE: "1",
      },
    });
  }

  test("RED PROOF: --prune names the rows and makes no change without --yes", () => {
    const { dir, file } = pruneFixture();
    const before = readFileSync(file, "utf8");
    const result = prune(dir, ["--prune"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("prune would remove 1 row(s):");
    expect(result.stdout).toContain("gone (unavailable since 2026-11-15)");
    expect(result.stdout).toContain("no change; re-run with --prune --yes");
    expect(readFileSync(file, "utf8")).toBe(before);
  });

  test("RED PROOF: --prune --yes removes only the named rows", () => {
    const { dir, file } = pruneFixture();
    const result = prune(dir, ["--prune", "--yes"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("prune: removed 1 named row(s)");
    const after = JSON.parse(readFileSync(file, "utf8"));
    expect(after.summaries.map((row) => row.repo)).toEqual(["hand"]);
    expect(after.summaries.some((row) => row.vanished)).toBe(false);
  });
});
