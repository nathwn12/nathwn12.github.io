// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { NpmDownloadsReadout } from "../src/components/NpmDownloadsReadout";
import packageNames from "../src/content/npm-packages.json";
import snapshot from "../src/content/npm-downloads.json";
import { downloadSnapshotFreshness } from "../src/lib/npm-downloads";

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
    // The component must report the validator's verdict, not a fixed word:
    // a stale snapshot renders "stale" here without failing this UI contract.
    expect(section?.dataset.freshness).toBe(
      downloadSnapshotFreshness(snapshot, new Date(), packageNames).status,
    );
    expect(section?.textContent).toContain("All-time npm package downloads");
    expect(section?.textContent).toContain("Sum of downloads for 9 packages");
    expect(section?.textContent).toContain("npm registration date");
    expect(section?.textContent).toContain("Source: npm download-count API.");
    const through = new Date(`${snapshot.snapshotDate}T00:00:00Z`).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" },
    );
    expect(section?.textContent).toContain(through);
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
