/**
 * Sheet underlay — the two failures a DOM test cannot see.
 *
 * The engraved security screen is decoration: `.app-sheet::before` paints a box
 * of ink and the SVG mark masks the waves out of it. Two ways that goes wrong,
 * both invisible to a render-only test:
 *
 *  1. NO MASK SUPPORT. The mark is the mask, so an engine that cannot mask the
 *     box ships a flat tinted rectangle across the corner of the sheet. The
 *     underlay must not exist at all without `mask-image`; the `@supports` gate
 *     and the `content: none` default are the contract, and a paint that
 *     escapes the gate is a rectangle waiting for an old browser.
 *
 *  2. THE MOBILE THIN NEVER RENDERS. `html[data-theme="dark"] .app-sheet`
 *     outranks the bare `.app-sheet` in the phone media block, so a phone on
 *     ink kept the desktop dark step (0.075). The effective value is computed
 *     here from specificity and source order — not read off the block that
 *     looks right — so the dark phone case can actually go red.
 *
 *  3. THE SCREEN DRIFTS BACK TO ONE EDGE. The owner's note was "the texture
 *     should be uniform": a gradient, a one-sided box, or a stretched fade all
 *     put the ink back into one corner of the sheet. Those are geometry and
 *     mark assertions, invisible to a render-only test, so they are read off
 *     the declarations.
 *
 * Every assertion below can go red:
 *
 *   pnpm vitest run tests/sheet-underlay.test.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src", "index.css"), "utf8");

/** Comment-free source: this file's prose names the selectors it describes, so
    every scan below runs on declarations only. */
const css = source.replace(/\/\*[\s\S]*?\*\//g, "");

interface CssBlock {
  /** Selector, or the at-rule prelude for a container. */
  prelude: string;
  /** Enclosing at-rule preludes, outermost first. Empty for top-level rules. */
  context: string[];
  body: string;
  /** Source order, so a later equal-specificity declaration can win. */
  order: number;
}

/** Minimal brace parser: enough for a flat stylesheet with nested at-rules. */
function parseBlocks(
  text: string,
  context: string[] = [],
  sink: CssBlock[] = [],
): CssBlock[] {
  let index = 0;
  let start = 0;
  while (index < text.length) {
    if (text[index] !== "{") {
      index += 1;
      continue;
    }
    const prelude = text.slice(start, index).trim().replace(/\s+/g, " ");
    let depth = 1;
    let cursor = index + 1;
    while (cursor < text.length && depth > 0) {
      if (text[cursor] === "{") depth += 1;
      else if (text[cursor] === "}") depth -= 1;
      cursor += 1;
    }
    const body = text.slice(index + 1, cursor - 1);
    if (prelude.startsWith("@")) {
      parseBlocks(body, [...context, prelude], sink);
    } else if (prelude) {
      sink.push({ prelude, context, body, order: sink.length });
    }
    index = cursor;
    start = cursor;
  }
  return sink;
}

const blocks = parseBlocks(css);

const underlayBlocks = blocks.filter(
  (block) => block.prelude === ".app-sheet::before",
);

/** The one rule inside the mask support gate: the only block that paints. */
const paintedUnderlay = underlayBlocks.find((block) =>
  block.context.some(
    (prelude) => prelude.startsWith("@supports") && prelude.includes("mask-image"),
  ),
);

describe("unsupported mask support renders nothing", () => {
  test("the default is no generated box, not a tinted rectangle", () => {
    const bare = underlayBlocks.filter((block) => block.context.length === 0);
    expect(bare.length, "the unsupported default rule is missing").toBe(1);
    expect(bare[0].body, "an engine without mask support must paint nothing").toMatch(
      /content:\s*none/,
    );
    expect(
      bare[0].body,
      "a paint outside the mask gate is a solid rectangle on old engines",
    ).not.toMatch(/background-color|opacity|mask-image/);
  });

  test("every paint declaration lives inside a mask support gate", () => {
    const gated = underlayBlocks.filter((block) =>
      block.context.some(
        (prelude) => prelude.startsWith("@supports") && prelude.includes("mask-image"),
      ),
    );
    expect(gated.length, "no @supports gate wraps the underlay paint").toBe(1);

    const body = gated[0].body;
    expect(body, "the gate must turn the generated box on").toMatch(/content:\s*""/);
    expect(body).toMatch(/background-color:\s*var\(--color-text\)/);
    for (const property of [
      "mask-image",
      "-webkit-mask-image",
      "mask-repeat",
      "mask-size",
    ]) {
      expect(body, `${property} missing inside the gate`).toMatch(
        new RegExp(`${property}:`),
      );
    }

    for (const block of underlayBlocks) {
      if (block === gated[0]) continue;
      expect(
        block.body,
        "the underlay paint escaped the mask gate",
      ).not.toMatch(/background-color/);
    }
  });
});

describe("the screen is uniform across the sheet, not a corner tint", () => {
  test("the mark carries no gradient, so density cannot be directional", () => {
    const match = css.match(
      /--sheet-tint-mark: url\("data:image\/svg\+xml,([\s\S]*?)"\);/,
    );
    expect(match, "the mark declaration is missing").not.toBeNull();
    const mark = match?.[1] ?? "";

    // The old mark faded left-to-right inside its own `<mask>`. A gradient is
    // the whole mechanism of that bias, so its return has to go red.
    expect(
      mark,
      "a gradient in the mark is what made the screen densest on one side",
    ).not.toMatch(/linearGradient|radialGradient|stop-opacity/);
    expect(
      mark,
      "the mask must be a solid white field, so every edge gets the same ink",
    ).toMatch(
      /%3Cmask id='m'%3E%3Crect width='1600' height='1200' fill='%23fff'\/%3E%3C\/mask%3E/,
    );
  });

  test("the box is inset symmetrically past all four viewport edges", () => {
    expect(paintedUnderlay, "no painted underlay rule").toBeTruthy();
    const body = paintedUnderlay?.body ?? "";

    expect(body).toMatch(/position:\s*fixed/);
    expect(body, "one symmetric inset is what covers every edge").toMatch(
      /inset:\s*-14vh\s+-14vw/,
    );
    // The old tint sized and placed itself on one axis: a single `right`, an
    // explicit width, and a min-width for the narrow case.
    expect(body, "a one-sided box puts the ink back in one corner").not.toMatch(
      /[^-]right:\s/,
    );
    expect(body, "an explicit width re-creates the one-sided box").not.toMatch(
      /(^|\s|;)width:/,
    );
    expect(body).not.toMatch(/min-width/);
    // No tiling: one continuous mark stretched over the box, so there is no
    // repeat boundary to land a seam on.
    expect(body).toMatch(/mask-repeat:\s*no-repeat/);
    expect(body).toMatch(/mask-size:\s*100% 100%/);
  });
});

interface TintDeclaration {
  selector: string;
  value: string;
  /** Enclosing @media prelude, when the declaration is inside one. */
  media: string | null;
  order: number;
}

const tintDeclarations: TintDeclaration[] = blocks
  .map((block) => {
    const match = block.body.match(/--sheet-tint-opacity:\s*([^;]+);/);
    if (!match) return null;
    return {
      selector: block.prelude,
      value: match[1].trim(),
      media: block.context.find((prelude) => prelude.startsWith("@media")) ?? null,
      order: block.order,
    };
  })
  .filter((entry): entry is TintDeclaration => entry !== null);

/** (ids, classes+attributes+pseudo-classes, element types). */
function specificity(selector: string): [number, number, number] {
  const ids = (selector.match(/#[\w-]+/g) ?? []).length;
  const classes =
    (selector.match(/\.[\w-]+/g) ?? []).length +
    (selector.match(/\[[^\]]+\]/g) ?? []).length +
    (selector.match(/:(?!:)[\w-]+/g) ?? []).length;
  const elements = (selector.match(/(^|[\s>+~])([a-z][\w-]*)/gi) ?? []).length;
  return [ids, classes, elements];
}

/** Width-aware media test: only the numeric width queries this file uses. */
function mediaMatches(media: string | null, width: number): boolean {
  if (!media) return true;
  const max = media.match(/max-width:\s*(\d+)px/);
  const min = media.match(/min-width:\s*(\d+)px/);
  if (max && width > Number(max[1])) return false;
  if (min && width < Number(min[1])) return false;
  return true;
}

/** The value the cascade actually lands on for one viewport and theme. */
function effectiveOpacity(width: number, theme: "light" | "dark"): string | null {
  const selector = theme === "dark" ? 'html[data-theme="dark"] .app-sheet' : ".app-sheet";
  const winner = tintDeclarations
    .filter((entry) => entry.selector === selector)
    .filter((entry) => mediaMatches(entry.media, width))
    .map((entry) => ({ entry, spec: specificity(entry.selector) }))
    .sort((left, right) => {
      for (let axis = 0; axis < 3; axis += 1) {
        if (left.spec[axis] !== right.spec[axis]) return left.spec[axis] - right.spec[axis];
      }
      return left.entry.order - right.entry.order;
    })
    .at(-1);
  return winner?.entry.value ?? null;
}

describe("the underlay thins on a phone in both themes", () => {
  test("desktop keeps 9% on paper and 7.5% on ink", () => {
    expect(effectiveOpacity(1440, "light")).toBe("0.09");
    expect(effectiveOpacity(1440, "dark")).toBe("0.075");
  });

  test("a phone resolves to the mobile 5.5% on paper AND on ink", () => {
    // The dark selector outranks the bare class, so this is the assertion that
    // failed while the phone media block only restated `.app-sheet`.
    expect(effectiveOpacity(390, "light")).toBe("0.055");
    expect(effectiveOpacity(390, "dark")).toBe("0.055");
  });

  test("the dark floor is restated inside the phone block, not inherited by luck", () => {
    const phoneDark = tintDeclarations.filter(
      (entry) => entry.selector === 'html[data-theme="dark"] .app-sheet',
    );
    const inPhoneBlock = phoneDark.filter(
      (entry) => entry.media === "@media (max-width: 640px)",
    );
    expect(
      inPhoneBlock.length,
      "the phone block must set the dark ground's opacity explicitly",
    ).toBe(1);
    expect(inPhoneBlock[0].value).toBe("0.055");
  });
});
