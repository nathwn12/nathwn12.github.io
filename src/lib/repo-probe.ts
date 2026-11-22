/**
 * The account's public repository count is one fact with one gate. The probe
 * writes it; this reads it. A missing or malformed field is a build failure,
 * never a guess derived from the curated display rows.
 */
export interface RepoProbeSnapshot {
  measuredAt: string;
  publicRepos: number;
  repos: readonly unknown[];
}

export function publicRepoCount(probe: Partial<RepoProbeSnapshot>): number {
  const value = probe.publicRepos;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(
      "src/content/repos.probe.json: publicRepos is missing or invalid; run scripts/probe-repos.mjs",
    );
  }
  return value;
}
