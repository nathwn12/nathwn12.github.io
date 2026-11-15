// @vitest-environment jsdom
/**
 * Experience timeline — the continuous tenure and the dated record are two
 * different things, and the page must say so.
 *
 * The route renders one labeled tenure span (March 2023 – May 2026) outside
 * the dated list, then a "Selected contributions" heading over the three role
 * periods, newest first.
 *
 * Every assertion below can go red:
 *
 *   pnpm vitest run tests/experience-timeline.test.tsx
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Experience } from "../src/components/Experience";

let host: HTMLDivElement;
let root: Root | null = null;

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
  root = createRoot(host);
  await act(async () => {
    root!.render(createElement(Experience));
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

describe("experience timeline", () => {
  test("states the continuous tenure as March 2023 – May 2026, outside the dated list", () => {
    const tenure = host.querySelector("[data-tenure-span]");
    expect(tenure, "the tenure span is missing").not.toBeNull();
    expect(tenure!.textContent).toContain("March 2023 – May 2026");
    expect(tenure!.textContent).toContain("Tenure");
    /* The company is named once on the page — in the closing note under this
       block — so the span states the period and nothing repeats it. */
    expect(tenure!.textContent).toContain(
      "Formerly a Backend Developer at Xentra Infotech Solutions Inc.",
    );
    expect(tenure!.textContent).not.toContain("Continuous employment at");
    // It is not one more dated record: the span lives outside the <ol>.
    expect(tenure!.closest("ol")).toBeNull();
  });

  test("labels the three role periods as selected contributions, newest first", () => {
    const heading = Array.from(host.querySelectorAll("h2")).find(
      (item) => item.textContent?.trim() === "Selected contributions",
    );
    expect(heading, "the dated list has no selected-contributions label").toBeTruthy();

    const list = host.querySelector("ol");
    expect(list, "the dated list is missing").not.toBeNull();
    const items = Array.from(list!.querySelectorAll(":scope > li"));
    expect(items).toHaveLength(3);

    const dates = items.map((item) =>
      item.querySelector("p")?.textContent?.trim(),
    );
    expect(dates).toEqual([
      "June 2024 – May 2026",
      "June 2023 – May 2024",
      "March 2023 – June 2023",
    ]);
  });

  test("the newest role period agrees with the tenure", () => {
    const text = host.textContent ?? "";
    expect(text).toContain(
      "The latest is June 2024 – May 2026; the tenure ran to May 2026.",
    );

    const dates = Array.from(host.querySelectorAll("[data-timeline-date]")).map(
      (item) => item.textContent?.trim() ?? "",
    );
    expect(dates[0]).toBe("June 2024 – May 2026");
    for (const invented of [
      "December 2025",
    ]) {
      expect(dates).not.toContain(invented);
    }
  });
});
