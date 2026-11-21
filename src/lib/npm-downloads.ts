export interface NpmPackageDownload {
  name: string;
  created: string;
  through: string;
  downloads: number;
  /** Daily series when the snapshot carries one; its last day must be the
   *  snapshot date, so the displayed window cannot understate the capture. */
  daily?: { day: string; downloads: number }[];
}

export interface NpmDownloadSnapshot {
  source: "npm";
  period: string;
  snapshotDate: string;
  total: number;
  packages: NpmPackageDownload[];
}

export type SnapshotFreshness =
  | { status: "fresh"; ageDays: number }
  | { status: "stale"; ageDays: number }
  | { status: "unavailable"; ageDays: null };

const DAY_MS = 86_400_000;
const MAX_FRESH_DAYS = 10;

export function downloadSnapshotFreshness(
  value: unknown,
  now = new Date(),
  expectedNames?: readonly string[],
): SnapshotFreshness {
  if (!value || typeof value !== "object") {
    return { status: "unavailable", ageDays: null };
  }
  const snapshot = value as Partial<NpmDownloadSnapshot>;
  if (
    snapshot.source !== "npm" ||
    typeof snapshot.snapshotDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.snapshotDate) ||
    !Number.isSafeInteger(snapshot.total) ||
    snapshot.total! < 0 ||
    !Array.isArray(snapshot.packages) ||
    snapshot.packages.length === 0 ||
    new Set(snapshot.packages.map((item) => item?.name)).size !==
      snapshot.packages.length ||
    (expectedNames !== undefined &&
      (snapshot.packages.length !== expectedNames.length ||
        expectedNames.some(
          (name) => !snapshot.packages!.some((item) => item.name === name),
        ))) ||
    snapshot.packages.some(
      (item) =>
        !item ||
        typeof item.name !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(item.created) ||
        !Number.isSafeInteger(item.downloads) ||
        item.downloads < 0 ||
        item.through !== snapshot.snapshotDate ||
        (item.daily !== undefined &&
          (item.daily.length === 0 ||
            item.daily[item.daily.length - 1]?.day !== snapshot.snapshotDate)),
    ) ||
    snapshot.packages.reduce((sum, item) => sum + item.downloads, 0) !==
      snapshot.total
  ) {
    return { status: "unavailable", ageDays: null };
  }
  const snapshotMs = Date.parse(`${snapshot.snapshotDate}T00:00:00Z`);
  const todayMs = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  if (
    !Number.isFinite(snapshotMs) ||
    new Date(snapshotMs).toISOString().slice(0, 10) !== snapshot.snapshotDate ||
    snapshotMs > todayMs
  ) {
    return { status: "unavailable", ageDays: null };
  }
  const ageDays = (todayMs - snapshotMs) / DAY_MS;
  return {
    status: ageDays <= MAX_FRESH_DAYS ? "fresh" : "stale",
    ageDays,
  };
}
