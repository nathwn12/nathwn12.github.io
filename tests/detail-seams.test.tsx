// @vitest-environment jsdom
/**
 * Detail-route seams — one rule per seam.
 *
 * A band that already closes on its own rule must not also be given a drawn
 * seam: on /experience the seam sat 1px above the commit strip's top border
 * (a 2px line at 1440), and on /projects a drawn seam sat 49px above the
 * table's own top border (an empty 48px strip between two rules). The record's
 * home bands close on one rule; the detail routes close the same way.
 *
 * Both assertions below can go red:
 *
 *   bunx vitest run tests/detail-seams.test.tsx
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Experience } from "../src/components/Experience";
import Projects from "../src/components/Projects";

let host: HTMLDivElement;
let root: Root | null = null;

async function render(node: ReturnType<typeof createElement>) {
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
    root!.render(node);
  });
}

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

const classes = (el: Element | null) =>
  (el?.className ?? "").toString().split(/\s+/).filter(Boolean);

describe("detail-route seams", () => {
  test("/experience: the seam is the commit strip's only top rule", async () => {
    await render(createElement(Experience));

    const seam = host.querySelector('[aria-hidden="true"].rule');
    expect(seam, "the header band lost its seam").not.toBeNull();

    const strip = seam!.nextElementSibling;
    expect(strip, "nothing follows the seam").not.toBeNull();
    // One rule: the drawn seam above, the strip's own closing rule below.
    expect(classes(strip)).not.toContain("border-y");
    expect(classes(strip)).toContain("border-b");
  });

  test("/projects: the table's own top rule is the seam", async () => {
    await render(createElement(Projects));

    // No drawn seam on this route: the first row's border-t closes the band.
    expect(host.querySelector(".rule")).toBeNull();

    const list = host.querySelector("ol");
    expect(list, "the repository table is missing").not.toBeNull();
    expect(classes(list)).toContain("border-b");
    expect(classes(list!.querySelector(":scope > li"))).toContain("border-t");
  });
});
