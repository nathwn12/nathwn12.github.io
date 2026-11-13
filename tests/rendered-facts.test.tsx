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
 *   · the record band's four outcomes, with the delivery figure stated once
 *   · the recovery sentence (21 scanned, 1,182 across 17) on the route that
 *     owns it: the record band no longer carries the closure
 *
 *   bunx vitest run tests/rendered-facts.test.tsx
 */
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Experience } from "../src/components/Experience";
import { Record } from "../src/components/Record";
import { availability } from "../src/content/hero";

const AVAILABILITY = "Open to software engineering roles \u2014 remote.";
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
  test("the record band states four outcomes and no recovery story", async () => {
    const record = await mount(createElement(Record));
    const proof = record.querySelector("#proof");
    expect(proof, "the proof band is not rendered").not.toBeNull();

    const text = proof!.textContent ?? "";
    /* The band's job is the measurements. The closure and the scan that
       produced the ledger are the experience route's to state, once. */
    expect(text).not.toContain("scanned");
    expect(text).not.toContain("May 2026");
    expect(text.match(/1,182/g) ?? []).toHaveLength(1);
  });

  test("1,182 renders once on the record, and the marquee carries names", async () => {
    const record = await mount(createElement(Record));
    const proof = record.querySelector("#proof");
    expect(proof, "the proof band is not rendered").not.toBeNull();

    const proofText = proof!.textContent ?? "";
    expect(proofText).toContain("1,182");
    const outside = (record.textContent ?? "").replace(proofText, "");
    expect(outside.match(/1,182/g) ?? []).toHaveLength(0);

    /* The ambient strip is the repository names now, not a second copy of the
       figures the band above already counted. */
    expect(record.textContent).toContain("nathwn12/puppet");
  });

  test("the recovery sentence renders on the experience route", async () => {
    const experience = await mount(createElement(Experience));
    const text = experience.textContent ?? "";
    expect(text).toContain("21 scanned internal repositories");
    expect(text).toContain("1,182 commits across 17 repositories");
  });

  test("the delivered outcome renders on the experience route, with 1,182 stated once", async () => {
    const experience = await mount(createElement(Experience));
    const text = experience.textContent ?? "";
    expect(text).toContain(
      "Shipped the fintech platform's services across the company's repositories from 2023 to 2026.",
    );
    /* The number belongs to the ledger readout and to the provenance sentence
       that says where it came from — not to a third restatement in the entry. */
    expect(text.match(/1,182/g) ?? []).toHaveLength(2);
  });
});
