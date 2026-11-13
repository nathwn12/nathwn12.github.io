// @vitest-environment jsdom
/**
 * The projects band's one scrubbed readout.
 *
 * The band used to carry a sticky column that described "the active row" and
 * could be wrong: the pointer crossing a row latched it, so wheeling down the
 * list with the cursor resting on one row kept the panel naming that row while
 * nine others went past. The readout is back because a single panel is a better
 * way to read thirteen rows than thirteen repeated meta lines — but it is
 * derived from scroll position on every frame, so it cannot show the previous
 * row's data. {@link activeIndexAt} is the whole of that logic and is pure, so
 * this file can pin it exactly.
 *
 *   bunx vitest run tests/project-readout.test.tsx
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Projects from "../src/components/Projects";
import { ProjectReadout } from "../src/components/ProjectReadout";
import { activeIndexAt } from "../src/lib/reading";
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

describe("activeIndexAt reads the row at the reading line", () => {
  /* Twelve rows, each 200px tall, starting at the reading line's own height:
     the fixture is a list that has been scrolled into view. */
  const tops = Array.from({ length: 12 }, (_, index) => index * 200 - 400);

  test("a row is active from its own top until the next row's", () => {
    expect(activeIndexAt(tops, -400)).toBe(0);
    expect(activeIndexAt(tops, -201)).toBe(0);
    expect(activeIndexAt(tops, -200)).toBe(1);
    expect(activeIndexAt(tops, 399)).toBe(3);
    expect(activeIndexAt(tops, 400)).toBe(4);
  });

  test("above the list the first row is active, below it the last", () => {
    expect(activeIndexAt(tops, -9000)).toBe(0);
    expect(activeIndexAt(tops, 9000)).toBe(tops.length - 1);
  });

  test("an empty list has no active row", () => {
    expect(activeIndexAt([], 0)).toBe(-1);
  });
});

describe("the readout names the active project", () => {
  test("it is one panel, carrying index, name, kind, stack and year", async () => {
    const first = projects[0];
    await mount(createElement(ProjectReadout, { projects }));

    const panels = host.querySelectorAll("[data-project-readout]");
    expect(panels).toHaveLength(1);

    const text = panels[0].textContent ?? "";
    expect(text).toContain("01");
    expect(text).toContain(first.name);
    expect(text).toContain(first.kind);
    expect(text).toContain(first.year);
    for (const tag of first.tech) expect(text, tag).toContain(tag);
  });

  test("a fork states its upstream rather than hiding it", async () => {
    const fork = projects.find((project) =>
      project.role.startsWith("Fork of "),
    );
    expect(fork, "no fork in the inventory").toBeDefined();

    /* The readout is one panel showing whichever project is active; the fork
       row's own wording is what it has to be able to state. */
    await mount(createElement(ProjectReadout, { projects: [fork!] }));
    const text = host.querySelector("[data-project-readout]")!.textContent ?? "";
    expect(text).toContain("fork of");
    expect(text).toContain(fork!.role.slice("Fork of ".length));
  });
});

describe("the projects band carries no per-row entrance", () => {
  test("no row is hidden or transformed until it is scrolled to", async () => {
    await mount(createElement(Projects));
    const rows = [...host.querySelectorAll<HTMLElement>("[data-project-row]")];
    expect(rows).toHaveLength(projects.length);

    for (const row of rows) {
      /* An entrance animation is a start state: opacity below 1, or a translate
         that only a scroll trigger lifts. Neither may exist on a row — the band
         is one scrubbed readout, not thirteen little reveals. */
      expect(row.className).not.toMatch(/\bopacity-0\b/);
      expect(row.className).not.toMatch(/\btranslate-y-/);
      expect(row.getAttribute("style") ?? "").not.toContain("opacity");
    }
  });

  test("the band renders exactly one readout", async () => {
    await mount(createElement(Projects));
    expect(host.querySelectorAll("[data-project-readout]")).toHaveLength(1);
  });
});
