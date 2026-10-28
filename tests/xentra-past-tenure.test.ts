// @vitest-environment jsdom
/**
 * Xentra is historical employment, never a current role or partnership.
 *
 * Every surface that names the company states the role as former, while the
 * delivered record stays intact: exact company name, role, and date range are
 * unchanged. Each assertion below can go red.
 *
 *   pnpm vitest run tests/xentra-past-tenure.test.ts
 */
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { Cover } from "../src/components/Cover";
import { RecordPage } from "../src/components/RecordPage";
import { AboutBand } from "../src/components/AboutBand";
import {
  employer,
  formerRoleLine,
  latestRecordDate,
  provenance,
  tenureEnd,
} from "../src/content/experience";
import { ROUTES } from "../src/lib/router";

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

/** Components that print the role line must use the past-tense constant. */
const ROLE_SURFACES = [
  "src/components/Cover.tsx",
  "src/components/RecordPage.tsx",
];

describe("Xentra is stated as past employment", () => {
  test("the delivered record keeps its exact company, role, and dates", () => {
    expect(employer.company).toBe("Xentra Infotech Solutions Inc.");
    expect(employer.role).toBe("Backend Developer");
    expect(employer.period).toBe("March 2023 to May 2026");
  });

  test("the past-tense role line names the role and the exact company", () => {
    expect(formerRoleLine).toBe(
      "Formerly a Backend Developer at Xentra Infotech Solutions Inc.",
    );
  });

  test("every role surface renders the former-employment line", () => {
    for (const rel of ROLE_SURFACES) {
      expect(read(rel), rel).toContain("formerRoleLine");
      // No surface may compose a bare present-tense "role at company" line.
      expect(read(rel), rel).not.toMatch(/employer\.role\}\s*(?:at\b|,)/);
    }
  });

  test("the About band labels the role as a former role", () => {
    const about = read("src/components/AboutBand.tsx");
    expect(about).toContain("Former role");
    expect(about).toMatch(/\{employer\.role\}, \{employer\.company\}/);
    expect(about).not.toContain("employer.role} at");
  });

  test("the record route meta description leads with the past framing", () => {
    const route = ROUTES.find((entry) => entry.path === "/record");
    expect(route?.metaDescription).toContain(formerRoleLine);
  });

  test("provenance keeps the closure in the past", () => {
    expect(provenance).toContain("after Xentra closed in May 2026");
  });

  test("the tenure end month and the newest dated entry are exact", () => {
    expect(tenureEnd).toBe("May 2026");
    expect(latestRecordDate).toBe("November 2025");
  });

  test("published llms.txt names the role as former", () => {
    expect(read("public/llms.txt")).toContain(
      "Formerly a Backend Developer at Xentra Infotech Solutions Inc.",
    );
  });
});

let host: HTMLDivElement;
let rootNode: Root | null = null;

async function mount(element: ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  rootNode = createRoot(host);
  await act(async () => {
    rootNode!.render(element);
  });
}

beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
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

describe("the rendered record reads as past employment", () => {
  test("the cover names the former role and the closed tenure", async () => {
    await mount(createElement(Cover));
    const text = host.textContent ?? "";
    expect(text).toContain(
      "Formerly a Backend Developer at Xentra Infotech Solutions Inc.",
    );
    expect(text).toContain("March 2023 – May 2026, remote.");
    // The old present-tense composition never reaches the page.
    expect(text).not.toContain("Backend Developer, Xentra");
  });

  test("the record page states the continuous tenure and the latest entry", async () => {
    await mount(createElement(RecordPage));
    const text = host.textContent ?? "";
    expect(text).toContain(
      "Formerly a Backend Developer at Xentra Infotech Solutions Inc., Remote.",
    );
    expect(text).toContain("March 2023 – May 2026");
    expect(text).toContain("November 2025");
    expect(text).not.toContain("Backend Developer, Xentra");
  });

  test("the About band never reads as a current role", async () => {
    await mount(createElement(AboutBand));
    const text = host.textContent ?? "";
    expect(text).toContain("Former role");
    expect(text).toContain("Backend Developer, Xentra Infotech Solutions Inc.");
  });
});
