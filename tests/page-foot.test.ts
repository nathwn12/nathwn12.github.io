import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const RESUME_NAME = "Nathaniel-Nikolai-Ladero-Resume.pdf";

/* premium-direction.md governs this band: the résumé link is the page's one
   primary action phrase, so its label is a visible sentence-case phrase, and
   the adjacent-page pager reads "Previous: Home" / "Next: Skills" — sentence
   case, no arrow glyphs. `RouteDef.label` stays the shell's short code (EXP,
   SKILLS) and `navName()` is the single step from that code to display copy. */

/* The router reads window.location at module load, so each foot render gets a
   fresh module under the path under test (same stub idiom as
   tests/router-merge.test.ts). */
function installBrowser(pathname: string) {
  vi.stubGlobal("window", {
    location: { pathname },
    history: { replaceState: () => undefined, pushState: () => undefined },
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
  vi.stubGlobal("history", {
    replaceState: () => undefined,
    pushState: () => undefined,
  });
}

async function renderFoot(pathname: string, accentResume = false) {
  vi.resetModules();
  installBrowser(pathname);
  const { PageFoot } = await import("../src/components/PageFoot");
  return renderToStaticMarkup(createElement(PageFoot, { accentResume }));
}

/* The display name a direction control renders, read back out of the static
   markup. A missing direction yields null, and a control whose copy is not the
   sentence-case `Previous:` / `Next:` form never matches at all. */
function pagerTarget(
  markup: string,
  direction: "Previous" | "Next",
): string | null {
  const match = markup.match(
    new RegExp(`${direction}:\\s*<span[^>]*>([^<]+)</span>`),
  );
  return match?.[1] ?? null;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("page foot", () => {
  test("résumé control is root-absolute with the premium action phrase + download", async () => {
    const foot = read("src/components/PageFoot.tsx");
    const contact = read("src/lib/contact.ts");

    // ROOT-ABSOLUTE: a relative href silently serves the SPA fallback from
    // sub-routes, so the link must carry the leading slash. The href now
    // resolves via RESUME_PATH (single source in src/lib/contact.ts) — the
    // root PDF (scripts/copy-404.mjs ships it to dist/) is the ground truth.
    expect(contact).toContain(`RESUME_PATH = "/${RESUME_NAME}"`);
    expect(foot).toContain("RESUME_PATH");
    expect(foot).toContain(`from "../lib/contact"`);
    expect(foot).toContain("href={RESUME_PATH}");
    expect(foot).not.toMatch(new RegExp(`href="${RESUME_NAME}"`));
    expect(foot).toContain(`download="${RESUME_NAME}"`);

    // One primary action phrase, sentence case, visible as the link's own text.
    expect(foot).toContain("Download résumé");

    const markup = await renderFoot("/");
    expect(markup).toContain(`href="/${RESUME_NAME}"`);
    expect(markup).toContain(`download="${RESUME_NAME}"`);
    expect(markup).toContain(">Download résumé</a>");
  });

  test.each([
    ["/", null, "Experience"],
    ["/experience", "Home", "Skills"],
    ["/skills", "Experience", "Projects"],
    ["/projects", "Skills", "Contact"],
    ["/contact", "Projects", null],
  ] as const)(
    "%s foot targets the correct neighbour in sentence case",
    async (path, prev, next) => {
      const markup = await renderFoot(path);

      expect(markup).toContain(`href="/${RESUME_NAME}"`);
      expect(pagerTarget(markup, "Previous")).toBe(prev);
      expect(pagerTarget(markup, "Next")).toBe(next);

      // No shell codes and no arrow glyphs: label affordance is color, weight,
      // and underline on hover (premium-direction.md hard-ban list).
      expect(markup).not.toMatch(/\b(?:PREV|NEXT|HOME|EXP|SKILLS|PROJECTS|CONTACT)\b/);
      expect(markup).not.toMatch(/[←→↑↓]/);
    },
  );

  test("the colophon link owns a real 44px target and keeps the 12px imprint", async () => {
    const foot = read("src/components/PageFoot.tsx");
    const markup = await renderFoot("/");

    // The imprint's wording and type are untouched: one muted 12px sentence,
    // normal weight, roman, snug, in the colophon paragraph's own voice.
    const imprint = foot.match(/<p className="([^"]*text-\[0\.75rem\][^"]*)">/);
    expect(imprint, "colophon paragraph").not.toBeNull();
    const imprintClass = imprint![1];
    for (const token of [
      "font-normal",
      "not-italic",
      "leading-snug",
      "text-text-muted",
    ]) {
      expect(imprintClass, token).toContain(token);
    }
    expect(markup).toContain("Source on GitHub.");

    // THE ANCHOR OWNS THE BOX. The earlier shape — an inline text run with an
    // aria-hidden, absolutely positioned 44px span inside it — measured
    // 103x15 in the browser: the overlay was clickable, but the link element
    // itself was not 44px tall, so hit-testing, the focus ring, and automated
    // target checks all saw a 15px control. The link's own class list must now
    // carry both floors, and the overlay shape must not come back.
    const anchor = foot.match(
      /<a\s+href="https:\/\/github\.com\/nathwn12\/nathwn12\.github\.io"[\s\S]*?className="([^"]*)"/,
    );
    expect(anchor, "colophon anchor").not.toBeNull();
    const anchorClass = anchor![1];
    expect(anchorClass).toContain("inline-block");
    for (const token of ["min-h-11", "min-w-11"]) {
      expect(anchorClass, token).toContain(token);
    }
    expect(markup).not.toMatch(/Source on GitHub\.[\s\S]{0,200}aria-hidden/);
    expect(foot).not.toMatch(/absolute left-0 top-0 h-11 min-w-11 w-full/);
    // Keyboard focus is the document's global :focus-visible ring; the link
    // must never opt out of it.
    expect(anchorClass).not.toMatch(/(?:^| )outline-none(?: |$)/);

    // Arithmetic, not vibes. 11 steps = 2.75rem = 44px of target; the imprint
    // line box is 12px x 1.375 = 16.5px. The negative bottom margin cancels the
    // difference exactly (2.75rem - 1.03125rem = 1.71875rem), so the paragraph
    // does not move, and the 27.5px the box adds hangs downward only - into the
    // foot band's 4rem bottom padding, never up into the pager row's 16px gap.
    expect(anchorClass).toContain("-mb-[1.71875rem]");
    const target = 11 * 0.25 * 16;
    const lineBox = 0.75 * 16 * 1.375;
    const overhang = target - lineBox;
    expect(target).toBe(44);
    expect(lineBox).toBeCloseTo(16.5, 5);
    expect(overhang).toBeCloseTo(27.5, 5);
    expect(overhang).toBeCloseTo(1.71875 * 16, 5);
    const css = read("src/index.css");
    const heroFootPad = css.match(/\.hero-foot\s*\{[^}]*padding-bottom:\s*4rem/);
    expect(heroFootPad, "the 4rem band the overhang lands in").not.toBeNull();
    expect(overhang).toBeLessThan(4 * 16);
    expect(overhang).toBeLessThan(target);
  });

  test("termini omit the missing direction entirely — no disabled controls", async () => {
    const home = await renderFoot("/");
    const contact = await renderFoot("/contact");

    expect(pagerTarget(home, "Previous")).toBeNull();
    expect(home).not.toContain("Previous:");
    expect(pagerTarget(contact, "Next")).toBeNull();
    expect(contact).not.toContain("Next:");

    expect(home).not.toContain("disabled");
    expect(contact).not.toContain("disabled");
  });

  test("one accent-scoped style on Hero's résumé control, none on the other four feet", async () => {
    const hero = await renderFoot("/", true);
    expect((hero.match(/text-accent-text/g) ?? []).length).toBe(1);

    for (const path of ["/experience", "/skills", "/projects", "/contact"]) {
      const markup = await renderFoot(path);
      expect(markup).not.toMatch(/text-accent/);
    }

    // Page wiring: exactly Hero passes accentResume; NotFound never mounts the
    // foot, and Contact is a contact-method page only — the shared foot's
    // résumé/pager/colophon chrome is not mounted there (owner order
    // 2026-10-24).
    expect(read("src/components/Hero.tsx").match(/accentResume/g)?.length).toBe(1);
    for (const page of ["Experience", "Skills", "Projects"]) {
      const src = read(`src/components/${page}.tsx`);
      expect(src).toContain("<PageFoot />");
      expect(src).not.toContain("accentResume");
    }
    expect(read("src/components/Contact.tsx")).not.toMatch(/<PageFoot\b/);
    expect(read("src/components/NotFound.tsx")).not.toContain("PageFoot");
  });
});
