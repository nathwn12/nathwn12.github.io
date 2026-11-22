import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  serializeRecord,
  writeRecordIfChanged,
} from "../scripts/probe-repos.mjs";
import committed from "../src/content/repos.probe.json";

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function tempSnapshot(): string {
  const dir = mkdtempSync(join(tmpdir(), "probe-repos-"));
  tempDirs.push(dir);
  return join(dir, "repos.probe.json");
}

describe("the repo snapshot write", () => {
  test("serializes exactly as the committed file stores the record", () => {
    const onDisk = readFileSync(
      new URL("../src/content/repos.probe.json", import.meta.url),
      "utf8",
    );
    expect(serializeRecord(committed)).toBe(onDisk);
    expect(onDisk.endsWith("\n")).toBe(true);
  });

  test("a byte-identical measurement is a no-op and leaves the file untouched", () => {
    const out = tempSnapshot();
    writeFileSync(out, serializeRecord(committed), "utf8");
    const old = new Date("2020-01-01T00:00:00Z");
    utimesSync(out, old, old);

    expect(writeRecordIfChanged(out, committed)).toBe(false);
    expect(existsSync(out)).toBe(true);
    expect(readFileSync(out, "utf8")).toBe(serializeRecord(committed));
    expect(Math.abs(statSync(out).mtimeMs - old.getTime())).toBeLessThan(2000);
  });

  test("a changed pushedAt, count or repo is still written", () => {
    const out = tempSnapshot();
    writeFileSync(out, serializeRecord(committed), "utf8");

    const changed = {
      ...committed,
      publicRepos: committed.publicRepos + 1,
      repos: committed.repos.map((repo, index) =>
        index === 0 ? { ...repo, pushedAt: "1999-01-01" } : repo,
      ),
    };
    expect(writeRecordIfChanged(out, changed)).toBe(true);
    const written = readFileSync(out, "utf8");
    expect(written).toBe(serializeRecord(changed));
    expect(JSON.parse(written).repos[0].pushedAt).toBe("1999-01-01");
    expect(JSON.parse(written).publicRepos).toBe(committed.publicRepos + 1);
    expect(writeRecordIfChanged(out, changed)).toBe(false);
  });
});
