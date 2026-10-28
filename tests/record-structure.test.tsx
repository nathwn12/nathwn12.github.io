// @vitest-environment jsdom
/**
 * The home record's structure and copy contract.
 *
 * Five things this file holds, each of which can go red:
 *   1. Every derived figure still equals the figure in the delivered record
 *      (src/content/experience.ts / projects.ts / skills.ts). The home page
 *      rewrites the voice; it never invents or drifts a number.
 *   2. No home sentence reappears verbatim on a detail route, and no ten-word
 *      run of home prose reappears in the delivered copy.
 *   3. One h1, and every band is a landmark-labelled section with a real
 *      heading behind its aria-labelledby.
 *   4. The atlas carries every group and every package from content/skills.ts
 *      (a compact band, not a dropped section).
 *   5. Exactly one contact CTA phrase site-wide.
 *
 *   pnpm vitest run tests/record-structure.test.tsx
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Record } from "../src/components/Record";
import { experience, provenance } from "../src/content/experience";
import { projects } from "../src/content/projects";
import { repos } from "../src/content/skills";
import {
  CONTACT_CTA,
  figures,
  homeSentences,
  percentIn,
  queryTimes,
  tenureShort,
} from "../src/content/ledger";

const root = resolve(import.meta.dirname, "..");

const sentences = (text: string): string[] =>
  text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const words = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/** Every contiguous n-word run in a text. */
function shingles(text: string, n: number): Set<string> {
  const list = words(text);
  const out = new Set<string>();
  for (let i = 0; i + n <= list.length; i += 1) {
    out.add(list.slice(i, i + n).join(" "));
  }
  return out;
}

const detailCopy = [  ...experience.flatMap((entry) => [
    entry.outcome,
    entry.description,
    ...entry.highlights,
  ]),
  ...projects.flatMap((project) => [
    project.description,
    ...project.highlights,
  ]),
  provenance,
];

describe("figures are derived from the delivered record", () => {
  const payments = experience.find((entry) => entry.id === "02")!;
  const dataAccess = experience.find((entry) => entry.id === "04")!;

  test("the percentages are the record's own", () => {
    expect(figures.paymentsPercent).toBe(percentIn(payments.outcome));
    expect(figures.paymentsPercent).toBe("98%");
    expect(figures.readLatency).toBe("over 40%");
    expect(percentIn(dataAccess.outcome)).toBe(figures.readLatency);
  });

  test("the before/after timings are parsed from the payments description", () => {
    const parsed = queryTimes(payments.description);
    expect(figures.queryBefore).toBe(parsed.before);
    expect(figures.queryAfter).toBe(parsed.after);
    expect(figures.queryBefore).toBe("60 s");
    expect(figures.queryAfter).toMatch(/under (one|1) second/);
  });

  test("the delivery numbers are the provenance's own", () => {
    expect(figures.commits).toBe("1,182");
    expect(figures.repositories).toBe("17");
    expect(figures.scanned).toBe("21");
    expect(provenance).toContain("1,182 commits across 17 repositories");
  });

  test("the tenure is read off the one period string", () => {
    expect(figures.tenure).toBe("3 yrs 2 mos");
    expect(tenureShort("March 2023 to May 2026")).toBe(figures.tenure);
  });

  test("counts equal the content they count", () => {
    expect(figures.projectCount).toBe(projects.length);
    expect(figures.projectCount).toBe(11);
    expect(figures.groupCount).toBe(repos.length);
    expect(figures.packageCount).toBe(
      repos.reduce((total, group) => total + group.packages.length, 0),
    );
    expect(figures.packageCount).toBe(88);
  });
});

describe("the home page rewrites; the detail routes quote", () => {
  test("no home sentence appears verbatim on a detail route", () => {
    const detail = new Set(detailCopy.flatMap(sentences));
    const duplicates = homeSentences
      .flatMap(sentences)
      .filter((sentence) => detail.has(sentence));
    expect(duplicates, duplicates.join(" | ")).toEqual([]);
  });

  test("no ten-word run of home prose reappears in the delivered copy", () => {
    const detail = new Set(detailCopy.flatMap((text) => [...shingles(text, 10)]));
    const overlaps: string[] = [];
    for (const sentence of homeSentences) {
      for (const run of shingles(sentence, 10)) {
        if (detail.has(run)) overlaps.push(run);
      }
    }
    expect(overlaps, overlaps.join(" | ")).toEqual([]);
  });

  test("the old duplicated sentences are gone from the home page", () => {
    const home = homeSentences.join(" ");
    // The six sentences that used to appear on both `/` and `/experience`, and
    // the Puppet blurb that appeared on both `/` and `/projects`.
    for (const old of [
      "Migrated payment services from MySql.Data to MySqlConnector on AWS: worst-case query times fell from about 60 seconds to under one second.",
      "Cut payment API latency by 98% by moving from MySql.Data to MySqlConnector on AWS.",
      "Cut read latency by over 40% with EF Core, Dapper, and Redis.",
    ]) {
      expect(home).not.toContain(old);
    }
    const puppet = projects.find((project) => project.dir === "puppet")!;
    expect(home).not.toContain(puppet.description);
  });
});

describe("the rendered record", () => {
  let host: HTMLDivElement;
  let mounted: Root | null = null;

  beforeEach(async () => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    host = document.createElement("div");
    document.body.appendChild(host);
    mounted = createRoot(host);
    await act(async () => {
      mounted!.render(createElement(Record));
    });
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    if (mounted) {
      await act(async () => {
        mounted!.unmount();
      });
      mounted = null;
    }
    host?.remove();
  });

  test("exactly one h1, and it names the person", () => {
    const h1s = host.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toContain("Nathaniel Nikolai Ladero");
  });

  test("every band is a labelled section with a real heading", () => {
    const sections = [...host.querySelectorAll("section")];
    expect(sections.length).toBeGreaterThanOrEqual(7);
    for (const section of sections) {
      const labelledBy = section.getAttribute("aria-labelledby");
      expect(labelledBy, "a section has no accessible name").toBeTruthy();
      expect(host.querySelector(`#${labelledBy}`), labelledBy).not.toBeNull();
    }
    // The seven bands of the record, in reading order.
    expect(sections.map((section) => section.id)).toEqual([
      "",
      "proof",
      "work",
      "atlas",
      "forward",
      "credentials",
      "contact",
    ]);
  });

  test("the atlas carries every group and every package", () => {
    const text = host.textContent ?? "";
    for (const group of repos) {
      expect(text, group.label).toContain(group.label);
      for (const pkg of group.packages) {
        expect(text, `${group.label} / ${pkg.name}`).toContain(pkg.name);
      }
    }
    expect(host.querySelectorAll(".atlas__group")).toHaveLength(repos.length);
    // No table, no per-package row: the band is a run per group.
    expect(host.querySelectorAll("table")).toHaveLength(0);
  });

  test("exactly 88 packages are rendered, one node each", () => {
    /* The atlas is a compact band rather than an 88-row table, so "did the
       compression drop anything" is the failure this guards: every package in
       content/skills.ts is one rendered node carrying its own slug. A package
       that disappears fails on the count AND on its missing slug. */
    const rendered = [...host.querySelectorAll("[data-package]")];
    expect(rendered).toHaveLength(88);
    expect(rendered).toHaveLength(
      repos.reduce((total, group) => total + group.packages.length, 0),
    );

    const slugs = rendered.map((node) => node.getAttribute("data-package"));
    const expected = repos.flatMap((group) =>
      group.packages.map((pkg) => pkg.slug),
    );
    expect(new Set(slugs)).toEqual(new Set(expected));
    expect(slugs).toHaveLength(new Set(slugs).size);

    for (const group of repos) {
      const groupNode = host.querySelector(
        `[data-atlas-group="${group.label}"]`,
      );
      expect(groupNode, group.label).not.toBeNull();
      expect(
        groupNode!.querySelectorAll("[data-package]"),
        group.label,
      ).toHaveLength(group.packages.length);
    }
  });

  test("the delivery figure appears exactly once", () => {
    const matches = (host.textContent ?? "").match(/1,182/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  test("one contact CTA phrase, used for every contact action", () => {
    const actions = [
      ...host.querySelectorAll<HTMLAnchorElement>(
        'a[href^="mailto:"], a[href="/#contact"]',
      ),
    ];
    expect(actions.length).toBeGreaterThanOrEqual(2);
    const phrases = new Set(
      actions.map((action) => (action.textContent ?? "").trim()),
    );
    // The direct address is a mailto link too, but it is an address, not a
    // phrase; every phrase-shaped action says the same thing.
    const phraseActions = [...phrases].filter(
      (phrase) => phrase && !phrase.includes("@"),
    );
    expect(phraseActions).toEqual([CONTACT_CTA]);
    expect(CONTACT_CTA).toBe("Email me");
  });

  test("the retired CTA phrasings are gone from the sources", () => {
    const retired = [
      "Ask about this work",
      "Ask about a specific stack",
      "Start a conversation about this work",
      "Write an email",
    ];
    const components = [
      "src/components/Record.tsx",
      "src/components/FirstScreen.tsx",
      "src/components/Contact.tsx",
      "src/components/Experience.tsx",
      "src/components/Projects.tsx",
      "src/components/Footer.tsx",
      "src/components/Header.tsx",
    ];
    for (const file of components) {
      const source = readFileSync(resolve(root, file), "utf8");
      for (const phrase of retired) {
        expect(source, `${file} still says "${phrase}"`).not.toContain(phrase);
      }
    }
    for (const phrase of retired) {
      expect(host.textContent ?? "").not.toContain(phrase);
    }
  });
});
