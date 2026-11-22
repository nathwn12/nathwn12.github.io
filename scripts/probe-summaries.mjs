/**
 * Probe the 16 published `ai/llms.txt` machine summaries and record them.
 *
 * `src/content/ai-summaries.json` is the committed render source: this script
 * is the only writer, it fetches no network at render time, and it writes only
 * when the serialized bytes changed (the same contract as probe-repos.mjs).
 *
 *   node scripts/probe-summaries.mjs            measure and write the snapshot
 *
 * Each repo states its own case in YAML front matter. The zod schema below is
 * the boundary: a file that cannot supply the required keys is not a summary
 * and is named in the log, never rendered as one. A fetch that fails for a
 * reason other than 404 keeps the last committed snapshot and prints its date:
 * no freshness is invented for a file that could not be read.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { writeRecordIfChanged } from "./probe-repos.mjs";

const root = process.env.LEDGER_ROOT
  ? resolve(process.env.LEDGER_ROOT)
  : resolve(import.meta.dirname, "..");
export const OUT = resolve(root, "src", "content", "ai-summaries.json");
const REPOS = resolve(root, "src", "content", "repos.probe.json");
const RAW = (repo) =>
  `https://raw.githubusercontent.com/nathwn12/${repo}/HEAD/ai/llms.txt`;

/** Every key in the planted front matter is required. `updated` and `draft`
 *  carry the staleness and seed facts, so a missing one is not a summary. */
export const frontMatterSchema = z.object({
  project: z.string().min(1),
  one_line: z.string().min(1),
  stack: z.array(z.string().min(1)),
  status: z.string().min(1),
  since: z.string().min(1),
  capabilities: z.array(z.string()),
  limits: z.array(z.string()),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
  draft: z.boolean(),
});

const unquote = (value) => {
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  return value;
};

/** The front matter is flat: scalar values and inline `[]` lists only. */
function parseScalar(raw) {
  if (raw.startsWith("[") && raw.endsWith("]")) {
    const inner = raw.slice(1, -1).trim();
    return inner ? inner.split(",").map((item) => unquote(item.trim())) : [];
  }
  if (raw === "true") return true;
  if (raw === "false") return false;
  return unquote(raw);
}

/** Parse and validate one file. Throws a named error on malformed front matter. */
export function parseFrontMatter(text) {
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
  if (lines[0]?.trim() !== "---") {
    throw new Error("ai/llms.txt: no opening front-matter fence");
  }
  const end = lines.indexOf("---", 1);
  if (end < 0) throw new Error("ai/llms.txt: no closing front-matter fence");
  const data = {};
  for (const line of lines.slice(1, end)) {
    if (!line.trim()) continue;
    const at = line.indexOf(":");
    if (at <= 0) throw new Error(`ai/llms.txt: bad front-matter line: ${line}`);
    data[line.slice(0, at).trim()] = parseScalar(line.slice(at + 1).trim());
  }
  const parsed = frontMatterSchema.safeParse(data);
  if (!parsed.success) {
    const keys = parsed.error.issues
      .map((issue) => issue.path.join(".") || "root")
      .join(", ");
    throw new Error(`ai/llms.txt: invalid front matter (${keys})`);
  }
  return parsed.data;
}

/** A summary is stale when its own `updated` date precedes the repo's push.
 *  ISO date strings compare lexicographically, which is also chronological. */
export function computeStale(updated, pushedAt) {
  const date = /^\d{4}-\d{2}-\d{2}$/;
  if (!date.test(updated) || !date.test(pushedAt || "")) return false;
  return updated < pushedAt;
}

/** Network is the only external dependency. Injected by tests with a seed. */
export async function defaultFetchText(repo) {
  if (process.env.LEDGER_PROBE_OFFLINE === "1") {
    throw new Error("offline: fetch is disabled for this refresh");
  }
  const response = await fetch(RAW(repo), {
    headers: { "user-agent": "nathwn12-portfolio-summary-probe" },
  });
  if (response.status === 404) return { status: 404, text: "" };
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { status: 200, text: await response.text() };
}

export function isoDate(today = new Date()) {
  return today.toISOString().slice(0, 10);
}

/** Measure every repo. `fetchText` seeds a 404 or a malformed file in tests.
 *  A non-404 fetch failure rejects the whole measurement: the caller keeps
 *  the last committed snapshot instead of inventing a fresh one. */
export async function measure({ fetchText = defaultFetchText, today } = {}) {
  const record = JSON.parse(readFileSync(REPOS, "utf8"));
  const pushed = new Map(record.repos.map((repo) => [repo.name, repo.pushedAt]));
  const measuredAt = today ?? isoDate();
  const notes = [];
  const results = await Promise.all(
    [...pushed.keys()].sort().map(async (repo) => {
      let response;
      try {
        response = await fetchText(repo);
      } catch (error) {
        const reason = String(error.message || error).split("\n")[0];
        throw new Error(`fetch failed for ${repo}: ${reason}`);
      }
      if (response.status === 404) {
        notes.push(`skip ${repo}: ai/llms.txt not found (404)`);
        return null;
      }
      let front;
      try {
        front = parseFrontMatter(response.text);
      } catch (error) {
        notes.push(`skip ${repo}: ${String(error.message || error).split("\n")[0]}`);
        return null;
      }
      return {
        repo,
        ...front,
        pushedAt: pushed.get(repo),
        stale: computeStale(front.updated, pushed.get(repo)),
      };
    }),
  );
  return {
    record: { measuredAt, summaries: results.filter(Boolean) },
    notes,
  };
}

export function readCommitted() {
  if (!existsSync(OUT)) return null;
  return JSON.parse(readFileSync(OUT, "utf8"));
}

const isMain =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  const committed = readCommitted();
  try {
    const { record, notes } = await measure();
    for (const note of notes) console.log(`probe-summaries: ${note}`);
    const changed = writeRecordIfChanged(OUT, record);
    console.log(
      `measured ${record.summaries.length} machine summaries on ${record.measuredAt}${changed ? ` -> ${OUT}` : "; snapshot unchanged"}`,
    );
  } catch (error) {
    const reason = String(error.message || error).trim().split("\n")[0];
    const date = committed?.measuredAt ?? "no committed snapshot";
    console.warn(
      `probe-summaries: fetch failed (${reason}); keeping committed snapshot measured ${date}`,
    );
  }
}
