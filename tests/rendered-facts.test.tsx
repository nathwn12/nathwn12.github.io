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
 *   · the provenance's scanned / carrying repository figures (21 and 17)
 *   · the delivery figure (1,182) on the record and in the delivered outcome
 *
 *   bunx vitest run tests/rendered-facts.test.tsx
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
    const first = record.querySelector('[data-band="cover"]');
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
  test("the provenance sentence renders 21 scanned and 1,182 across 17 repositories", async () => {
    const record = await mount(createElement(Record));
    const proof = record.querySelector("#proof");
    expect(proof, "the proof band is not rendered").not.toBeNull();

    const text = proof!.textContent ?? "";
    // The delivered sentence, quoted: it is where both counts are stated.
    expect(text).toContain("21 scanned internal repositories");
    expect(text).toContain("1,182 commits across 17 repositories");
  });

  test("1,182 renders on the record: in the provenance, and in the marquee", async () => {
    const record = await mount(createElement(Record));
    const proof = record.querySelector("#proof");
    expect(proof, "the proof band is not rendered").not.toBeNull();

    /* The strip states the three measured results. The delivery figure is the
       provenance's own sentence, and the marquee below the band carries it
       twice — the second copy `aria-hidden`, so a screen reader hears it once. */
    const proofText = proof!.textContent ?? "";
    expect(proofText).toContain("1,182");
    const outside = (record.textContent ?? "").replace(proofText, "");
    expect(outside.match(/1,182/g) ?? []).toHaveLength(2);
  });

  test("the delivered outcome carrying 1,182 renders on the experience route", async () => {
    const experience = await mount(createElement(Experience));
    expect(experience.textContent).toContain(
      "Shipped 1,182 commits across 17 repositories.",
    );
  });
});
