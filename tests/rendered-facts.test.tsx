// @vitest-environment jsdom
/**
 * Rendered facts — the record's non-negotiables must reach the screen.
 *
 * The source-level floor in `fact-floor.test.ts` proves the content modules
 * hold the right strings. That is not enough: deleting the element that renders
 * one of them leaves every source assertion green while the page loses the
 * fact. This file mounts the real components and reads the rendered output, so
 * each assertion fails when its line of markup is removed.
 *
 * Covered here:
 *   · the availability sentence, byte-exact with its em dash
 *   · the four credential IDs
 *   · the proof row's scanned/repository figures (21 and 17)
 *   · the delivery figure (1,182) on the record and in the delivered outcome
 *
 *   pnpm vitest run tests/rendered-facts.test.tsx
 */
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Experience } from "../src/components/Experience";
import { Record } from "../src/components/Record";
import { availability } from "../src/content/hero";

const AVAILABILITY = "Open to backend roles \u2014 remote.";
const CREDENTIAL_IDS = [
  "RFS2G5ZT9GPK",
  "NEBB575RT5LU",
  "FA69CEB39205E003",
  "FC46A72A0806A19E",
];

let host: HTMLDivElement;
let mounted: Root | null = null;

async function mount(element: ReactElement): Promise<HTMLDivElement> {
  host = document.createElement("div");
  document.body.appendChild(host);
  mounted = createRoot(host);
  await act(async () => {
    mounted!.render(element);
  });
  return host;
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

describe("the availability sentence reaches the screen", () => {
  test("renders exactly once, on the first screen, with the em dash", async () => {
    const record = await mount(createElement(Record));
    const first = record.querySelector("section.band--first");
    expect(first, "first screen is not rendered").not.toBeNull();

    const status = [...first!.querySelectorAll("p")].find(
      (paragraph) => paragraph.textContent?.trim() === AVAILABILITY,
    );
    expect(
      status,
      "the availability line is not rendered on the first screen",
    ).toBeDefined();

    /* The closing band used to repeat the sentence; the record now states it
       once, where a reader meets it, and a second copy fails here. */
    const contact = record.querySelector("#contact");
    expect(contact, "the contact band is not rendered").not.toBeNull();
    expect(contact!.textContent).not.toContain(AVAILABILITY);

    expect(record.textContent).toContain(AVAILABILITY);
    expect(record.textContent).not.toContain("Open to backend roles - remote.");
    expect(availability).toContain("\u2014");
  });
});

describe("the four credential IDs reach the screen", () => {
  test("every ID renders inside the credentials band", async () => {
    const record = await mount(createElement(Record));
    const band = record.querySelector("#credentials");
    expect(band, "the credentials band is not rendered").not.toBeNull();

    for (const id of CREDENTIAL_IDS) {
      expect(band!.textContent, id).toContain(id);
    }
  });
});

describe("the proof figures reach the screen", () => {
  test("the proof row renders 21 scanned and 17 carrying repositories", async () => {
    const record = await mount(createElement(Record));
    const proof = record.querySelector("#proof");
    expect(proof, "the proof band is not rendered").not.toBeNull();

    const text = proof!.textContent ?? "";
    expect(text).toContain("scanning 21 internal repositories");
    expect(text).toContain("17 of them carry the work");
  });

  test("1,182 renders on the record as a proof figure", async () => {
    const record = await mount(createElement(Record));
    const figures = [...record.querySelectorAll("#proof .record-row__figure")]
      .map((figure) => figure.textContent?.trim());
    expect(figures, "no proof figures rendered").toContain("1,182");
  });

  test("the delivered outcome carrying 1,182 renders on the experience route", async () => {
    const experience = await mount(createElement(Experience));
    expect(experience.textContent).toContain(
      "Shipped 1,182 commits across 17 repositories.",
    );
  });
});
