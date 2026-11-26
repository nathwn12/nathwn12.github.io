#!/usr/bin/env node
/**
 * Generate one machine card per published public repository into ai/.
 *
 * The committed snapshots are the only input: repos.probe.json (identity,
 * language, dates), ai-summaries.json (each repo's own words), the case-study
 * tokens and npm mapping in projects.ts, and open-source-stats.json (npm
 * counts). No network, no DOM, no application rewrite. ai/llms.txt is this
 * site's own summary and is never touched here.
 *
 *   node scripts/gen-ai-cards.mjs           write only changed files
 *   node scripts/gen-ai-cards.mjs --check   fail on drift or stray cards
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const CARD_SCHEMA = "nathwn12/ai-card/1";
export const INDEX_SCHEMA = "nathwn12/ai-index/1";

const root = process.env.LEDGER_ROOT
  ? resolve(process.env.LEDGER_ROOT)
  : resolve(import.meta.dirname, "..");

const paths = {
  repos: resolve(root, "src", "content", "repos.probe.json"),
  summaries: resolve(root, "src", "content", "ai-summaries.json"),
  stats: resolve(root, "src", "content", "open-source-stats.json"),
  projects: resolve(root, "src", "content", "projects.ts"),
  ai: resolve(root, "ai"),
};

function readJson(file, label) {
  if (!existsSync(file)) throw new Error(label + ": missing file " + file);
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(label + ": malformed JSON (" + String(error.message).split("\n")[0] + ")");
  }
}

/**
 * Read the declared topics and npm package name from the committed content
 * module as text. This script stays dependency-free and never imports TS: a
 * project object is a two-space-indented block in the projects array.
 */
export function readProjects(text) {
  const marker = "export const projects: ProjectLore[] = [";
  const open = text.indexOf(marker);
  if (open < 0) throw new Error("projects.ts: no projects array");
  const start = open + marker.length;
  const end = text.indexOf("\n];", start);
  if (end < 0) throw new Error("projects.ts: unterminated projects array");
  const rows = text.slice(start, end).match(/\n  \{[\s\S]*?\n  \},/g) ?? [];
  const parsed = rows.map((row) => {
    const dir = /\bdir:\s*"([^"]+)"/.exec(row)?.[1];
    if (!dir) throw new Error("projects.ts: a project row has no dir");
    const npm = /\bnpm:\s*"([^"]+)"/.exec(row)?.[1] ?? null;
    const tech = /\btech:\s*\[([\s\S]*?)\]/.exec(row)?.[1] ?? "";
    return {
      dir,
      npm,
      tech: [...tech.matchAll(/"([^"]+)"/g)].map((match) => match[1]),
    };
  });
  if (parsed.length === 0) throw new Error("projects.ts: no project rows");
  return parsed;
}

/** Every figure in a card is copied from a snapshot; nothing is inferred. */
export function buildCards({ repos, summaries, stats, projects }) {
  if (!Array.isArray(repos?.repos)) throw new Error("repos.probe.json: repos is not an array");
  if (!Array.isArray(summaries?.summaries)) throw new Error("ai-summaries.json: summaries is not an array");
  if (!Array.isArray(stats?.packages)) throw new Error("open-source-stats.json: packages is not an array");
  if (!Array.isArray(projects)) throw new Error("projects.ts: no project rows");

  const summaryBy = new Map(summaries.summaries.map((row) => [row.repo, row]));
  const statBy = new Map(stats.packages.map((row) => [row.name, row]));
  const projectBy = new Map(projects.map((row) => [row.dir, row]));
  const published = repos.repos.filter(
    (repo) => repo.visibility === "PUBLIC" && repo.isArchived === false,
  );
  if (published.length === 0) throw new Error("repos.probe.json: no published repositories");

  const measuredAt = {
    repos: repos.measuredAt,
    summaries: summaries.measuredAt,
    stats: stats.snapshotDate,
  };

  const cards = published
    .map((repo) => {
      const summary = summaryBy.get(repo.name) ?? null;
      const project = projectBy.get(repo.name) ?? null;
      const npmName = project?.npm ?? null;
      const npmStat = npmName ? statBy.get(npmName) ?? null : null;
      return {
        schema: CARD_SCHEMA,
        project: repo.name,
        url: "https://github.com/nathwn12/" + repo.name,
        one_line: summary?.one_line ?? repo.description,
        description: repo.description,
        language: repo.primaryLanguage,
        isFork: repo.isFork,
        parent: repo.parent,
        topics: project?.tech?.length ? [...project.tech] : [...(summary?.stack ?? [])],
        stack: summary ? [...summary.stack] : [],
        capabilities: summary ? [...summary.capabilities] : [],
        limits: summary ? [...summary.limits] : [],
        status: summary?.status ?? "draft",
        since: summary?.since ?? repo.createdAt.slice(0, 7),
        updated: summary?.updated ?? repos.measuredAt,
        draft: summary?.draft ?? true,
        stale: summary?.stale ?? false,
        vanished: summary?.vanished ?? false,
        npm:
          npmName && npmStat
            ? {
                name: npmName,
                month: npmStat.month,
                allTime: npmStat.allTime,
                snapshotDate: stats.snapshotDate,
              }
            : null,
        dates: { createdAt: repo.createdAt, pushedAt: repo.pushedAt },
        measuredAt,
      };
    })
    .sort((a, b) => a.project.localeCompare(b.project));

  const index = {
    schema: INDEX_SCHEMA,
    owner: "nathwn12",
    site: "https://nathwn12.github.io",
    publicRepos: repos.publicRepos,
    cards: cards.length,
    measuredAt,
    repos: cards.map((card) => ({
      name: card.project,
      json: "ai/" + card.project + ".json",
      md: "ai/" + card.project + ".md",
    })),
  };

  return { cards, index };
}

/** Front matter mirrors the shape probe-summaries.mjs already validates. */
export function renderMarkdown(card) {
  const list = (values) => "[" + values.join(", ") + "]";
  const lines = [
    "---",
    "project: " + card.project,
    "repo: " + card.project,
    "url: " + card.url,
    "one_line: " + card.one_line,
    "stack: " + list(card.stack),
    "topics: " + list(card.topics),
    "language: " + String(card.language ?? ""),
    "status: " + card.status,
    "since: " + card.since,
    "capabilities: " + list(card.capabilities),
    "limits: " + list(card.limits),
    "updated: " + card.updated,
    "draft: " + String(card.draft),
    "measured: " + card.measuredAt.repos,
    "stale: " + String(card.stale),
    "vanished: " + String(card.vanished),
    "---",
    "",
    "# " + card.project,
    "",
    card.one_line,
    "",
    "GitHub description: " + card.description,
    "",
  ];
  if (card.isFork && card.parent) lines.push("Fork of " + card.parent + ".", "");
  if (card.npm) {
    lines.push(
      "npm: " +
        card.npm.name +
        " — 30-day " +
        card.npm.month +
        ", all-time " +
        card.npm.allTime +
        " (snapshot " +
        card.npm.snapshotDate +
        ").",
      "",
    );
  } else {
    lines.push("npm: no published package in the committed snapshot.", "");
  }
  lines.push(
    "Measured: repos " +
      card.measuredAt.repos +
      " · summaries " +
      card.measuredAt.summaries +
      " · stats " +
      card.measuredAt.stats +
      ". Schema " +
      card.schema +
      ".",
    "",
  );
  return lines.join("\n");
}

/** Deterministic bytes: two-space JSON, one trailing newline, sorted names. */
export function renderFiles(record) {
  const files = new Map();
  for (const card of record.cards) {
    files.set("ai/" + card.project + ".json", JSON.stringify(card, null, 2) + "\n");
    files.set("ai/" + card.project + ".md", renderMarkdown(card));
  }
  files.set("ai/index.json", JSON.stringify(record.index, null, 2) + "\n");
  return files;
}

function loadInputs() {
  return {
    repos: readJson(paths.repos, "repos.probe.json"),
    summaries: readJson(paths.summaries, "ai-summaries.json"),
    stats: readJson(paths.stats, "open-source-stats.json"),
    projects: readProjects(readFileSync(paths.projects, "utf8")),
  };
}

function writeFiles(files) {
  const changed = [];
  for (const [relative, bytes] of files) {
    const absolute = resolve(root, relative);
    if (existsSync(absolute) && readFileSync(absolute, "utf8") === bytes) continue;
    writeFileSync(absolute, bytes, "utf8");
    changed.push(relative);
  }
  return changed;
}

function checkFiles(files) {
  const problems = [];
  for (const [relative, bytes] of files) {
    const absolute = resolve(root, relative);
    if (!existsSync(absolute)) {
      problems.push("missing card: " + relative);
      continue;
    }
    if (readFileSync(absolute, "utf8") !== bytes) {
      problems.push("drifted card: " + relative);
    }
  }
  const expected = new Set([...files.keys()].map((name) => name.slice(3)));
  for (const name of readdirSync(paths.ai).sort()) {
    if (!/\.(json|md)$/.test(name)) continue;
    if (name === "llms.txt" || expected.has(name)) continue;
    problems.push("stray card: ai/" + name);
  }
  return problems;
}

function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((arg) => arg !== "--check");
  if (unknown.length > 0) {
    process.stderr.write("gen-ai-cards: unknown argument: " + unknown[0] + "\n");
    process.exitCode = 2;
    return;
  }
  const files = renderFiles(buildCards(loadInputs()));
  if (args.includes("--check")) {
    const problems = checkFiles(files);
    for (const problem of problems) process.stderr.write("gen-ai-cards: " + problem + "\n");
    if (problems.length > 0) {
      process.exitCode = 1;
      return;
    }
    console.log("ai cards ok: " + files.size + " generated files match the committed snapshots");
    return;
  }
  const changed = writeFiles(files);
  console.log(
    "generated " +
      files.size +
      " ai files from committed snapshots" +
      (changed.length ? " (" + changed.length + " changed)" : "; all unchanged"),
  );
}

const isMain =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) main();
