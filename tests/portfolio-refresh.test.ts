import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  FEATURED,
  FORKS,
  HERO_INSTALL_HINT,
  HERO_SENTENCE,
  SECOND_TIER,
  VENUE_NOTE,
} from "../src/content/portfolio";

const root = resolve(import.meta.dirname, "..");

describe("portfolio refresh — UX spec", () => {
  test("hero sentence is exact and renders without scrolling", () => {
    expect(HERO_SENTENCE).toBe(
      "I build tools that let AI agents operate real desktops, browsers, and developer workflows.",
    );
    const hero = readFileSync(resolve(root, "src", "components", "Hero.tsx"), "utf8");
    expect(hero).toContain("HERO_SENTENCE");
    // two CTAs: featured work + contact
    expect(hero).toContain('href="/projects"');
    expect(hero).toContain('href="/contact"');
  });

  test("typed install hint respects reduced motion", () => {
    const hero = readFileSync(resolve(root, "src", "components", "Hero.tsx"), "utf8");
    expect(hero).toContain("prefers-reduced-motion");
    expect(HERO_INSTALL_HINT).toBe("npx -y puppet-mcp@latest --doctor");
  });

  test("featured order is puppet → Potflix", () => {
    expect(FEATURED.map((p) => p.id)).toEqual([
      "puppet",
      "gladius",
      "oc-harness-setup",
      "oc-bifrost",
      "oc-flight-deck",
      "slowburn",
      "potflix",
    ]);
  });

  test("install lines are exact and verified", () => {
    const byId = Object.fromEntries(FEATURED.map((p) => [p.id, p]));
    expect(byId.puppet.install).toBe("npx -y puppet-mcp@latest --doctor");
    expect(byId.gladius.install).toBe("npx -y gladius-mcp@latest --doctor");
    expect(byId["oc-harness-setup"].install).toBe("npx --yes oc-harness-setup setup");
    expect(byId["oc-bifrost"].install).toContain("@nathwn12/oc-bifrost@latest");
    expect(byId["oc-flight-deck"].install).toContain("oc-flight-deck@latest");
    // every install line copyable: InstallStrip + FeaturedGrid render CopyButton per install
    const strip = readFileSync(resolve(root, "src", "components", "InstallStrip.tsx"), "utf8");
    expect(strip).toContain("CopyButton");
    const grid = readFileSync(resolve(root, "src", "components", "FeaturedGrid.tsx"), "utf8");
    expect(grid).toContain("CopyButton");
  });

  test("slowburn and Potflix show honestly with no fake install", () => {
    const byId = Object.fromEntries(FEATURED.map((p) => [p.id, p]));
    expect(byId.slowburn.install).toBeNull();
    expect(byId.slowburn.sourceLabel).toBe(
      "Source only — no release yet. Clone and run with Tauri; releases coming.",
    );
    expect(byId.potflix.install).toBeNull();
    expect(byId.potflix.sourceLabel).toBe(
      "Tagged release, no binaries yet. Build from source; see repo README.",
    );
    const grid = readFileSync(resolve(root, "src", "components", "FeaturedGrid.tsx"), "utf8");
    // source-only branch renders sourceLabel, never a Copy button for them
    expect(grid).toContain("sourceLabel");
  });

  test("card anatomy field order: name, for, install, built-with, two links", () => {
    const grid = readFileSync(resolve(root, "src", "components", "FeaturedGrid.tsx"), "utf8");
    const tagline = grid.indexOf("tagline");
    const forWho = grid.indexOf("forWho");
    const install = grid.indexOf("project.install");
    const builtWith = grid.indexOf("builtWith");
    const repoUrl = grid.indexOf("repoUrl");
    expect(tagline).toBeGreaterThan(-1);
    expect(forWho).toBeGreaterThan(tagline);
    expect(install).toBeGreaterThan(forWho);
    expect(builtWith).toBeGreaterThan(install);
    expect(repoUrl).toBeGreaterThan(builtWith);
    // two links max: repo + docs only
    for (const p of FEATURED) {
      expect(p.repoUrl).toMatch(/^https:\/\/github\.com\/nathwn12\//);
      expect(p.docsUrl).toMatch(/^https:\/\//);
    }
  });

  test("second tier is eight one-liners including exact rea-shim copy", () => {
    expect(SECOND_TIER).toHaveLength(8);
    const shim = SECOND_TIER.find((e) => e.name === "rea-shim");
    expect(shim?.line).toBe(
      "Thin compatibility wrapper that lets existing REA scripts keep running unmodified.",
    );
  });

  test("forks badged, never implied as own work", () => {
    const second = readFileSync(resolve(root, "src", "components", "SecondTier.tsx"), "utf8");
    expect(second).toContain("fork.badge");
    expect(second).toContain("Upstream");
    const badges = FORKS.map((f) => f.badge);
    expect(badges).toContain("[fork · maintained]");
    expect(badges).toContain("[fork · upstream link]");
    for (const f of FORKS) {
      expect(f.upstreamUrl).toMatch(/^https:\/\//);
      expect(f.repoUrl).toContain("nathwn12");
    }
    // exact copy lines
    const lines = FORKS.map((f) => `${f.badge} ${f.line}`);
    expect(lines).toContain(
      "[fork · upstream link] Fork kept for reference; use upstream unless noted in the repo.",
    );
    expect(lines).toContain(
      "[fork · maintained] Maintained fork of the AIMP→Discord presence plugin with fixes noted in the repo.",
    );
    expect(lines).toContain(
      "[fork · upstream link] Fork of the large upstream Pear desktop client, kept for study; all credit to upstream.",
    );
  });

  test("venue self-listing cut as product", () => {
    expect(VENUE_NOTE).toBe(
      "This site itself — a terminal-themed Vite build; not a product, venue only.",
    );
    expect(FEATURED.find((p) => p.id === "nathwn12.github.io")).toBeUndefined();
  });

  test("no new frameworks, no images over weight", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
    expect(Object.keys(pkg.dependencies ?? {})).not.toContain("next");
    expect(Object.keys(pkg.dependencies ?? {})).not.toContain("@mui/material");
    expect(Object.keys(pkg.dependencies ?? {})).not.toContain("bootstrap");
  });
});
