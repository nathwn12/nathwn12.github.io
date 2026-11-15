// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { NpmDownloadsReadout } from "../src/components/NpmDownloadsReadout";
import packageNames from "../src/content/npm-packages.json";
import snapshot from "../src/content/npm-downloads.json";

let host: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
    true;
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(createElement(NpmDownloadsReadout)));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

describe("npm downloads readout", () => {
  test("defines the all-time period, source, snapshot date, and complete package set", () => {
    const section = host.querySelector<HTMLElement>("[data-npm-downloads]");
    expect(section?.dataset.freshness).toBe("fresh");
    expect(section?.textContent).toContain("All-time npm package downloads");
    expect(section?.textContent).toContain("Sum of downloads for 9 packages");
    expect(section?.textContent).toContain("npm registration date");
    expect(section?.textContent).toContain("Source: npm download-count API.");
    expect(section?.textContent).toContain("Nov 12, 2026");
    expect(section?.textContent).toContain(
      "not a count of unique people or installs",
    );
    expect(
      [...section!.querySelectorAll("ul a")].map((link) => link.textContent),
    ).toEqual(packageNames.map((name) => `${name} on npm, opens in a new tab`));
    expect(section?.textContent).toContain(
      new Intl.NumberFormat("en-US").format(snapshot.total),
    );
  });
});
