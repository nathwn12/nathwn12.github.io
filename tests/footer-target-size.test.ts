import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { Footer } from "../src/components/Footer";


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
    expect(markup).toMatch(/<button[^>]*role="switch"[^>]*aria-checked="(?:true|false)"/);
    expect(markup).toContain(">Light<");
    expect(markup).not.toContain(">Motion<");
  });

  test("a shrunken or deleted width token is caught", () => {
    expect(targetAxis("flex min-w-10 items-center", "min-w")).toBe(40);
    expect(targetAxis("flex items-center", "min-w")).toBe(0);
    expect(targetAxis("flex min-h-11 min-w-11 items-center", "min-h")).toBe(44);
  });
});
