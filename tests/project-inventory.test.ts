/**
 * Project inventory — the /projects cards are the current public work, nothing
 * else. The survey baseline is 2026-10-24: 14 public repos, of which the
 * profile README and the portfolio site are not project cards, and the art-only
 * companion is excluded. Every card's link, name, primary language, and fork
 * label must match the repository; the count copy must equal the cards rendered.
 * Primary language is GitHub's own field, so it leads `tech`; a stack may name a
 * further language only when the repository source holds it.
 * Every assertion below can go red.
 *
 *   pnpm vitest run tests/project-inventory.test.ts
 */
import { describe, expect, test } from "vitest";
import {
  allProjectsLabel,
  archived,
  countWords,
  projects,
  projectsLede,
} from "../src/content/projects";

/** dir → the repository's PRIMARY language: GitHub's own primary field, read
    from the API inventory on 2026-10-24. This is not "the first language the
    stack happens to list" — a card whose primary is Rust must lead Rust even
    when most of its published surface is TypeScript. */
const PRIMARY_LANGUAGE: Record<string, string> = {
  puppet: "Rust",
  gladius: "Rust",
  "oc-collections": "Rust",
  Potflix: "Rust",
  slowburn: "TypeScript",
  "aimp-discord-presence2": "C++",
  "pear-desktop": "TypeScript",
  Installer2: "PowerShell",
  "tab-audio-normalizer": "JavaScript",
  ArcInstaller: "PowerShell",
  "slowed-reverb-audio": "JavaScript",
};

/** dir → every language the repository source actually contains, primary
    first. A card's `tech` may name a language only from this set, so a stack
    line can carry a second language (oc-collections' TypeScript packages,
    Slowburn's Rust shell, ArcInstaller's C# companion) but never borrow one
    the repo does not hold. Cross-checked against the local checkouts on
    2026-10-24 by line count per extension, excluding node_modules/target/
    dist; every repo's leader matched the GitHub primary above. */
const SOURCE_LANGUAGES: Record<string, readonly string[]> = {
  puppet: ["Rust"],
  gladius: ["Rust"],
  // Rust about 42k lines / 59 files in crates/{gladius,puppet}; TypeScript
  // about 30k lines / 81 files across the seven packages. Rust leads.
  "oc-collections": ["Rust", "TypeScript"],
  Potflix: ["Rust"],
  // The Tauri shell: TypeScript UI on a Rust backend.
  slowburn: ["TypeScript", "Rust"],
  "aimp-discord-presence2": ["C++"],
  "pear-desktop": ["TypeScript"],
  Installer2: ["PowerShell"],
  "tab-audio-normalizer": ["JavaScript"],
  ArcInstaller: ["PowerShell", "C#"],
  "slowed-reverb-audio": ["JavaScript"],
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
]);

/** Forks must be labelled as forks; own work stays "Own brand". */
const ROLE: Record<string, string> = {
  puppet: "Own brand",
  gladius: "Own brand",
  "oc-collections": "Own brand",
  Potflix: "Own brand",
  slowburn: "Own brand",
  "aimp-discord-presence2": "Fork of Exle",
  "pear-desktop": "Fork of pear-devs",
  Installer2: "Fork of Vencord/Installer",
  "tab-audio-normalizer": "Own brand",
  ArcInstaller: "Own brand",
  "slowed-reverb-audio": "Own brand",
};

/** Never a project card: profile README, portfolio site, folded-in packages,
    and the art-only companion. */
const EXCLUDED = [
  "nathwn12",
  "nathwn12.github.io",
  "aimp-discord-presence-art",
  "oc-harness-setup",
  "oc-bifrost",
  "oc-flight-deck",
  "rea-shim",
];

describe("project inventory is the current public work", () => {
  test("the rendered set is exactly the surveyed projects", () => {
    expect(projects.map((project) => project.dir).sort()).toEqual(
      Object.keys(PRIMARY_LANGUAGE).sort(),
    );
    expect(projects.length).toBe(11);
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
    // Both tables describe the same eleven repositories.
    expect(Object.keys(SOURCE_LANGUAGES).sort()).toEqual(
      Object.keys(PRIMARY_LANGUAGE).sort(),
    );

    for (const project of projects) {
      const confirmed = SOURCE_LANGUAGES[project.dir];
      expect(confirmed[0], project.dir).toBe(PRIMARY_LANGUAGE[project.dir]);

      const named = project.tech.filter((chip) => LANGUAGE_NAMES.has(chip));
      expect(named, project.dir).toEqual([...new Set(named)]);
      for (const language of named) {
        expect(confirmed, `${project.dir}: ${language}`).toContain(language);
      }

      // oc-collections is the one repo the inventory blocked on: GitHub's
      // primary is Rust, and TypeScript survives as the packages' language
      // rather than as the card's lead.
      if (project.dir === "oc-collections") {
        expect(named).toEqual(["Rust", "TypeScript"]);
      }
    }
  });

  test("forks say so and own work says own brand", () => {
    for (const project of projects) {
      expect(project.role, project.dir).toBe(ROLE[project.dir]);
    }
    for (const project of projects) {
      if (project.dir === "aimp-discord-presence2" ||
          project.dir === "pear-desktop" ||
          project.dir === "Installer2") {
        expect(project.role, project.dir).toMatch(/^Fork of /);
      }
    }
  });

  test("profile, site, folded-in packages, and art-only work never render", () => {
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
    const potflix = projects.find((project) => project.dir === "Potflix");
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
