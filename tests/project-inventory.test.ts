/**
 * Project inventory — the /projects cards are the current public work, nothing
 * else. The baseline is the checked-in probe of the live account
 * (`src/content/repos.probe.json`, `gh repo list nathwn12`), which is the same
 * measurement `src/content/projects.ts` was rebuilt from: every public
 * repository is either a card or excluded by name, and every card's link, name,
 * primary language and fork label must match the probe. The count copy must
 * equal the cards rendered.
 *
 * Primary language is GitHub's own field, so it leads `tech`. Where a repository
 * was also surveyed at source level (the 2026-10-24 pass over the local
 * checkouts), a card may name a further language only when the repository holds
 * it; the repositories added after that pass are gated on the probe's primary
 * language and the no-duplicate rule.
 *
 * Every assertion below can go red.
 *
 *   bunx vitest run tests/project-inventory.test.ts
 */
import { describe, expect, test } from "vitest";
import {
  allProjectsLabel,
  archived,
  countWords,
  projects,
  projectsLede,
} from "../src/content/projects";
import probe from "../src/content/repos.probe.json";

interface ProbeRepo {
  name: string;
  isFork: boolean;
  parent: string | null;
  primaryLanguage: string | null;
}

const REPOS = (probe as { repos: ProbeRepo[] }).repos;

/** Never a project card: the profile README and this site. */
const EXCLUDED = ["nathwn12", "nathwn12.github.io"];

/** dir → the repository's PRIMARY language, from GitHub's own field. */
const PRIMARY_LANGUAGE: Record<string, string> = Object.fromEntries(
  REPOS.filter((repo) => repo.primaryLanguage).map((repo) => [
    repo.name,
    repo.primaryLanguage as string,
  ]),
);

/** dir → every language the repository source was measured to contain, primary
    first. Cross-checked against the local checkouts on 2026-10-24 by line count
    per extension, excluding node_modules/target/dist; every repository surveyed
    then is still in the inventory under the same directory name. */
const SOURCE_LANGUAGES: Record<string, readonly string[]> = {
  puppet: ["Rust"],
  gladius: ["Rust"],
  // Rust about 42k lines / 59 files in crates/{gladius,puppet}; TypeScript
  // about 30k lines / 81 files across the seven packages. Rust leads.
  "oc-collections": ["Rust", "TypeScript"],
  potflix: ["Rust"],
  // The Tauri shell: TypeScript UI on a Rust backend.
  slowburn: ["TypeScript", "Rust"],
  "arc-installer": ["PowerShell", "C#"],
  "vencord-bootstrap": ["PowerShell"],
};

/** Names that read as a language rather than as a framework or a product, so
    `tech` can be checked for language claims without guessing at every chip. */
const LANGUAGE_NAMES = new Set([
  "Rust",
  "TypeScript",
  "JavaScript",
  "PowerShell",
  "C++",
  "C#",
  "Python",
]);

describe("project inventory is the current public work", () => {
  test("the probe is a dated measurement of the live account", () => {
    expect((probe as { measuredAt: string }).measuredAt).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
    expect(REPOS.length).toBeGreaterThan(0);
  });

  test("every public repository is a card or is excluded by name", () => {
    const covered = new Set([...projects.map((p) => p.dir), ...EXCLUDED]);
    for (const repo of REPOS) {
      expect(covered.has(repo.name), `${repo.name} is neither a card nor excluded`)
        .toBe(true);
    }
    expect(projects.length + EXCLUDED.length).toBe(REPOS.length);
  });

  test("every card links to its own repository under nathwn12", () => {
    for (const project of projects) {
      expect(project.url, project.dir).toBe(
        `https://github.com/nathwn12/${project.dir}`,
      );
    }
    const dirs = projects.map((project) => project.dir);
    const urls = projects.map((project) => project.url);
    const ids = projects.map((project) => project.id);
    expect(new Set(dirs).size).toBe(dirs.length);
    expect(new Set(urls).size).toBe(urls.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("each card's first tech is the repository's primary language", () => {
    for (const project of projects) {
      expect(project.tech[0], project.dir).toBe(PRIMARY_LANGUAGE[project.dir]);
    }
  });

  test("a card names only languages its source holds, primary first once", () => {
    for (const project of projects) {
      const named = project.tech.filter((chip) => LANGUAGE_NAMES.has(chip));
      expect(named, project.dir).toEqual([...new Set(named)]);
      expect(named[0], project.dir).toBe(PRIMARY_LANGUAGE[project.dir]);

      const confirmed = SOURCE_LANGUAGES[project.dir];
      if (!confirmed) continue;
      expect(confirmed[0], project.dir).toBe(PRIMARY_LANGUAGE[project.dir]);
      for (const language of named) {
        expect(confirmed, `${project.dir}: ${language}`).toContain(language);
      }
    }

    // oc-collections is the one repo the inventory blocked on: GitHub's primary
    // is Rust, and TypeScript survives as the packages' language rather than as
    // the card's lead.
    const collections = projects.find((p) => p.dir === "oc-collections")!;
    expect(
      collections.tech.filter((chip) => LANGUAGE_NAMES.has(chip)),
    ).toEqual(["Rust", "TypeScript"]);
  });

  test("forks say so and own work says own brand", () => {
    for (const project of projects) {
      const repo = REPOS.find((entry) => entry.name === project.dir);
      expect(repo, project.dir).toBeDefined();
      if (repo!.isFork) {
        expect(project.role, project.dir).toMatch(/^Fork of /);
        expect(project.role, project.dir).toContain(repo!.parent!);
      } else {
        expect(project.role, project.dir).toBe("Own brand");
      }
    }
  });

  test("profile and site never render", () => {
    const names = projects
      .map((project) => `${project.dir} ${project.name}`)
      .join(" ");
    const urls = projects.map((project) => project.url);
    for (const excluded of EXCLUDED) {
      expect(names).not.toContain(excluded);
      expect(urls).not.toContain(`https://github.com/nathwn12/${excluded}`);
    }
  });

  test("counts and copy equal the rendered card count", () => {
    expect(projectsLede.toLowerCase()).toContain(countWords(projects.length));
    expect(projectsLede).toContain("projects published");
    expect(allProjectsLabel).toBe(`All ${countWords(projects.length)} projects`);
  });

  test("every card carries the full band contract and stays mid-level", () => {
    for (const project of projects) {
      expect(project.stats.length, project.dir).toBe(3);
      expect(project.highlights.length, project.dir).toBeGreaterThanOrEqual(3);
      expect(project.tech.length, project.dir).toBeGreaterThanOrEqual(3);
      expect(project.description.length, project.dir).toBeGreaterThan(40);
      const prose = [project.description, ...project.highlights].join(" ");
      expect(prose, project.dir).not.toMatch(
        /\b(senior|lead|principal|staff|head of)\b/i,
      );
    }
  });

  test("Potflix states the cache expiry, never permanence", () => {
    // Owner-authorized source: Q:\PROJECTS\PERSONAL\Potflix\rust\crates\metadata\
    // src\cache.rs:79-83 sets POSITIVE_TTL to 30 * 24 * 60 * 60 seconds (the
    // same 30 days as NEGATIVE_TTL), and its doc comment says an expired
    // positive is re-fetched, so the store is "never indefinite storage". The
    // card must state that 30-day expiry and must not claim permanence.
    const potflix = projects.find((project) => project.dir === "potflix");
    expect(potflix).toBeDefined();
    const prose = [potflix!.description, ...potflix!.highlights].join(" ");
    expect(prose).toMatch(/\b30[- ]days?\b/);
    expect(prose).toMatch(/\b(expire|expires|expiry|re-?resolves)\b/i);
    expect(prose).not.toMatch(
      /\b(permanent|permanently|indefinite|indefinitely|forever)\b/i,
    );
  });

  test("retired work is not also listed as live", () => {
    for (const entry of archived) {
      expect(projects.some((project) => project.dir === entry.dir)).toBe(false);
    }
  });
});
