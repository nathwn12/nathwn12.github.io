/**
 * Accessibility floor that a static test can hold: tap-target floors, a visible
 * focus ring, no ring on programmatic containers, and a finished reduced-motion
 * state for every animated surface.
 *
 *   pnpm vitest run tests/a11y-floor.test.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "..");
const css = readFileSync(resolve(root, "src", "index.css"), "utf8");

function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`missing rule for ${selector}`);
  return match[1];
}

describe("tap targets", () => {
  test.each([
    [".site-head nav a", "44px"],
    [".site-head .mark", "44px"],
    [".text-link", "44px"],
    [".btn", "48px"],
    [".contact-rows a", "48px"],
    [".filter-btn", "44px"],
    [".credential-list .verify", "44px"],
    [".skip", "48px"],
  ])("%s owns a %s floor", (selector, floor) => {
    expect(rule(selector)).toContain(`min-height: ${floor}`);
  });
});

describe("focus and motion", () => {
  test("one visible focus ring, 3px, offset", () => {
    expect(rule(":focus-visible")).toMatch(/outline: 3px solid var\(--focus\)/);
    expect(rule(":focus-visible")).toContain("outline-offset: 3px");
  });

  test("programmatic focus containers never paint the ring", () => {
    const ruleText = css.match(/#main:focus,[\s\S]*?\{[^}]*\}/)?.[0] ?? "";
    expect(ruleText).toContain("#main:focus");
    expect(ruleText).toContain("#contact:focus");
    expect(ruleText).toContain("outline: none");
  });

  test("every animation lives under no-preference and resolves under reduce", () => {
    // The signature rise, the load rail, the reveals, and the route fade are
    // all inside the no-preference query; the reduce block cancels the route.
    const noPreference = css.indexOf("@media (prefers-reduced-motion: no-preference)");
    const reduce = css.indexOf("@media (prefers-reduced-motion: reduce)");
    expect(noPreference).toBeGreaterThan(-1);
    expect(reduce).toBeGreaterThan(noPreference);
    expect(css.slice(noPreference, reduce)).toContain(".hero-name .line > span");
    expect(css.slice(noPreference, reduce)).toContain("[data-reveal]");
    expect(css.slice(reduce)).toMatch(/\.route\s*\{\s*animation: none/);
  });

  test("the skip link is present and the banner sits outside main", () => {
    const app = readFileSync(resolve(root, "src", "App.tsx"), "utf8");
    expect(app).toContain('className="skip"');
    expect(app).toContain('href="#main"');
    expect(app).toContain('id="main"');
    expect(app).toContain("tabIndex={-1}");
    const chrome = app.indexOf("<SiteChrome />");
    const main = app.indexOf('<main id="main"');
    const skip = app.indexOf('className="skip"');
    expect(skip).toBeGreaterThan(-1);
    expect(chrome).toBeGreaterThan(skip);
    expect(main).toBeGreaterThan(chrome);
  });

  test("the record's commit field is decorative and the fact is in the caption", () => {
    const field = readFileSync(
      resolve(root, "src", "components", "CommitField.tsx"),
      "utf8",
    );
    expect(field).toContain('aria-hidden="true"');
    const band = readFileSync(
      resolve(root, "src", "components", "RecordBand.tsx"),
      "utf8",
    );
    expect(band).toContain("<figcaption>");
    expect(band).toContain("One mark, one commit.");
  });
});
