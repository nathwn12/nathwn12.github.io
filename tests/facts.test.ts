// @vitest-environment jsdom
/**
 * The fact floor, in one place.
 *
 * Every figure and credential below is a delivered fact. The redesign may
 * rewrite the voice, but it may not move, round, repeat-away, or drop these.
 * The 60s→1s and >40% wins, the recovered 1,182 / 17, the four credential IDs,
 * the exact employer and dates, and the corrected availability claim are all
 * asserted here; `src/content/**` remains their single source.
 *
 *   pnpm vitest run tests/facts.test.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { RecordPage } from "../src/components/RecordPage";
import { credentials } from "../src/content/credentials";
import {
  commitTotal,
  employer,
  experience,
  provenance,
  repositoryCount,
  tenureEnd,
  tenureSpan,
} from "../src/content/experience";
import { availability } from "../src/content/hero";
import { archived, projects } from "../src/content/projects";

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const payments = experience.find((entry) => entry.id === "02");
const dataAccess = experience.find((entry) => entry.id === "04");

let host: HTMLDivElement;
let rootNode: Root | null = null;

beforeEach(async () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  rootNode = createRoot(host);
  await act(async () => {
    rootNode!.render(createElement(RecordPage));
  });
});

afterEach(async () => {
  if (rootNode) {
    await act(async () => {
      rootNode!.unmount();
    });
    rootNode = null;
  }
  host?.remove();
});

describe("the delivered figures", () => {
  test("the payments win keeps 98%, 60 seconds, and under one second", () => {
    expect(payments?.outcome).toContain("98%");
    expect(payments?.description).toContain("about 60 seconds to under one second");
    expect(host.textContent).toContain("98%");
    expect(host.textContent).toContain("about 60 seconds to under one second");
  });

  test("the data-access win keeps over 40%", () => {
    expect(dataAccess?.outcome).toContain("over 40%");
    expect(host.textContent).toContain("over 40%");
  });

  test("the recovered record keeps 1,182 commits across 17 repositories", () => {
    expect(commitTotal).toBe(1182);
    expect(repositoryCount).toBe(17);
    expect(host.textContent).toContain("1,182");
    expect(host.textContent).toContain("17 repositories");
    expect(provenance).toContain("21 scanned internal repositories");
  });

  test("the employer, role, and dates are exact", () => {
    expect(employer.company).toBe("Xentra Infotech Solutions Inc.");
    expect(employer.role).toBe("Backend Developer");
    expect(employer.period).toBe("March 2023 to May 2026");
    expect(tenureEnd).toBe("May 2026");
    expect(tenureSpan).toBe("March 2023 – May 2026");
    expect(host.textContent).toContain("March 2023 – May 2026");
  });

  test("the four credentials keep their exact names and IDs", () => {
    expect(credentials.map((credential) => credential.id).sort()).toEqual([
      "FA69CEB39205E003",
      "FC46A72A0806A19E",
      "NEBB575RT5LU",
      "RFS2G5ZT9GPK",
    ]);
    for (const credential of credentials) {
      expect(credential.title.length).toBeGreaterThan(3);
      expect(credential.url).toMatch(/^https:\/\//);
    }
  });

  test("all eleven projects remain, and retired work stays retired", () => {
    expect(projects).toHaveLength(11);
    expect(archived).toHaveLength(1);
    expect(projects.some((project) => project.dir === archived[0].dir)).toBe(false);
  });
});

describe("the availability claim", () => {
  /* The owner confirmed remote on 2026-10-28. This test fails if the confirmed
     wording is missing and if the unqualified wording returns; it is strict on
     the exact bytes, including the em dash. */
  const AVAILABILITY = "Open to backend roles — remote.";

  test("is exactly the confirmed wording, remote included", () => {
    expect(availability).toBe(AVAILABILITY);
    expect(read("src/content/hero.ts")).toContain(`"${AVAILABILITY}"`);
    expect(read("public/llms.txt")).toContain(AVAILABILITY);
  });

  test("the unqualified availability string cannot come back", () => {
    for (const file of ["src/content/hero.ts", "public/llms.txt"]) {
      expect(read(file), file).not.toContain("Open to backend roles.");
    }
  });

  test("attaches no other unconfirmed term to it", () => {
    expect(availability).not.toMatch(/hybrid|salary|notice/i);
    expect(read("public/llms.txt")).not.toMatch(/hybrid|salary/i);
  });
});
