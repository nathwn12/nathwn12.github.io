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
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ExperienceBand } from "../src/components/ExperienceBand";
import { Experience } from "../src/components/Experience";
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

/** Components that render the role line must use the past-tense constant. */
const ROLE_SURFACES = [
  "src/components/Hero.tsx",
  "src/components/Experience.tsx",
  "src/components/ExperienceBand.tsx",
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

  test("the experience route meta description leads with the past framing", () => {
    const route = ROUTES.find((entry) => entry.path === "/experience");
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

describe("experience band renders the role in the past", () => {
  let host: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(async () => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    // jsdom has no IntersectionObserver, which framer-motion's whileInView
    // needs at mount — a harness workaround, not component logic.
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
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(ExperienceBand));
    });
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    if (root) {
      await act(async () => {
        root!.unmount();
      });
      root = null;
    }
    host?.remove();
  });

  test("the rendered tenure sentence reads as former employment", () => {
    const text = host.textContent ?? "";
    expect(text).toContain(
      "Formerly a Backend Developer at Xentra Infotech Solutions Inc., Remote — March 2023 to May 2026, though the latest dated entry in the record is November 2025.",
    );
    // The old present-tense composition never reaches the page.
    expect(text).not.toContain("Backend Developer, Xentra");
  });

  test("the experience route states the end month without inventing a milestone", async () => {
    const routeHost = document.createElement("div");
    document.body.appendChild(routeHost);
    const routeRoot = createRoot(routeHost);
    await act(async () => {
      routeRoot.render(createElement(Experience));
    });
    const text = routeHost.textContent ?? "";
    // The continuous tenure and the dated record are stated as two facts.
    expect(text).toContain("March 2023 – May 2026");
    expect(text).toContain(
      "The latest is November 2025; the tenure ran to May 2026.",
    );
    // The real November 2025 date survives on its own entry.
    expect(text).toContain("November 2025");
    await act(async () => {
      routeRoot.unmount();
    });
    routeHost.remove();
  });
});
