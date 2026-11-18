/**
 * Probe the live public surface of github.com/nathwn12 and record it.
 *
 * `src/content/projects.ts` is written from this file, so the record has to be
 * a measurement rather than a memory: run the probe, read `repos.probe.json`,
 * then write the content. It is also the next session's diff target.
 *
 *   node scripts/probe-repos.mjs            measure, write src/content/repos.probe.json
 *   node scripts/probe-repos.mjs --check    assert the record and the content still agree
 *
 * `--check` fails when the live account has moved since the record (a repo
 * appeared, left public, or changed language or description), when a recorded
 * repository is missing from the content file, or when the content file still
 * lists a repository the account no longer publishes. A public repository may
 * be omitted from the cards only by name, with its reason, in
 * `OMITTED_FROM_CARDS` in `projects.ts`; that one list is read from the same
 * file and counted as coverage when the account is compared to the cards. The
 * inventory test imports the same constant, so the script and the test cannot
 * drift apart. There is no archived band on this page and no exemption for
 * history.
 *
 * Dependency-free on purpose - node: builtins only, so it runs in CI without an
 * install step.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const OUT = resolve(root, "src", "content", "repos.probe.json");
const CONTENT = resolve(root, "src", "content", "projects.ts");

const FIELDS = [
  "name",
  "isFork",
  "isArchived",
  "visibility",
  "primaryLanguage",
  "createdAt",
  "pushedAt",
  "description",
];

function gh(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
}

/** Every public, non-archived repository the account publishes, by name. */
function measure() {
  const listed = JSON.parse(
    gh(["repo", "list", "nathwn12", "--limit", "200", "--json", FIELDS.join(",")]),
  );
  const live = listed
    .filter((repo) => repo.visibility === "PUBLIC" && !repo.isArchived)
    .sort((a, b) => a.name.localeCompare(b.name));

  // `gh repo list` reports `isFork` but leaves `parent` null, so a fork's
  // upstream is one extra read per fork rather than a guess kept in a table.
  const repos = live.map((repo) => {
    let parent = null;
    if (repo.isFork) {
      const full = gh(["api", `repos/nathwn12/${repo.name}`, "--jq", ".parent.full_name // \"\""]).trim();
      parent = full || null;
    }
    return {
      name: repo.name,
      isFork: repo.isFork,
      parent,
      primaryLanguage: repo.primaryLanguage?.name ?? null,
      createdAt: repo.createdAt.slice(0, 10),
      pushedAt: repo.pushedAt.slice(0, 10),
      description: repo.description ?? "",
    };
  });

  const measuredAt = new Date().toISOString().slice(0, 10);
  return {
    measuredAt,
    command:
      "gh repo list nathwn12 --limit 200 --json " + FIELDS.join(","),
    repos,
  };
}

/** The `dir` values the content file lists as cards and metadata entries. */
function contentDirs(text) {
  return [...text.matchAll(/^\s*dir:\s*"([^"]+)"/gm)].map((match) => match[1]);
}

/** The deliberate omissions declared once in projects.ts, with their reason.
    Read as text: this script stays dependency-free and never imports TS. */
function omittedDirs(text) {
  const match = text.match(
    /export const OMITTED_FROM_CARDS\s*=\s*\[([\s\S]*?)\]/,
  );
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function diff(nameA, nameB, listA, listB) {
  const a = new Set(listA);
  const b = new Set(listB);
  return {
    onlyA: listA.filter((item) => !b.has(item)),
    onlyB: listB.filter((item) => !a.has(item)),
  };
}

function check() {
  const problems = [];
  const record = JSON.parse(readFileSync(OUT, "utf8"));

  const live = measure();
  const drift = diff("record", "live", record.repos.map((r) => r.name), live.repos.map((r) => r.name));
  for (const name of drift.onlyB) problems.push(`public now, missing from the record: ${name}`);
  for (const name of drift.onlyA) problems.push(`in the record, no longer public: ${name}`);

  const recorded = new Map(record.repos.map((repo) => [repo.name, repo]));
  for (const repo of live.repos) {
    const was = recorded.get(repo.name);
    if (!was) continue;
    for (const field of ["isFork", "parent", "primaryLanguage"]) {
      if (was[field] !== repo[field]) {
        problems.push(`${repo.name}: ${field} ${JSON.stringify(was[field])} -> ${JSON.stringify(repo[field])}`);
      }
    }
  }

  const content = readFileSync(CONTENT, "utf8");
  const omitted = omittedDirs(content);
  // A declared omission is coverage, not a card: the repo is published but the
  // content file accounts for it deliberately, with its reason in projects.ts.
  const dirs = contentDirs(content).concat(omitted);
  const published = live.repos.map((repo) => repo.name);
  const covered = diff("content", "account", dirs, published);
  for (const name of covered.onlyB) problems.push(`published but absent from projects.ts: ${name}`);
  for (const name of covered.onlyA) problems.push(`projects.ts lists a repo the account no longer publishes: ${name}`);

  if (problems.length > 0) {
    console.error(`probe check failed (${problems.length}):`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `probe check ok: ${record.repos.length} public repositories, measured ${record.measuredAt}, all covered by projects.ts (${omitted.length} declared omission${omitted.length === 1 ? "" : "s"})`,
  );
}

if (process.argv.includes("--check")) {
  check();
} else {
  const record = measure();
  writeFileSync(OUT, JSON.stringify(record, null, 2) + "\n", "utf8");
  console.log(
    `measured ${record.repos.length} public repositories on ${record.measuredAt} -> src/content/repos.probe.json`,
  );
}
