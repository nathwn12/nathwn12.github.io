import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { Footer } from "../src/components/Footer";

/* The chrome bar's three text links are the smallest targets on the site: at
   `text-micro` the labels are narrower than 44px on their own ("Email" ~33px,
   "GitHub" ~43px, measured in Chromium at 393x852), so a link sized only by its
   text fails the 44x44 floor on the horizontal axis even though `min-h-11` had
   already fixed the vertical one.

   This file is the regression gate for that floor. It reads the RENDERED class
   attribute of each anchor and resolves the two target axes from Tailwind's
   spacing scale (1 step = 0.25rem = 4px at the 16px root). A missing floor
   resolves to 0, so deleting or shrinking a token fails here rather than
   silently shipping a 33px-wide control. Layout itself (real rects, overlap,
   overflow) is not provable in jsdom — that evidence is browser-measured and
   reported with the change, not asserted here. */

const SPACING_PX = 4; // 0.25rem x 16px root

/** Resolve a `min-h-*` / `min-w-*` spacing utility to px. Missing => 0, which
    is the point: no token means no provable floor. */
function targetAxis(classes: string, axis: "min-h" | "min-w"): number {
  const match = classes.match(new RegExp(`(?:^|\\s)${axis}-(\\d+)(?:\\s|$)`));
  return match ? Number(match[1]) * SPACING_PX : 0;
}

function anchorFor(markup: string, label: string): string {
  const match = markup.match(
    new RegExp(`<a [^>]*class="([^"]*)"[^>]*>${label}</a>`),
  );
  expect(match, `anchor whose visible text is "${label}"`).not.toBeNull();
  return match![1];
}

describe("footer link target floor", () => {
  const markup = renderToStaticMarkup(createElement(Footer));

  test.each(["Email me", "GitHub", "LinkedIn"])(
    "%s is at least 44x44 before any text is measured",
    (label) => {
      const classes = anchorFor(markup, label);
      expect(targetAxis(classes, "min-h"), `${label} height`).toBeGreaterThanOrEqual(44);
      expect(targetAxis(classes, "min-w"), `${label} width`).toBeGreaterThanOrEqual(44);
      // The label sits centred in the widened box instead of hugging its left
      // edge, so the 44px target reads as the control, not as dead space.
      expect(classes).toContain("justify-center");
    },
  );

  test("the floor is on the shared class, not patched onto one link", () => {
    const heights = ["Email me", "GitHub", "LinkedIn"].map((label) =>
      targetAxis(anchorFor(markup, label), "min-h"),
    );
    const widths = ["Email me", "GitHub", "LinkedIn"].map((label) =>
      targetAxis(anchorFor(markup, label), "min-w"),
    );
    expect(new Set(heights)).toEqual(new Set([44]));
    expect(new Set(widths)).toEqual(new Set([44]));
  });

  test("visible copy is unchanged and no hit-area overlay stands in for a box", () => {
    for (const label of ["Email me", "GitHub", "LinkedIn"]) {
      expect(markup).toContain(`>${label}</a>`);
    }
    expect(markup).not.toMatch(/aria-hidden="true"[^>]*class="[^"]*(?:absolute|h-11)[^"]*"/);
    // The theme control was already 44px tall; the row's one-row contract and
    // its labels are untouched by the width floor.
    expect(markup).toMatch(/<button[^>]*class="[^"]*min-h-11[^"]*"/);
    expect(markup).toContain("Theme: Light");
  });

  test("a shrunken or deleted width token is caught", () => {
    // Guard the guard: the resolver must go red on the exact regression it
    // exists for, so a broken helper cannot pass the suite above by accident.
    expect(targetAxis("flex min-w-10 items-center", "min-w")).toBe(40);
    expect(targetAxis("flex items-center", "min-w")).toBe(0);
    expect(targetAxis("flex min-h-11 min-w-11 items-center", "min-h")).toBe(44);
  });
});
