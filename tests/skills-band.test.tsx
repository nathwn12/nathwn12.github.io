// @vitest-environment jsdom
/**
 * The skills index: all 88 packages on /record, in their six groups, and absent
 * from the cover.
 *
 * The band exists so a content change cannot silently drop rows: the rendered
 * order is compared against the content module itself, so a package that is
 * removed from `src/content/skills.ts` still fails this file (the 88 count is
 * pinned) and a package that is dropped from the render fails the order
 * comparison.
 *
 *   pnpm vitest run tests/skills-band.test.tsx
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { RecordPage } from "../src/components/RecordPage";
import { Home } from "../src/pages/Home";
import { repos, TIER_WORDS } from "../src/content/skills";

const repoRoot = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const ALL_PACKAGES = repos.flatMap((group) =>
  group.packages.map((pkg) => pkg.name),
);

let host: HTMLDivElement;
let root: Root | null = null;

async function mount(element: ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(element);
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

describe("skills index on /record", () => {
  test("renders all 88 packages, in content order", async () => {
    await mount(createElement(RecordPage));
    expect(ALL_PACKAGES).toHaveLength(88);
    const rendered = [...host.querySelectorAll("[data-pkg]")].map((node) =>
      node.textContent?.trim(),
    );
    expect(rendered).toEqual(ALL_PACKAGES);
  });

  test("groups them under the six group names the content file carries", async () => {
    await mount(createElement(RecordPage));
    const groups = [...host.querySelectorAll("[data-group]")].map((node) =>
      node.getAttribute("data-group"),
    );
    expect(groups).toEqual(repos.map((group) => group.label));
    expect(groups).toHaveLength(6);
    const headings = [...host.querySelectorAll(".skills-group-label")].map(
      (node) => node.textContent?.trim(),
    );
    expect(headings).toEqual(repos.map((group) => group.label));
  });

  test("states the three tiers in words, once", async () => {
    await mount(createElement(RecordPage));
    const legend = host.querySelector(".skills-legend");
    for (const word of Object.values(TIER_WORDS)) {
      expect(legend?.textContent).toContain(word);
    }
    expect(host.querySelectorAll(".skills-legend")).toHaveLength(1);
  });

  test("carries no table, no zebra rows, and no card border", async () => {
    await mount(createElement(RecordPage));
    const band = host.querySelector(".skills-band");
    expect(band).not.toBeNull();
    expect(band!.querySelector("table")).toBeNull();
    expect(band!.querySelector("[class*='zebra']")).toBeNull();
    expect(band!.querySelectorAll("[class*='card']")).toHaveLength(0);

    /* The band's own CSS rule adds no border, no background, and no shadow: the
       separation is type and space, not chrome. */
    const css = read("src/index.css");
    const bandRule = css.match(/\.skills-band\s*\{[^}]*\}/)?.[0] ?? "";
    expect(bandRule).toContain("padding");
    expect(bandRule).not.toMatch(/border|background|box-shadow/);
  });
});

describe("the cover is untouched", () => {
  test("the cover renders no skills band and no tier vocabulary", async () => {
    await mount(createElement(Home));
    expect(host.querySelector(".skills-band")).toBeNull();
    expect(host.querySelector("[data-pkg]")).toBeNull();
    expect(host.textContent).not.toContain("Daily driver");
  });
});
