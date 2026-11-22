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
 * The record also carries `publicRepos`: the account's own count from
 * `gh api users/nathwn12 --jq .public_repos`. That is the figure the ledger's
 * Open Source coordinate prints. `repos.length` is the measured list used for
 * coverage and must never stand in for the account count.
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
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.env.LEDGER_ROOT
  ? resolve(process.env.LEDGER_ROOT)
  : resolve(import.meta.dirname, "..");
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
  if (process.env.LEDGER_PROBE_OFFLINE === "1") {
    throw new Error("offline: gh is disabled for this refresh");
  }
  return execFileSync("gh", args, {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
}

/**
 * The one definition of "published": public and not archived. Works on a raw
 * `gh repo list` row and on a stored record row alike, so the measurement and
 * any guard reading the record cannot drift apart.
 *
 * @param {{ visibility: string, isArchived: boolean }} repo
 */
export function isPublishedRepo(repo) {
  return repo.visibility === "PUBLIC" && repo.isArchived === false;
}

/** Every public, non-archived repository the account publishes, by name. */
function measure() {
  const listed = JSON.parse(
    gh(["repo", "list", "nathwn12", "--limit", "200", "--json", FIELDS.join(",")]),
  );
  const live = listed
    .filter(isPublishedRepo)
    .sort((a, b) => a.name.localeCompare(b.name));

  const repos = live.map((repo) => {
    let parent = null;
    if (repo.isFork) {
      const full = gh(["api", `repos/nathwn12/${repo.name}`, "--jq", ".parent.full_name // \"\""]).trim();
      parent = full || null;
    }
    return {
      name: repo.name,
      isArchived: repo.isArchived,
      visibility: repo.visibility,
      isFork: repo.isFork,
      parent,
      primaryLanguage: repo.primaryLanguage?.name ?? null,
      createdAt: repo.createdAt.slice(0, 10),
      pushedAt: repo.pushedAt.slice(0, 10),
      description: repo.description ?? "",
    };
  });

  const rawCount = gh(["api", "users/nathwn12", "--jq", ".public_repos"]).trim();
  const publicRepos = Number(rawCount);
  if (!Number.isInteger(publicRepos) || publicRepos < 0) {
    throw new Error(`probe-repos: invalid public_repos from the account: ${JSON.stringify(rawCount)}`);
  }

  const measuredAt = new Date().toISOString().slice(0, 10);
  return {
    measuredAt,
    command:
      "gh repo list nathwn12 --limit 200 --json " + FIELDS.join(","),
    accountCommand: "gh api users/nathwn12 --jq .public_repos",
    publicRepos,
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

  if (!Number.isInteger(record.publicRepos) || record.publicRepos < 0) {
    console.error("probe check failed: the record has no valid publicRepos field");
    process.exitCode = 1;
    return;
  }

  const live = measure();
  if (record.publicRepos !== live.publicRepos) {
    problems.push(`publicRepos ${record.publicRepos} -> ${live.publicRepos} on the account`);
  }
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
    `probe check ok: account reports ${record.publicRepos} public, ${record.repos.length} measured, ${record.measuredAt}, all covered by projects.ts (${omitted.length} declared omission${omitted.length === 1 ? "" : "s"})`,
  );
}

/**
 * The on-disk form of the snapshot: two-space indent, the record's insertion
 * key order, and one trailing newline. The serialized bytes are the contract,
 * so a fresh measurement that matches the committed file is not a change.
 */
export function serializeRecord(record) {
  return JSON.stringify(record, null, 2) + "\n";
}

/** Write only when the bytes differ; true if a write happened, false if no-op. */
export function writeRecordIfChanged(out, record) {
  const bytes = serializeRecord(record);
  if (existsSync(out) && readFileSync(out, "utf8") === bytes) return false;
  writeFileSync(out, bytes, "utf8");
  return true;
}

const isMain =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  if (process.argv.includes("--check")) {
    check();
  } else {
    const record = measure();
    const changed = writeRecordIfChanged(OUT, record);
    console.log(
      `measured ${record.publicRepos} public repositories (${record.repos.length} listed) on ${record.measuredAt}${changed ? " -> src/content/repos.probe.json" : "; snapshot unchanged"}`,
    );
  }
}
