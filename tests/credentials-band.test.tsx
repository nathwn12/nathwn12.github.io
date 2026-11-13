// @vitest-environment jsdom
/**
 * The credentials band: one link column, one meta line.
 *
 * The four verification links are a column, and a column has one left edge. They
 * are left-aligned in a track sized to its widest label, so no label can push a
 * row's link off the edge the other three share — the old markup right-aligned
 * them, and "Verify at APIsec University" (196px of mono in a 176px track) both
 * moved its row's left edge 44px and wrapped onto a second line.
 *
 * The label is `Verify` on every row, because the issuer is already on the row's
 * meta line two lines above it; each link's accessible name names the credential
 * and the issuer, so the column is uniform without a link that says nothing
 * about where it goes.
 *
 * The meta line is the cover's fact-row shape: one row of cells separated by
 * hairlines from `sm` up, each cell nowrap, and no separator at all when the row
 * folds on a phone — a rule at the start of a wrapped line is a stranded mark,
 * not a separator.
 *
 *   bunx vitest run tests/credentials-band.test.tsx
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { CredentialsBand } from "../src/components/CredentialsBand";
import { credentials } from "../src/content/credentials";

let host: HTMLDivElement;
let mounted: Root | null = null;

async function mount() {
  host = document.createElement("div");
  document.body.appendChild(host);
  mounted = createRoot(host);
  await act(async () => {
    mounted!.render(createElement(CredentialsBand));
  });
}

const links = () =>
  [...host.querySelectorAll<HTMLAnchorElement>("#credentials a")];

const rows = () =>
  [...host.querySelectorAll<HTMLLIElement>("#credentials .frame > ul > li")];

const cellsOf = (row: HTMLLIElement) =>
  [...row.querySelectorAll<HTMLLIElement>("div > ul > li")];

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

describe("the verification links are one column", () => {
  test("every link carries the same one-word label", async () => {
    await mount();
    expect(links()).toHaveLength(credentials.length);
    for (const link of links()) {
      /* One word, so no row's label can wrap and no row can grow taller than
         its siblings. */
      expect(link.textContent?.trim()).toBe("Verify");
    }
  });

  test("each link's accessible name still names the credential and its issuer", async () => {
    await mount();
    for (const [index, link] of links().entries()) {
      const cert = credentials[index];
      const name = link.getAttribute("aria-label");
      expect(name, `link ${index} has no accessible name`).toBe(
        `Verify ${cert.title} at ${cert.issuer}`,
      );
      /* WCAG 2.5.3: the visible label is contained in the accessible name. */
      expect(name!.startsWith(link.textContent!.trim())).toBe(true);
      /* And it still opens the issuer's page in a new tab, without a handle. */
      expect(link.getAttribute("href")).toBe(cert.url);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  test("no link is pushed off the column's left edge", async () => {
    await mount();
    for (const row of rows()) {
      /* The column is one content-sized track and the link starts in it. A
         right-aligned link is the defect: its left edge is then whatever its
         label's width leaves, which is two left edges in four rows. */
      expect(row.className).toContain("md:grid-cols-[minmax(0,1fr)_max-content]");
      expect(row.className).not.toContain("11rem");
    }
    for (const link of links()) {
      expect(link.className).toContain("md:justify-self-start");
      expect(link.className).not.toContain("justify-self-end");
      /* Belt to that brace: a nowrap label cannot wrap even if a track is
         narrower than its text. */
      expect(link.className).toContain("whitespace-nowrap");
    }
  });
});

describe("the meta line is the cover's fact-row shape", () => {
  test("each credential's meta is three cells, not one jammed string", async () => {
    await mount();
    for (const [index, row] of rows().entries()) {
      const cert = credentials[index];
      const cells = cellsOf(row);
      expect(cells.map((cell) => cell.textContent?.trim())).toEqual([
        cert.issuer,
        cert.date,
        `ID ${cert.id}`,
      ]);
    }
  });

  test("cells are separated by a hairline from sm up, and by nothing below it", async () => {
    await mount();
    for (const row of rows()) {
      const cells = cellsOf(row);
      expect(cells, "the meta line is not three cells").toHaveLength(3);
      expect(cells[0].className).not.toContain("border-l");
      for (const cell of cells.slice(1)) {
        expect(cell.className).toContain("sm:border-l");
        expect(cell.className).toContain("sm:pl-5");
      }
      for (const cell of cells) {
        expect(cell.className).toContain("whitespace-nowrap");
      }
    }
  });
});

