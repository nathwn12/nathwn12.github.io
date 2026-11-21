import npmPackages from "./npm-packages.json";
import stats from "./open-source-stats.json";
import probe from "./repos.probe.json";

/**
 * The deep field is the record, not decoration. Every point is a shipped npm
 * package or a worked public repo, and every number behind a point comes from
 * a committed file here. `id` is the audit key back to that source.
 */
export interface FieldPoint {
  id: string;
  label: string;
  kind: "package" | "repo";
  source: string;
  measure: number;
  measureLabel: string;
  size: number;
  brightness: number;
  live: boolean;
  spike: boolean;
  x: number;
  y: number;
}

/** FNV-1a: one id, one place, every load. No clock, no random state. */
export function hash32(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Two independent cuts of the same id spread points across the void. */
export function placePoint(id: string): { x: number; y: number } {
  return {
    x: 0.04 + (hash32(id) / 0xffffffff) * 0.92,
    y: 0.04 + (hash32(`${id}:y`) / 0xffffffff) * 0.92,
  };
}

const DAY = 86_400_000;
const days = (from: string, to: string): number =>
  Math.max(0, Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY,
  ));

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const byName = new Map(stats.packages.map((item) => [item.name, item]));
const maxAllTime = Math.max(1, ...stats.packages.map((item) => item.allTime));
const maxMonth = Math.max(1, ...stats.packages.map((item) => item.month));

const packagePoints: FieldPoint[] = npmPackages.map((name) => {
  const entry = byName.get(name);
  if (!entry) {
    throw new Error(`content/field.ts: no committed download figure for ${name}`);
  }
  const id = `npm:${name}`;
  return {
    id,
    label: name,
    kind: "package",
    source: "src/content/open-source-stats.json",
    measure: entry.allTime,
    measureLabel: `${entry.allTime.toLocaleString("en-US")} all-time downloads`,
    size: Math.sqrt(clamp01(entry.allTime / maxAllTime)),
    brightness: 0.35 + 0.65 * clamp01(entry.month / maxMonth),
    live: false,
    spike: false,
    ...placePoint(id),
  };
});

const repos = probe.repos.filter(
  (repo) => repo.visibility === "PUBLIC" && !repo.isArchived,
);
const repoSpan = (repo: (typeof repos)[number]): number =>
  days(repo.createdAt, repo.pushedAt);
const maxSpan = Math.max(1, ...repos.map(repoSpan));

const repoPoints: FieldPoint[] = repos.map((repo) => {
  const id = `repo:${repo.name}`;
  const span = repoSpan(repo);
  const scale = clamp01(span / maxSpan);
  return {
    id,
    label: repo.name,
    kind: "repo",
    source: "src/content/repos.probe.json",
    measure: span,
    measureLabel: `${span} days from creation to last push`,
    size: scale,
    brightness: 0.35 + 0.65 * scale,
    live: false,
    spike: false,
    ...placePoint(id),
  };
});

/** The live signal: the three packages with the most downloads in 30 days. */
const liveIds = new Set(
  [...packagePoints]
    .sort((a, b) => {
      const left = byName.get(a.label)?.month ?? 0;
      const right = byName.get(b.label)?.month ?? 0;
      return right - left;
    })
    .slice(0, 3)
    .map((point) => point.id),
);

/** Diffraction spikes belong to the four largest points in the whole field. */
const spikeIds = new Set(
  [...packagePoints, ...repoPoints]
    .sort((a, b) => b.size - a.size)
    .slice(0, 4)
    .map((point) => point.id),
);

export const fieldPoints: readonly FieldPoint[] = [
  ...packagePoints,
  ...repoPoints,
].map((point) => ({
  ...point,
  live: liveIds.has(point.id),
  spike: spikeIds.has(point.id),
}));

/** Point id -> committed content id, kept explicit for audit. */
export const fieldPointById: ReadonlyMap<string, FieldPoint> = new Map(
  fieldPoints.map((point) => [point.id, point]),
);

/** The visible corner caption is derived, never retyped. */
export const fieldCaption =
  `${fieldPoints.length} points / ${packagePoints.length} npm packages` +
  ` + ${repoPoints.length} worked repos / ${stats.snapshotDate}`;
