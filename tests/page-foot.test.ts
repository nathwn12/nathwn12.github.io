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
    // foot.
    expect(read("src/components/Hero.tsx").match(/accentResume/g)?.length).toBe(1);
    for (const page of ["Experience", "Skills", "Projects", "Contact"]) {
      const src = read(`src/components/${page}.tsx`);
      expect(src).toContain("<PageFoot />");
      expect(src).not.toContain("accentResume");
    }
    expect(read("src/components/NotFound.tsx")).not.toContain("PageFoot");
  });
});
