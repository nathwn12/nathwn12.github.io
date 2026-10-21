// @vitest-environment jsdom
/**
 * Hero meta rail — five instrument readings beside the statement (below the
 * stack line at smaller widths), every value read from an existing content
 * module. Mounts the real Hero with the heavy bands stubbed out, exactly
 * like tests/hero.test.ts.
 *
 * Every count below can go red:
 *
 *   pnpm vitest run tests/hero-meta.test.tsx
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Hero } from "../src/components/Hero";
import { employer, experience } from "../src/content/experience";
import { availability } from "../src/content/hero";
import { projects } from "../src/content/projects";

vi.mock("../src/components/SystemAtlas", () => ({
  SystemAtlas: () => null,
}));
vi.mock("../src/components/ProofBand", () => ({
  ProofBand: () => null,
  CredentialsStrip: () => null,
}));
vi.mock("../src/components/WorkTeaser", () => ({
  WorkTeaser: () => null,
}));
vi.mock("../src/components/PageFoot", () => ({
  PageFoot: () => null,
}));
vi.mock("../src/components/ExperienceBand", () => ({
  ExperienceBand: () => null,
}));
vi.mock("../src/components/ForwardBand", () => ({
  ForwardBand: () => null,
}));

let host: HTMLDivElement;
let root: Root | null = null;

beforeEach(() => {
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

describe("hero meta rail", () => {
  test("five readings beside the statement, every value grounded in content", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(Hero));
    });
    const rail = host.querySelector('dl[aria-label="Profile summary"]');
    expect(rail, "meta rail renders").not.toBeNull();
    const text = rail!.textContent ?? "";
    // IMPACT from the payments entry (id "02"): the percentage figure lifted
    // out of its own `outcome` string, never typed — the rail row is first.
    const paymentsOutcome =
      experience.find((entry) => entry.id === "02")?.outcome ?? "";
    const figure = paymentsOutcome.match(/\d[\d,]*(?:\.\d+)?%/)?.[0];
    expect(figure, "payments outcome carries a percentage figure").not.toBeNull();
    expect(text).toContain(`IMPACT — ${figure} faster payments`);
    // LOCATION from the Contact address plate (Hagonoy, Bulacan, Philippines).
    expect(text).toContain("LOCATION — Philippines");
    // STATUS from src/content/hero.ts (`availability`), minus the remote tail.
    expect(availability).toBe("Open to backend roles — remote.");
    expect(text).toContain("STATUS — Open to backend roles");
    // EXPERIENCE from src/content/experience.ts (`employer.period`).
    expect(employer.period).toBe("March 2023 to May 2026");
    expect(text).toContain("EXPERIENCE — 3 yrs 2 mos");
    // LAST SHIP from src/content/projects.ts (the latest project year).
    const latest = String(
      Math.max(...projects.map((project) => Number(project.year))),
    );
    expect(text).toContain(`LAST SHIP — ${latest}`);
  });
});
