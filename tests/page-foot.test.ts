import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const RESUME_NAME = "Nathaniel-Nikolai-Ladero-Resume.pdf";

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("page foot", () => {
  test("résumé control is root-absolute with Hero's verbatim label + download", () => {
    const foot = read("src/components/PageFoot.tsx");
    const hero = read("src/components/Hero.tsx");

    // ROOT-ABSOLUTE: a relative href silently serves the SPA fallback from
    // sub-routes, so the link must carry the leading slash.
    expect(foot).toContain(`href="/${RESUME_NAME}"`);
    expect(foot).not.toMatch(new RegExp(`href="${RESUME_NAME}"`));
    expect(foot).toContain(`download="${RESUME_NAME}"`);
    expect(foot).toContain("wget ./resume.pdf");
    expect(hero).toContain("wget ./resume.pdf");
  });

  test.each([
    ["/", null, "EXP"],
    ["/experience", "HOME", "SKILLS"],
    ["/skills", "EXP", "PROJECTS"],
    ["/projects", "SKILLS", "CONTACT"],
    ["/contact", "PROJECTS", null],
  ] as const)(
    "%s foot targets the correct neighbour",
    async (path, prev, next) => {
      const markup = await renderFoot(path);
      expect(markup).toContain(`href="/${RESUME_NAME}"`);
      if (prev) {
        expect(markup).toContain(`PREV</span><span class="font-bold">${prev}</span>`);
      } else {
        expect(markup).not.toContain("PREV");
      }
      if (next) {
        expect(markup).toContain(`NEXT</span><span class="font-bold">${next}</span>`);
      } else {
        expect(markup).not.toContain("NEXT");
      }
    },
  );

  test("termini omit the missing direction entirely — no disabled controls", async () => {
    const home = await renderFoot("/");
    const contact = await renderFoot("/contact");
    expect(home).not.toContain("PREV");
    expect(contact).not.toContain("NEXT");
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