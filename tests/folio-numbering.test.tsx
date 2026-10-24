// @vitest-environment jsdom
/**
 * Folio numbering — one number per band, derived from the band's own kicker.
 *
 * Defect 2026-10-21: the atlas margin printed "05" while its kicker read
 * "03 / System atlas", and "05" appeared twice. The folio is now derived
 * from the kicker (`folioFromKicker`), never passed, indexed, or counted
 * separately — and below `lg` the kicker alone carries the number (no inline
 * folio beside it), so the numeral prints exactly once at narrow widths.
 *
 * For every band on every route: the rendered folio equals the leading
 * number of its kicker, and the landing/route sequences ascend with no
 * duplicates. Every assertion below can go red:
 *
 *   pnpm vitest run tests/folio-numbering.test.tsx
 */
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { folioFromKicker } from "../src/components/InstrumentBand";
import { ExperienceBand } from "../src/components/ExperienceBand";
import { WorkTeaser } from "../src/components/WorkTeaser";
import { SystemAtlas } from "../src/components/SystemAtlas";
import { ForwardBand } from "../src/components/ForwardBand";
import { CredentialsStrip } from "../src/components/ProofBand";
import { Experience } from "../src/components/Experience";
import { Skills } from "../src/components/Skills";
import Projects from "../src/components/Projects";
import { Contact } from "../src/components/Contact";

let host: HTMLDivElement;
let root: Root | null = null;
let getTotalLengthOrig: (() => number) | undefined;
let getTotalLengthTarget: object | undefined;

beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  // jsdom has no IntersectionObserver (framer-motion's whileInView) and no
  // matchMedia (the atlas layout hook) — harness workarounds, not logic.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
  // jsdom implements no SVG geometry (the atlas pulse timing reads
  // path.getTotalLength) — a fixed length is enough for the header assertions.
  const svgProto = (window as unknown as Record<string, object | undefined>)
    .SVGElement;
  getTotalLengthTarget =
    (svgProto as { prototype?: object } | undefined)?.prototype ??
    window.Element.prototype;
  getTotalLengthOrig = (
    getTotalLengthTarget as Record<string, (() => number) | undefined>
  ).getTotalLength;
  (
    getTotalLengthTarget as Record<string, () => number>
  ).getTotalLength = () => 100;
});

afterEach(async () => {
  vi.unstubAllGlobals();
  if (getTotalLengthTarget && getTotalLengthOrig) {
    (getTotalLengthTarget as Record<string, () => number>).getTotalLength =
      getTotalLengthOrig;
    getTotalLengthOrig = undefined;
    getTotalLengthTarget = undefined;
  }
  if (root) {
    await act(async () => {
      root!.unmount();
    });
    root = null;
  }
  host?.remove();
});

async function mount(element: ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(element);
  });
}

/** The band's folio numeral and its kicker text, read from the live DOM. */
function folioAndKicker(): { folio: string; kicker: string; header: string } {
  const folios = host.querySelectorAll(".folio-numeral");
  expect(folios.length, "exactly one margin folio per band").toBe(1);
  const kickerEl = host.querySelector('span[class*="tracking-"]');
  expect(kickerEl, "band renders its kicker").not.toBeNull();
  const kicker = kickerEl!.textContent?.trim() ?? "";
  const header = kickerEl!.parentElement?.textContent ?? "";
  return { folio: folios[0].textContent?.trim() ?? "", kicker, header };
}

describe("folioFromKicker", () => {
  test("takes the leading number before the slash", () => {
    expect(folioFromKicker("03 / System atlas")).toBe("03");
    expect(folioFromKicker("09 / Contact")).toBe("09");
  });

  test("throws on a kicker with no leading number", () => {
    expect(() => folioFromKicker("Experience")).toThrow();
  });
});

describe("landing bands", () => {
  test("folio equals the kicker number, ascending 01–05 with no duplicates", async () => {
    const bands: ReactElement[] = [
      createElement(ExperienceBand),
      createElement(WorkTeaser),
      createElement(SystemAtlas),
      createElement(ForwardBand),
      createElement(CredentialsStrip),
    ];
    const folios: string[] = [];
    for (const band of bands) {
      await mount(band);
      const { folio, kicker, header } = folioAndKicker();
      const leading = kicker.match(/^(\d{2})\s*\//)?.[1];
      expect(leading, `kicker carries a leading number (got ${kicker})`).toBeDefined();
      expect(folio, `folio matches kicker "${kicker}"`).toBe(leading);
      // Below-lg rule: the kicker alone carries the number — it appears
      // exactly once in the header row, never as "01 01 / Experience".
      expect(
        header.split(folio).length - 1,
        `number prints once in "${header.trim()}"`,
      ).toBe(1);
      folios.push(folio);
      await act(async () => {
        root!.unmount();
      });
      root = null;
      host.remove();
    }
    expect(folios).toEqual(["01", "02", "03", "04", "05"]);
  });
});

describe("route title blocks", () => {
  test("folio equals the kicker number, ascending 06–09 with no duplicates", async () => {
    const routes: ReactElement[] = [
      createElement(Experience),
      createElement(Skills),
      createElement(Projects),
      createElement(Contact),
    ];
    const folios: string[] = [];
    for (const route of routes) {
      await mount(route);
      const { folio, kicker, header } = folioAndKicker();
      const leading = kicker.match(/^(\d{2})\s*\//)?.[1];
      expect(leading, `kicker carries a leading number (got ${kicker})`).toBeDefined();
      expect(folio, `folio matches kicker "${kicker}"`).toBe(leading);
      expect(
        header.split(folio).length - 1,
        `number prints once in "${header.trim()}"`,
      ).toBe(1);
      folios.push(folio);
      await act(async () => {
        root!.unmount();
      });
      root = null;
      host.remove();
    }
    expect(folios).toEqual(["06", "07", "08", "09"]);
  });
});
