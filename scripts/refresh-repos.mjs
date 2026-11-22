#!/usr/bin/env node
/**
 * Build-path refresh for the committed repo snapshot.
 *
 * Runs the existing probe before a build so a shipped count cannot be stale.
 * A network or auth failure keeps the last committed snapshot and prints the
 * date it carries: no freshness is invented. A committed snapshot without a
 * valid account count is a hard failure, so the build never renders a guess.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const snapshot = resolve(root, "src", "content", "repos.probe.json");
const probe = resolve(root, "scripts", "probe-repos.mjs");

try {
  process.stdout.write(
    execFileSync(process.execPath, [probe], { cwd: root, encoding: "utf8" }),
  );
} catch (error) {
  const reason = String(error.message || error.stderr || error).trim().split("\n")[0];
  const record = JSON.parse(readFileSync(snapshot, "utf8"));
  if (!Number.isInteger(record.publicRepos) || record.publicRepos < 0) {
    throw new Error(
      `probe failed (${reason}) and the committed snapshot has no valid publicRepos; refusing to build a guess`,
    );
  }
  console.warn(
    `probe failed (${reason}); keeping committed snapshot measured ${record.measuredAt} (${record.publicRepos} public repos)`,
  );
}
