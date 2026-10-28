// @vitest-environment jsdom
/**
 * The cover guarantee: the landing opens on the name and a static claim.
 *
 *  - Exactly one h1, whose accessible name is the owner's name.
 *  - The claim is the real copy at first paint, not a typing animation.
 *  - Availability is the confirmed claim: "Open to backend roles — remote.",
 *    and no hybrid, salary, or notice-period wording is attached to it.
 *  - The recovered 1,182 / 17 fact is on the first screen.
 *  - No pause/play/ticker control exists anywhere in the cover.
 *
 *   pnpm vitest run tests/hero.test.ts
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Cover } from "../src/components/Cover";
import { availability, heroClaim } from "../src/content/hero";
import { commitTotal, repositoryCount } from "../src/content/experience";

let host: HTMLDivElement;
let root: Root | null = null;

async function mount() {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(createElement(Cover));
  });
}

beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  if (root) {
    await act(async () => {
      root!.unmount();
    });
    root = null;
  }
  host?.remove();
});

describe("cover masthead", () => {
  it("renders exactly one h1: the nameplate", async () => {
    await mount();
    const headings = host.querySelectorAll("h1");
    expect(headings).toHaveLength(1);
    expect(headings[0]?.getAttribute("aria-label")).toBe(
      "Nathaniel Nikolai Ladero",
    );
    expect(headings[0]?.className).toMatch(/hero-name/);
  });

  it("states the opening claim statically at first paint", async () => {
    await mount();
    expect(heroClaim).toBe(
      "Payment backends that hold up under production load.",
    );
    const claim = host.querySelector(".hero-claim");
    expect(claim?.textContent).toBe(heroClaim);
    // No rotating span, no cursor, no aria-live deck.
    expect(host.querySelectorAll(".hero-claim span")).toHaveLength(0);
  });

  it("states the confirmed availability, remote included", async () => {
    await mount();
    expect(availability).toBe("Open to backend roles — remote.");
    const line = host.querySelector(".hero-avail");
    expect(line?.textContent).toBe("Open to backend roles — remote.");
    expect(line?.textContent).not.toMatch(/hybrid|salary|notice/i);
  });

  it("prints the recovered commit fact on the first screen", async () => {
    await mount();
    expect(commitTotal).toBe(1182);
    expect(repositoryCount).toBe(17);
    const fact = host.querySelector(".hero-fact");
    expect(fact?.textContent).toContain("1,182");
    expect(fact?.textContent).toContain("17");
    expect(fact?.textContent).toContain("2023–2026");
  });

  it("offers no pause/play/ticker control anywhere in the cover", async () => {
    await mount();
    const controls = host.querySelectorAll(
      "button, a, input, select, textarea, [role='button']",
    );
    const named = Array.from(controls).filter((element) => {
      const name = (
        element.getAttribute("aria-label") ??
        element.textContent ??
        ""
      ).toLowerCase();
      return /pause|play|ticker/.test(name);
    });
    expect(named).toHaveLength(0);
  });
});
