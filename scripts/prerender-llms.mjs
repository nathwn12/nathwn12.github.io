/**
 * Emit the site's machine description from the same committed snapshot the
 * ledger renders. No network, no DOM: the 16 repo lines are the portfolio in
 * each repo's own words, with its stack beside it.
 *
 *   # Title
 *
 *   > Summary, with the snapshot date.
 *
 *   - [repo](url): one_line (stack)
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const snapshot = path.join(root, "src", "content", "ai-summaries.json");
const out = path.join(root, "dist", "llms.txt");

const record = JSON.parse(await readFile(snapshot, "utf8"));
const summaries = [...record.summaries].sort((a, b) => a.repo.localeCompare(b.repo));
if (summaries.length === 0) {
  throw new Error("prerender-llms: committed ai-summaries.json has no summaries");
}

const lines = [
  "# Nathaniel Nikolai Ladero — open source",
  "",
  `> Sixteen public repositories, each described in its own words. Rebuilt from the committed machine-summary snapshot measured ${record.measuredAt}.`,
  "",
  ...summaries.map(
    (summary) =>
      `- [${summary.repo}](https://github.com/nathwn12/${summary.repo}): ${summary.one_line} (${summary.stack.join(", ")})`,
  ),
  "",
];

await writeFile(out, lines.join("\n"), "utf8");
console.log(`OK: prerendered dist/llms.txt with ${summaries.length} repo links`);
