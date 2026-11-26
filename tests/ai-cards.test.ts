/**
 * The ai/ shelf is generated from committed snapshots, never from a live
 * probe. Green proof on the committed cards, RED proof on planted drift and
 * stray files in a temp root, and a scope proof on both committing workflows.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { parseFrontMatter } from "../scripts/probe-summaries.mjs";

const root = resolve(import.meta.dirname, "..");
const generator = resolve(root, "scripts", "gen-ai-cards.mjs");
const copier = resolve(root, "scripts", "prerender-ai.mjs");
const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function read(relative: string) {
  return readFileSync(resolve(root, relative), "utf8");
}

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "ai-cards-"));
  tempDirs.push(dir);
  const content = join(dir, "src", "content");
  mkdirSync(content, { recursive: true });
  mkdirSync(join(dir, "ai"), { recursive: true });
  mkdirSync(join(dir, "dist"), { recursive: true });
  writeFileSync(
    join(content, "repos.probe.json"),
    JSON.stringify({
      measuredAt: "2026-11-22",
      publicRepos: 1,
      repos: [
        {
          name: "demo",
          visibility: "PUBLIC",
          isArchived: false,
          isFork: false,
          parent: null,
          primaryLanguage: "Rust",
          createdAt: "2026-11-01",
          pushedAt: "2026-11-22",
          description: "A demo repository.",
        },
      ],
    }),
  );
  writeFileSync(
    join(content, "ai-summaries.json"),
    JSON.stringify({
      measuredAt: "2026-11-22",
      summaries: [
        {
          repo: "demo",
          project: "demo",
          one_line: "A demo in its own words.",
          stack: ["Rust"],
          status: "draft",
          since: "2026-11",
          capabilities: [],
          limits: [],
          updated: "2026-11-22",
          draft: true,
          pushedAt: "2026-11-22",
          stale: false,
          vanished: false,
          lastSeen: null,
        },
      ],
    }),
  );
  writeFileSync(
    join(content, "open-source-stats.json"),
    JSON.stringify({
      snapshotDate: "2026-11-19",
      packages: [{ name: "demo-mcp", month: 3, allTime: 9 }],
    }),
  );
  writeFileSync(
    join(content, "projects.ts"),
    [
      "export const projects: ProjectLore[] = [",
      "  {",
      '    dir: "demo",',
      '    npm: "demo-mcp",',
      '    tech: ["Rust", "MCP"],',
      "  },",
      "];",
    ].join("\n"),
  );
  return dir;
}

function run(dir: string, script: string, args: string[] = []) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, LEDGER_ROOT: dir },
  });
}

describe("the committed ai cards", () => {
  test("one JSON and one Markdown card per public repository, plus an index", () => {
    const index = JSON.parse(read("ai/index.json"));
    const record = JSON.parse(read("src/content/repos.probe.json"));
    const published = record.repos
      .filter((repo: { visibility: string; isArchived: boolean }) => repo.visibility === "PUBLIC" && !repo.isArchived)
      .map((repo: { name: string }) => repo.name)
      .sort();
    expect(index.schema).toBe("nathwn12/ai-index/1");
    expect(index.publicRepos).toBe(record.publicRepos);
    expect(index.cards).toBe(published.length);
    expect(index.repos.map((row: { name: string }) => row.name)).toEqual(published);
    for (const name of published) {
      const card = JSON.parse(read("ai/" + name + ".json"));
      expect(card.schema).toBe("nathwn12/ai-card/1");
      expect(card.project).toBe(name);
      expect(card.url).toBe("https://github.com/nathwn12/" + name);
      expect(index.repos.some((row: { json: string }) => row.json === "ai/" + name + ".json")).toBe(true);
      expect(read("ai/" + name + ".md").startsWith("---\n")).toBe(true);
      expect(JSON.stringify(card)).not.toMatch(/stars?/i);
    }
  });

  test("figures are copied from the snapshots, with no invented npm count", () => {
    const stats = JSON.parse(read("src/content/open-source-stats.json"));
    const record = JSON.parse(read("src/content/repos.probe.json"));
    const byRepo = new Map(record.repos.map((repo: { name: string }) => [repo.name, repo]));
    const index = JSON.parse(read("ai/index.json"));
    for (const entry of index.repos) {
      const card = JSON.parse(read(entry.json));
      const repo = byRepo.get(card.project)!;
      expect(card.description).toBe(repo.description);
      expect(card.language).toBe(repo.primaryLanguage);
      expect(card.dates).toEqual({ createdAt: repo.createdAt, pushedAt: repo.pushedAt });
      if (card.npm) {
        const measured = stats.packages.find((row: { name: string }) => row.name === card.npm.name);
        expect(measured).toBeDefined();
        expect(card.npm.month).toBe(measured.month);
        expect(card.npm.allTime).toBe(measured.allTime);
        expect(card.npm.snapshotDate).toBe(stats.snapshotDate);
      }
    }
  });

  test("each Markdown front matter is a valid summary and agrees with its JSON", () => {
    const index = JSON.parse(read("ai/index.json"));
    for (const entry of index.repos) {
      const card = JSON.parse(read(entry.json));
      const md = read(entry.md);
      const front = parseFrontMatter(md);
      expect(front.project).toBe(card.project);
      expect(front.one_line).toBe(card.one_line);
      expect(front.stack).toEqual(card.stack);
      expect(front.updated).toBe(card.updated);
      expect(front.draft).toBe(card.draft);
      expect(md).toContain("# " + card.project);
      expect(md).toContain(card.one_line);
    }
  });
});

describe("the generator contract", () => {
  test("GREEN: a fresh generation is byte-stable and --check passes twice", () => {
    const dir = fixture();
    expect(run(dir, generator).status).toBe(0);
    const first = run(dir, generator, ["--check"]);
    expect(first.status).toBe(0);
    expect(first.stdout).toContain("3 generated files match");
    expect(run(dir, generator, ["--check"]).status).toBe(0);
  });

  test("RED PROOF: planted drift and a stray card are named and fail --check", () => {
    const dir = fixture();
    expect(run(dir, generator).status).toBe(0);
    const card = join(dir, "ai", "demo.json");
    writeFileSync(card, readFileSync(card, "utf8") + " ", "utf8");
    const drift = run(dir, generator, ["--check"]);
    expect(drift.status).toBe(1);
    expect(drift.stderr).toContain("drifted card: ai/demo.json");
    expect(run(dir, generator).status).toBe(0);
    writeFileSync(join(dir, "ai", "stray.md"), "not generated", "utf8");
    const stray = run(dir, generator, ["--check"]);
    expect(stray.status).toBe(1);
    expect(stray.stderr).toContain("stray card: ai/stray.md");
  });

  test("the dist copy is committed bytes only, and stale dist files die", () => {
    const dir = fixture();
    expect(run(dir, generator).status).toBe(0);
    mkdirSync(join(dir, "dist", "ai"), { recursive: true });
    writeFileSync(join(dir, "dist", "ai", "old.md"), "stale", "utf8");
    expect(run(dir, copier).status).toBe(0);
    expect(readFileSync(join(dir, "dist", "ai", "demo.json"), "utf8")).toBe(
      readFileSync(join(dir, "ai", "demo.json"), "utf8"),
    );
    expect(existsSync(join(dir, "dist", "ai", "index.json"))).toBe(true);
    expect(existsSync(join(dir, "dist", "ai", "old.md"))).toBe(false);
  });
});

describe("commit scope", () => {
  test("the stats workflow keeps manual dispatch, a six-hour cron and stats-only git add", () => {
    const yaml = read(".github/workflows/open-source-stats.yml");
    expect(yaml).toMatch(/cron:\s*'0 \*\/6 \* \* \*'/);
    expect(yaml).toContain("workflow_dispatch:");
    expect(yaml).toContain("git add src/content/npm-downloads.json src/content/open-source-stats.json");
    expect(yaml).not.toMatch(/git add[\s\S]*\bai\//);
    expect(yaml).not.toMatch(/git add[\s\S]*src\/(?!content)/);
  });

  test("the ai-cards workflow commits only generated cards", () => {
    const yaml = read(".github/workflows/ai-cards.yml");
    expect(yaml).toMatch(/cron:\s*'30 \*\/6 \* \* \*'/);
    expect(yaml).toContain("workflow_dispatch:");
    expect(yaml).toContain("git add ai/*.json ai/*.md");
    expect(yaml).not.toMatch(/git add[\s\S]*src\//);
    expect(yaml).toContain("node scripts/gen-ai-cards.mjs --check");
  });
});
