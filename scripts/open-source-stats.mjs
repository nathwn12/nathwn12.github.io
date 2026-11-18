#!/usr/bin/env node
/**
 * Measure the open-source figures on /projects and commit them as JSON.
 *
 *   node scripts/open-source-stats.mjs --dry-run   print every fetched number, write nothing
 *   node scripts/open-source-stats.mjs            write both committed snapshots
 *
 * Site-owned and modeled on the profile repo's scripts/stats.mjs, never imported
 * from it and never writing to it. npm month and all-time figures come from the
 * extension point in scripts/npm-downloads.mjs: its package inventory, maintainer
 * check, 365-day windows, three-day settlement buffer and exact dated snapshots
 * all carry through. Nothing here fetches at build or runtime; the workflow
 * measures, commits, and the site only reads the committed JSON.
 *
 * Fail closed: a partial or invalid measurement throws before either file is
 * written, so a failed run keeps the last complete dated snapshot on disk.
 */

import { execFile } from "node:child_process";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  NPM_PACKAGES,
  collectDownloads,
  snapshotDate,
  validatePackageNames,
} from "./npm-downloads.mjs";

const USER = "nathwn12";
const ACTIVITY_DAYS = 30;
const DAY_MS = 86_400_000;
const RETRY_DELAYS = [2_000, 5_000, 10_000, 20_000, 30_000];
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NPM_OUTPUT = resolve(ROOT, "src", "content", "npm-downloads.json");
const STATS_OUTPUT = resolve(ROOT, "src", "content", "open-source-stats.json");

const isoDate = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) =>
  isoDate(new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS));
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

/** Honour 429-retry-after (capped), then a fixed backoff; fail loudly.
    Returns the Response, because the npm extension point reads it itself. */
export async function fetchResponse(url, init) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, init);
    if (response.ok) return response;
    const body = (await response.text()).slice(0, 300);
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === RETRY_DELAYS.length) {
      throw new Error(`HTTP ${response.status} ${response.statusText} for ${url} — ${body}`);
    }
    const header = Number(response.headers.get("retry-after"));
    const wait =
      Number.isFinite(header) && header > 0 && header <= 60
        ? header * 1_000
        : RETRY_DELAYS[attempt];
    await sleep(wait);
  }
}

// The npm point API 429s on bursts: one request in flight, spaced apart.
let npmQueue = Promise.resolve();
function npmFetch(url, init) {
  const request = npmQueue.then(async () => {
    const response = await fetchResponse(url, init);
    await sleep(150);
    return response;
  });
  npmQueue = request.catch(() => {});
  return request;
}
const npmInit = () => ({
  headers: { accept: "application/json" },
  signal: AbortSignal.timeout(15_000),
});

/** The last whole month for one package, with the same maintainer guard as
    the all-time path. A month that cannot be validated is a failure, never a
    zero and never a figure rendered as "unavailable" by guesswork. */
export async function fetchPackageMonth(name, fetcher = npmFetch) {
  const packageName = validatePackageNames([name])[0];
  const metadata = await (
    await fetcher(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
      npmInit(),
    )
  ).json();
  if (
    metadata?.name !== packageName ||
    typeof metadata?.time?.created !== "string" ||
    !metadata.maintainers?.some((maintainer) => maintainer?.name === USER)
  ) {
    throw new Error(`npm registry metadata is incomplete for ${packageName}`);
  }
  const body = await (
    await fetcher(
      `https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(packageName)}`,
      npmInit(),
    )
  ).json();
  if (
    body?.package !== packageName ||
    !datePattern.test(body.start ?? "") ||
    !datePattern.test(body.end ?? "") ||
    !Number.isSafeInteger(body.downloads) ||
    body.downloads < 0
  ) {
    throw new Error(`npm returned no complete month for ${packageName}`);
  }
  return { name: packageName, month: body.downloads, start: body.start, end: body.end };
}

const ACTIVITY_QUERY = `query {
  user(login: "${USER}") {
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      contributionCalendar {
        totalContributions
        weeks { contributionDays { contributionCount date } }
      }
    }
  }
}`;

function ghGraphQL() {
  return new Promise((resolvePromise, reject) => {
    execFile(
      "gh",
      ["api", "graphql", "-f", `query=${ACTIVITY_QUERY}`],
      { maxBuffer: 64 * 1024 * 1024 },
      (error, stdout) => (error ? reject(error) : resolvePromise(stdout)),
    );
  });
}

async function apiGraphQL() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) throw new Error("gh is unavailable and neither GITHUB_TOKEN nor GH_TOKEN is set");
  const response = await fetchResponse("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "user-agent": `${USER}-portfolio-stats`,
    },
    body: JSON.stringify({ query: ACTIVITY_QUERY }),
  });
  return response.json();
}

function unwrapActivity(payload) {
  if (!payload || typeof payload !== "object") throw new Error("GitHub returned no payload");
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    throw new Error(`GitHub GraphQL error: ${payload.errors.map((error) => error.message).join("; ")}`);
  }
  const collection = payload.data?.user?.contributionsCollection;
  if (!collection?.contributionCalendar || !Array.isArray(collection.contributionCalendar.weeks)) {
    throw new Error("GitHub GraphQL returned no contribution calendar");
  }
  return collection;
}

export async function githubActivity() {
  let raw;
  try {
    raw = await ghGraphQL();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return unwrapActivity(await apiGraphQL());
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error(`gh api graphql returned unparseable output: ${String(raw).slice(0, 300)}`);
  }
  return unwrapActivity(payload);
}

/** The newest days in the calendar, oldest first. A date inside the window
    that the calendar does not carry throws: a missing day is missing data,
    never a zero-activity day. */
export function recentDays(days, count = ACTIVITY_DAYS) {
  if (!Array.isArray(days) || days.length === 0) {
    throw new Error("the contribution calendar is empty");
  }
  const byDate = new Map(days.map((day) => [day.date, day.contributionCount]));
  const last = days.at(-1).date;
  if (!datePattern.test(last)) throw new Error(`invalid contribution date: ${last}`);
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(last, index - count + 1);
    if (!byDate.has(date)) throw new Error(`the contribution calendar is missing ${date}`);
    const value = byDate.get(date);
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`invalid contribution count for ${date}`);
    }
    return { date, value };
  });
}

function requireCount(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`GitHub returned no valid ${label}`);
  }
  return value;
}

/** Measure everything first; write nothing until every number is validated. */
export async function measure({ now = new Date(), fetcher = npmFetch } = {}) {
  const through = snapshotDate(now);
  const npm = await collectDownloads({ names: NPM_PACKAGES, now, fetcher });
  const months = [];
  for (const name of NPM_PACKAGES) months.push(await fetchPackageMonth(name, fetcher));

  const activity = await githubActivity();
  const days = activity.contributionCalendar.weeks.flatMap((week) => week.contributionDays);
  const activityWindow = recentDays(days);
  const monthByName = new Map(months.map((item) => [item.name, item.month]));
  const allTimeByName = new Map(npm.packages.map((item) => [item.name, item.downloads]));

  if (npm.packages.map((item) => item.name).join("|") !== NPM_PACKAGES.join("|")) {
    throw new Error("npm all-time package order changed");
  }
  const packages = NPM_PACKAGES.map((name) => {
    if (!monthByName.has(name) || !allTimeByName.has(name)) {
      throw new Error(`missing npm measurement for ${name}`);
    }
    return { name, month: monthByName.get(name), allTime: allTimeByName.get(name) };
  });
  const npmMonth = packages.reduce((sum, item) => sum + item.month, 0);
  if (!Number.isSafeInteger(npmMonth)) throw new Error("combined month total exceeds safe integer range");

  const report = {
    source: "npm download-count API and GitHub GraphQL, measured by scripts/open-source-stats.mjs",
    generatedAt: new Date().toISOString(),
    snapshotDate: through,
    npmMonth,
    npmAllTime: npm.total,
    packages,
    github: {
      contributions: requireCount(activity.contributionCalendar.totalContributions, "contribution total"),
      commits: requireCount(activity.totalCommitContributions, "commit total"),
      pullRequests: requireCount(activity.totalPullRequestContributions, "pull request total"),
      calendarRange: [days[0].date, days.at(-1).date],
    },
    activity: activityWindow,
  };
  return { report, npm };
}

async function writeAtomic(target, data) {
  const temp = `${target}.tmp`;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(temp, target);
}

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (invokedDirectly) {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) {
    if (arg !== "--dry-run") {
      console.error(`open-source-stats: unknown argument: ${arg}`);
      process.exitCode = 1;
    }
  }
  if (process.exitCode !== 1) {
    try {
      const { report, npm } = await measure();
      if (args.has("--dry-run")) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        await writeAtomic(NPM_OUTPUT, npm);
        await writeAtomic(STATS_OUTPUT, report);
        console.log(
          `open-source-stats: ${report.npmMonth.toLocaleString("en-US")} npm downloads this month, ` +
            `${report.npmAllTime.toLocaleString("en-US")} all-time through ${report.snapshotDate}, ` +
            `${report.github.contributions.toLocaleString("en-US")} contributions, ` +
            `${report.github.commits.toLocaleString("en-US")} commits; wrote both committed snapshots`,
        );
      }
    } catch (error) {
      console.error(`open-source-stats: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
