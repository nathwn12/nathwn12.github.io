#!/usr/bin/env node
/**
 * Refresh the committed snapshots only on the weekly floor or on --force.
 *
 * A normal build never needs the network: the committed snapshot is the render
 * source, so builds are offline and reproducible. A snapshot at least seven
 * days old, or an explicit `--force`, reaches the probes. External failure
 * (network, 404, account drift) keeps the last snapshot, flags it, prints its
 * date and exits 0. Local failure (missing file, malformed JSON, missing
 * required key) is a hard build error with a named message.
 *
 *   node scripts/refresh-repos.mjs              build path, floor decides
 *   node scripts/refresh-repos.mjs --force      weekly action / repo push
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const FLOOR_DAYS = 7;
const root = process.env.LEDGER_ROOT
  ? resolve(process.env.LEDGER_ROOT)
  : resolve(import.meta.dirname, "..");
const repoFile = resolve(root, "src", "content", "repos.probe.json");
const summaryFile = resolve(root, "src", "content", "ai-summaries.json");
const repoProbe = resolve(import.meta.dirname, "probe-repos.mjs");
const summaryProbe = resolve(import.meta.dirname, "probe-summaries.mjs");

const REPO_KEYS = ["measuredAt", "publicRepos", "repos"];
const SUMMARY_KEYS = ["measuredAt", "summaries"];
const SUMMARY_ROW_KEYS = ["repo", "one_line", "updated"];

export function isoDate(today = new Date()) {
  return today.toISOString().slice(0, 10);
}

/** Whole days between two ISO dates. A future date is clamped to zero. */
export function ageDays(measuredAt, today) {
  const then = Date.parse(`${measuredAt}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(then) || !Number.isFinite(now)) {
    throw new Error(`refresh: invalid snapshot date ${JSON.stringify(measuredAt)}`);
  }
  return Math.max(0, Math.round((now - then) / 86_400_000));
}

export function shouldRefresh(record, { today = isoDate(), force = false } = {}) {
  return force || ageDays(record.measuredAt, today) >= FLOOR_DAYS;
}

/** Local corruption is the only hard failure. The message names the fault. */
export function assertSnapshot(record, label, keys, rows) {
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    throw new Error(`${label}: malformed snapshot, expected an object`);
  }
  for (const key of keys) {
    if (!(key in record)) throw new Error(`${label}: missing required key ${key}`);
  }
  if (rows) {
    if (!Array.isArray(record[rows.key])) {
      throw new Error(`${label}: ${rows.key} is not an array`);
    }
    for (const row of record[rows.key]) {
      for (const key of rows.keys) {
        if (row === null || typeof row !== "object" || !(key in row)) {
          throw new Error(`${label}: ${rows.key} row missing required key ${key}`);
        }
      }
    }
  }
}

export function readSnapshot(file, label, keys, rows) {
  if (!existsSync(file)) throw new Error(`${label}: missing file ${file}`);
  let record;
  try {
    record = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`${label}: malformed JSON (${String(error.message).split("\n")[0]})`);
  }
  assertSnapshot(record, label, keys, rows);
  return record;
}

function runProbe(script) {
  process.stdout.write(
    execFileSync(process.execPath, [script], { cwd: root, encoding: "utf8" }),
  );
}

/** External failure keeps the committed record and prints its date. */
function keep(record, label, reason) {
  console.warn(
    `WARN [external] ${label} failed (${reason}); keeping committed snapshot measured ${record.measuredAt}`,
  );
}

export function main({
  today = process.env.LEDGER_TODAY || isoDate(),
  force = process.argv.includes("--force"),
} = {}) {
  const repos = readSnapshot(repoFile, "repos.probe.json", REPO_KEYS);
  const summaries = readSnapshot(summaryFile, "ai-summaries.json", SUMMARY_KEYS, {
    key: "summaries",
    keys: SUMMARY_ROW_KEYS,
  });
  const days = ageDays(summaries.measuredAt, today);

  if (!shouldRefresh(summaries, { today, force })) {
    console.log(
      `refresh: snapshot measured ${summaries.measuredAt} is ${days} day${days === 1 ? "" : "s"} old; weekly floor of ${FLOOR_DAYS} not reached, no network`,
    );
    return;
  }

  console.log(
    `refresh: ${force ? "--force" : `weekly floor reached after ${days} days`}; probing committed snapshot measured ${summaries.measuredAt}`,
  );
  try {
    runProbe(repoProbe);
  } catch (error) {
    keep(repos, "repo probe", String(error.message || error.stderr || error).trim().split("\n")[0]);
  }
  runProbe(summaryProbe);
}

const isMain =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) main();
