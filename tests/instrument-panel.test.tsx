// @vitest-environment jsdom
/**
 * Instrument panel — the owner brief 2026-10-21 visual upgrade.
 *
 *  1. No horizontal rule crosses a centred column: no `<section>` carries a
 *     `border-t`; every rule lives inside the band's content cell, which owns
 *     the vertical hairline.
 *  2. Editorial headers: each landing band renders its kicker and a Fraunces
 *     `text-display` heading (routes: same kicker + column rule treatment).
 *  3. Scroll progress: a compositor-only `scaleX()` fill above the header,
 *     static under reduced motion.
 *
 * (The hero meta rail is covered in tests/hero-meta.test.tsx.)
 *
 * Every count below can go red:
 *
 *   pnpm vitest run tests/instrument-panel.test.tsx
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ExperienceBand } from "../src/components/ExperienceBand";
import { WorkTeaser } from "../src/components/WorkTeaser";
import { ForwardBand } from "../src/components/ForwardBand";
import { CredentialsStrip } from "../src/components/ProofBand";

const rootDir = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(rootDir, rel), "utf8");

let host: HTMLDivElement;
let root: Root | null = null;

function stubObservers() {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}

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
  stubObservers();
});

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

describe("column-edge rules", () => {
  test("no section carries a full-width border-t across the sheet", () => {
    for (const file of [
      "src/components/Hero.tsx",
      "src/components/ExperienceBand.tsx",
      "src/components/WorkTeaser.tsx",
      "src/components/ForwardBand.tsx",
      "src/components/ProofBand.tsx",
      "src/components/SystemAtlas.tsx",
      "src/components/Experience.tsx",
      "src/components/Projects.tsx",
      "src/components/Skills.tsx",
      "src/components/Contact.tsx",
    ]) {
      const source = read(file);
      expect(
        source.match(/<section[^>]*border-t/),
        `${file}: a section still carries a full-width rule`,
      ).toBeNull();
    }
  });

  test("every band opens on a heavy 3px bar at the container width", async () => {
    const bands: Array<[string, ReactElement]> = [
      ["experience", createElement(ExperienceBand)],
      ["work", createElement(WorkTeaser)],
      ["forward", createElement(ForwardBand)],
      ["credentials", createElement(CredentialsStrip)],
    ];
    for (const [name, element] of bands) {
      await mount(element);
      const section = host.querySelector("section");
      expect(section, `${name}: band renders a section`).not.toBeNull();
      // The heavy bar is container-width (inside max-w), never viewport-bleed.
      const bar = section!.querySelector("div.h-\\[3px\\].bg-text");
      expect(bar, `${name}: band opens on a heavy bar`).not.toBeNull();
      expect(
        bar!.closest("div.mx-auto"),
        `${name}: the bar sits inside the sheet container`,
      ).not.toBeNull();
      const rules = Array.from(section!.querySelectorAll(".border-t"));
      expect(rules.length, `${name}: band renders hairline rules`).toBeGreaterThan(
        0,
      );
      await act(async () => {
        root!.unmount();
      });
      root = null;
      host.remove();
    }
  });
});

describe("editorial headers", () => {
  test("landing bands render kickers above Fraunces headings", async () => {
    const bands: Array<[string, string, ReactElement]> = [
      ["01 / Experience", "Backend experience", createElement(ExperienceBand)],
      ["02 / Selected work", "Selected work", createElement(WorkTeaser)],
      ["04 / Forward", "Forward", createElement(ForwardBand)],
      ["05 / Credentials", "Credentials", createElement(CredentialsStrip)],
    ];
    for (const [kicker, title, element] of bands) {
      await mount(element);
      const text = host.textContent ?? "";
      expect(text).toContain(kicker);
      const heading = host.querySelector("h2");
      expect(heading?.textContent).toBe(title);
      expect(heading?.className).toMatch(/font-display/);
      await act(async () => {
        root!.unmount();
      });
      root = null;
      host.remove();
    }
  });

  test("the atlas band takes the same header treatment", () => {
    const source = read("src/components/SystemAtlas.tsx");
    expect(source).toMatch(/kicker="03 \/ System atlas"/);
    expect(source).toMatch(/title="System atlas"/);
    expect(source).toMatch(/<BandShell/);
  });

  test("route title blocks take the masthead + folio treatment", () => {
    for (const [file, kicker] of [
      ["src/components/Experience.tsx", "06 / Experience"],
      ["src/components/Projects.tsx", "08 / Projects"],
      ["src/components/Skills.tsx", "07 / Skills"],
      ["src/components/Contact.tsx", "09 / Contact"],
    ] as const) {
      const source = read(file);
      expect(source, `${file}: sheet grid`).toMatch(/GUTTER_GRID/);
      // The folio is derived from the route's own kicker constant — never a
      // separate index, and no inline folio renders beside the kicker.
      expect(source, `${file}: kicker constant`).toContain(`"${kicker}"`);
      expect(source, `${file}: derived folio`).toMatch(
        /<Folio index=\{folioFromKicker\(KICKER\)\}/,
      );
      expect(source, `${file}: no inline folio`).not.toMatch(/FolioInline/);
      expect(source, `${file}: kicker renders the constant`).toMatch(
        /<Kicker>\{KICKER\}<\/Kicker>/,
      );
      expect(source, `${file}: masthead title`).toMatch(/masthead-name/);
      expect(source, `${file}: heavy bars`).toMatch(/h-\[3px\] w-full bg-text/);
    }
  });
});

describe("scroll progress", () => {
  test("a compositor-only scaleX fill above the header, static when reduced", () => {
    const source = read("src/components/Header.tsx");
    expect(source).toMatch(/aria-hidden="true" className="fixed inset-x-0 top-0/);
    expect(source).toMatch(/origin-left/);
    expect(source).toMatch(/querySelector\("\.page-scroll"\)/);
    expect(source).toMatch(/scaleX\(\$\{progress\}\)/);
    expect(source).toMatch(/prefers-reduced-motion/);
    expect(source).toMatch(/scaleX\(0\)/);
  });
});
