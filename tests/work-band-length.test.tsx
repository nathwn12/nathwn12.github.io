// @vitest-environment jsdom
/**
 * The home work band's length cap.
 *
 * The record's band shows the featured four; the other nine live on `/projects`
 * with their case notes, and the "All projects" link carries the reader there.
 * That is a deliberate length decision, so it is pinned: a fifth row creeping
 * back into the band is how the page became a scroll fest in the first place.
 *
 *   bunx vitest run tests/work-band-length.test.tsx
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { WorkBand } from "../src/components/WorkBand";
import Projects from "../src/components/Projects";
import { projects } from "../src/content/projects";

let host: HTMLDivElement;
let mounted: Root | null = null;

async function mount(element: ReturnType<typeof createElement>) {
  host = document.createElement("div");
  document.body.appendChild(host);
  mounted = createRoot(host);
  await act(async () => {
    mounted!.render(element);
  });
}

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
  if (mounted) {
    await act(async () => {
      mounted!.unmount();
    });
    mounted = null;
  }
  host?.remove();
});

describe("the home work band is four rows", () => {
  test("it renders at most four rows, and never more", async () => {
    await mount(createElement(WorkBand));
    const rows = host.querySelectorAll("[data-work-row]");
    expect(rows.length).toBeLessThanOrEqual(4);
    expect(rows).toHaveLength(4);
  });

  test("the band still carries the way to the full list", async () => {
    await mount(createElement(WorkBand));
    const all = [...host.querySelectorAll("a")].find(
      (link) => link.textContent?.trim() === "All projects",
    );
    expect(all, "the band lost its link to /projects").toBeDefined();
    expect(all!.getAttribute("href")).toBe("/projects");
  });

  test("the nine that left the band are all on /projects", async () => {
    await mount(createElement(Projects));
    const shown = new Set(
      [...host.querySelectorAll("[data-project-row] h3")].map((node) =>
        node.textContent?.trim(),
      ),
    );
    for (const project of projects) {
      expect(shown, `${project.name} is missing from /projects`).toContain(
        project.name,
      );
    }
    expect(shown.size).toBe(projects.length);
  });
});
