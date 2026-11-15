import { readFileSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const NPM_PACKAGES = Object.freeze(
  JSON.parse(
    readFileSync(
      new URL("../src/content/npm-packages.json", import.meta.url),
      "utf8",
    ),
  ),
);

const DAY_MS = 86_400_000;
const MAX_WINDOW_DAYS = 365;
const DEFAULT_OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/content/npm-downloads.json",
);

const isoDate = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) =>
  isoDate(new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS));

export function validatePackageNames(names) {
  if (!Array.isArray(names) || names.length === 0) {
    throw new Error("npm package inventory must be a non-empty array");
  }
  const seen = new Set();
  for (const name of names) {
    if (
      typeof name !== "string" ||
      !/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i.test(name)
    ) {
      throw new Error(`invalid npm package name: ${String(name)}`);
    }
    if (seen.has(name)) throw new Error(`duplicate npm package: ${name}`);
    seen.add(name);
  }
  return [...names];
}

export function buildDateWindows(start, end) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    Number.isNaN(Date.parse(`${start}T00:00:00Z`)) ||
    Number.isNaN(Date.parse(`${end}T00:00:00Z`)) ||
    start > end
  ) {
    throw new Error(`invalid npm download period: ${start} through ${end}`);
  }
  const windows = [];
  let cursor = start;
  while (cursor <= end) {
    const windowEnd = addDays(cursor, MAX_WINDOW_DAYS - 1);
    const window = { start: cursor, end: windowEnd < end ? windowEnd : end };
    windows.push(window);
    cursor = addDays(window.end, 1);
  }
  return windows;
}

async function readJson(fetcher, url) {
  const response = await fetcher(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${response.status} fetching ${url}`);
  return response.json();
}

export async function fetchPackageDownloads(name, through, fetcher = fetch) {
  const validNames = validatePackageNames([name]);
  const packageName = validNames[0];
  const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
  const metadata = await readJson(fetcher, registryUrl);
  if (
    metadata?.name !== packageName ||
    typeof metadata?.time?.created !== "string" ||
    !metadata.maintainers?.some((maintainer) => maintainer?.name === "nathwn12")
  ) {
    throw new Error(`npm registry metadata is incomplete for ${packageName}`);
  }
  const created = metadata.time.created.slice(0, 10);
  const windows = buildDateWindows(created, through);
  let downloads = 0;

  for (const { start, end } of windows) {
    const range = `${start}:${end}`;
    const statsUrl = `https://api.npmjs.org/downloads/point/${range}/${encodeURIComponent(packageName)}`;
    const result = await readJson(fetcher, statsUrl);
    if (
      result?.package !== packageName ||
      result.start !== start ||
      result.end !== end ||
      !Number.isSafeInteger(result.downloads) ||
      result.downloads < 0
    ) {
      throw new Error(`npm returned an incomplete download range for ${packageName}: ${range}`);
    }
    downloads += result.downloads;
    if (!Number.isSafeInteger(downloads)) {
      throw new Error(`npm download total exceeds safe integer range for ${packageName}`);
    }
  }

  return { name: packageName, created, through, downloads };
}

export function snapshotDate(now = new Date()) {
  // npm publishes daily aggregates after UTC midnight; keep a three-day
  // settlement buffer so the public total does not count a still-moving day.
  return addDays(isoDate(now), -3);
}

export async function collectDownloads(
  { names = NPM_PACKAGES, now = new Date(), fetcher = fetch } = {},
) {
  const packages = validatePackageNames(names);
  const through = snapshotDate(now);
  const results = [];
  for (const name of packages) {
    results.push(await fetchPackageDownloads(name, through, fetcher));
  }
  const total = results.reduce((sum, item) => sum + item.downloads, 0);
  if (!Number.isSafeInteger(total)) {
    throw new Error("combined npm download total exceeds safe integer range");
  }
  return {
    source: "npm",
    period: "all available daily package-download data since each package was registered",
    snapshotDate: through,
    total,
    packages: results,
  };
}

export async function updateSnapshot({
  outputPath = DEFAULT_OUTPUT,
  names = NPM_PACKAGES,
  now = new Date(),
  fetcher = fetch,
} = {}) {
  const data = await collectDownloads({ names, now, fetcher });
  const target = resolve(outputPath);
  const temp = `${target}.tmp`;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(temp, target);
  return data;
}

export async function updateOrKeepSnapshot(options = {}) {
  try {
    const result = await updateSnapshot(options);
    console.log(
      `npm downloads updated: ${result.total.toLocaleString("en-US")} through ${result.snapshotDate}`,
    );
    return { updated: true, data: result };
  } catch (error) {
    const outputPath = resolve(options.outputPath ?? DEFAULT_OUTPUT);
    try {
      await readFile(outputPath, "utf8");
    } catch {
      throw new Error(
        `npm download refresh failed and no cached snapshot exists: ${error.message}`,
      );
    }
    console.warn(
      `npm download refresh unavailable; keeping the dated snapshot: ${error.message}`,
    );
    return { updated: false };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await updateOrKeepSnapshot();
}
