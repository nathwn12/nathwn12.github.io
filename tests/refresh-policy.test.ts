/**
 * Weekly floor, force path, external degradation and local corruption.
 * Fixtures live in temp roots; no test reaches the network or the real files.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  ageDays,
  assertSnapshot,
  shouldRefresh,
} from "../scripts/refresh-repos.mjs";

const root = resolve(import.meta.dirname, "..");
const script = resolve(root, "scripts", "refresh-repos.mjs");
const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function fixture(measuredAt = "2026-11-22") {
  const dir = mkdtempSync(join(tmpdir(), "refresh-policy-"));
  tempDirs.push(dir);
  const content = join(dir, "src", "content");
  mkdirSync(content, { recursive: true });
  writeFileSync(
    join(content, "repos.probe.json"),
    JSON.stringify({ measuredAt, publicRepos: 16, repos: [] }),
    "utf8",
  );
  writeFileSync(
    join(content, "ai-summaries.json"),
    JSON.stringify({
      measuredAt,
      summaries: [{ repo: "hand", one_line: "A repo speaks.", updated: measuredAt }],
    }),
    "utf8",
  );
  return dir;
}

function run(dir: string, args: string[] = [], extra: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      LEDGER_ROOT: dir,
      LEDGER_TODAY: "2026-11-22",
      LEDGER_PROBE_OFFLINE: "1",
      ...extra,
    },
  });
}

describe("the weekly floor", () => {
  test("a fresh snapshot is not refreshed; age and force open the gate", () => {
    expect(ageDays("2026-11-15", "2026-11-22")).toBe(7);
    expect(ageDays("2026-11-22", "2026-11-22")).toBe(0);
    expect(shouldRefresh({ measuredAt: "2026-11-22" }, { today: "2026-11-22" })).toBe(false);
    expect(shouldRefresh({ measuredAt: "2026-11-22" }, { today: "2026-11-29" })).toBe(true);
    expect(shouldRefresh({ measuredAt: "2026-11-22" }, { force: true, today: "2026-11-22" })).toBe(true);
  });

  test("a normal build is offline and prints the snapshot date", () => {
    const result = run(fixture());
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("snapshot measured 2026-11-22 is 0 days old");
    expect(result.stdout).toContain("no network");
    expect(result.stdout + result.stderr).not.toContain("WARN [external]");
  });

  test("RED PROOF: a stale-but-valid cache builds, flags the failure and prints its date", () => {
    const result = run(fixture("2026-11-01"));
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("weekly floor reached after 21 days");
    expect(result.stdout + result.stderr).toContain("WARN [external]");
    expect(result.stdout + result.stderr).toContain("keeping committed snapshot measured 2026-11-01");
  });

  test("--force reaches the probes even when the snapshot is fresh", () => {
    const result = run(fixture(), ["--force"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("--force");
    expect(result.stdout + result.stderr).toContain("keeping committed snapshot measured 2026-11-22");
  });
});

describe("local corruption is the only hard failure", () => {
  test("RED PROOF: missing file, malformed JSON and missing keys each name the fault", () => {
    const missing = fixture();
    rmSync(join(missing, "src", "content", "ai-summaries.json"));
    const missingRun = run(missing);
    expect(missingRun.status).not.toBe(0);
    expect(missingRun.stderr).toContain("ai-summaries.json: missing file");

    const malformed = fixture();
    writeFileSync(join(malformed, "src", "content", "ai-summaries.json"), "{oops", "utf8");
    const malformedRun = run(malformed);
    expect(malformedRun.status).not.toBe(0);
    expect(malformedRun.stderr).toContain("ai-summaries.json: malformed JSON");

    const noKeys = fixture();
    writeFileSync(
      join(noKeys, "src", "content", "ai-summaries.json"),
      JSON.stringify({ summaries: [] }),
      "utf8",
    );
    const keyRun = run(noKeys);
    expect(keyRun.status).not.toBe(0);
    expect(keyRun.stderr).toContain("ai-summaries.json: missing required key measuredAt");
  });

  test("a summary row missing its one_line is named, not guessed", () => {
    expect(() =>
      assertSnapshot(
        { measuredAt: "2026-11-22", summaries: [{ repo: "hand" }] },
        "ai-summaries.json",
        ["measuredAt", "summaries"],
        { key: "summaries", keys: ["repo", "one_line"] },
      ),
    ).toThrow(/summaries row missing required key one_line/);
  });
});
