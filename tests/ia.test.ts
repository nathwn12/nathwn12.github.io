// @vitest-environment jsdom
/**
 * The new information architecture, and the removed one.
 *
 * Three routes; three header destinations; five cover bands in the direction's
 * order; nine record entries; eleven projects. The command palette, pager,
 * typing headline, marquee, folios, skills page, and relay form are gone, and
 * this file fails if any of their modules or markup returns.
 *
 *   pnpm vitest run tests/ia.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Home } from "../src/pages/Home";
import { RecordPage } from "../src/components/RecordPage";
import { SiteHead } from "../src/components/SiteHead";
import { WorkPage } from "../src/components/WorkPage";
import { NAV_ITEMS, ROUTES } from "../src/lib/router";
import { experience } from "../src/content/experience";
import { projects } from "../src/content/projects";

vi.mock("../src/components/CommitField", () => ({
  CommitField: () => null,
}));

const repoRoot = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");
const exists = (rel: string) => existsSync(resolve(repoRoot, rel));

let host: HTMLDivElement;
let root: Root | null = null;

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
});

afterEach(async () => {
  if (root) {
    await act(async () => {
      root!.unmount();
    });
    root = null;
  }
  host?.remove();
});

describe("route table", () => {
  test("has exactly the three live routes", () => {
    expect(ROUTES.map((route) => route.path)).toEqual([
      "/",
      "/record",
      "/work",
    ]);
    expect(ROUTES.map((route) => route.label)).toEqual([
      "Home",
      "Record",
      "Work",
    ]);
  });

  test("has exactly the three header destinations, with contact on the cover", () => {
    expect(NAV_ITEMS).toEqual([
      { label: "Record", href: "/record" },
      { label: "Work", href: "/work" },
      { label: "Contact", href: "/#contact" },
    ]);
  });

  test("does not list skills, experience, projects, contact, or thanks as routes", () => {
    const paths = ROUTES.map((route) => route.path);
    for (const retired of [
      "/skills",
      "/experience",
      "/projects",
      "/contact",
      "/thanks",
    ]) {
      expect(paths, retired).not.toContain(retired);
    }
  });
});

describe("cover", () => {
  test("renders five bands in the direction's order", async () => {
    await mount(createElement(Home));
    const classes = [...host.querySelectorAll("main section, section")].map(
      (section) => section.className,
    );
    expect(classes).toEqual([
      "hero field-green",
      "record-band field-ink",
      "work-band band field-paper",
      "about band field-paper",
      "contact-band field-paper",
    ]);
  });

  test("has one h1 and no skills or forward band", async () => {
    await mount(createElement(Home));
    expect(host.querySelectorAll("h1")).toHaveLength(1);
    const headings = [...host.querySelectorAll("h2, h3")].map((heading) =>
      heading.textContent?.trim(),
    );
    expect(headings).toContain("The record");
    expect(headings).toContain("Selected work");
    expect(headings).toContain("About");
    expect(headings).toContain("Credentials");
    expect(headings).not.toContain("Skills");
    expect(headings).not.toContain("Forward");
    expect(headings).not.toContain("The system, at a glance");
  });

  test("links the record and the work to their full pages", async () => {
    await mount(createElement(Home));
    expect(host.querySelectorAll('a[href="/record"]').length).toBeGreaterThan(0);
    expect(host.querySelectorAll('a[href="/work"]').length).toBeGreaterThan(0);
    expect(host.textContent).toContain("Read all nine entries");
    expect(host.textContent).toContain("All eleven projects");
  });

  test("has exactly three header destinations", async () => {
    await mount(createElement(SiteHead));
    expect(host.querySelectorAll("header nav a")).toHaveLength(3);
  });
});

describe("record page", () => {
  test("renders all nine entries by default", async () => {
    await mount(createElement(RecordPage));
    expect(experience).toHaveLength(9);
    expect(host.querySelectorAll("[data-entry]")).toHaveLength(9);
    expect(host.querySelectorAll("[data-entry][hidden]")).toHaveLength(0);
    expect(host.querySelector(".filter-count")?.textContent).toBe("Nine entries");
  });

  test("derives the filter count from the entries", async () => {
    await mount(createElement(RecordPage));
    const buttons = [...host.querySelectorAll<HTMLButtonElement>(".filter-btn")];
    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      "All nine",
      "C# (Two entries)",
      "ASP.NET (Two entries)",
      "EF Core (Two entries)",
      "SQL (Two entries)",
      "Redis (One entry)",
      "RabbitMQ (One entry)",
      "Docker (Two entries)",
      "JWT (One entry)",
      "AWS (One entry)",
    ]);

    const csharp = buttons.find((button) => button.textContent?.includes("C#"));
    await act(async () => {
      csharp!.click();
    });
    expect(host.querySelector(".filter-count")?.textContent).toBe("Two entries");
    expect(host.querySelectorAll("[data-entry]:not([hidden])")).toHaveLength(2);
    expect(
      csharp!.getAttribute("aria-pressed"),
    ).toBe("true");

    const all = buttons[0];
    await act(async () => {
      all.click();
    });
    expect(host.querySelector(".filter-count")?.textContent).toBe("Nine entries");
    expect(host.querySelectorAll("[data-entry]:not([hidden])")).toHaveLength(9);
  });

  test("keeps the provenance band and the closure fact", async () => {
    await mount(createElement(RecordPage));
    expect(host.querySelector("#provenance-heading")?.textContent).toBe(
      "Where the numbers come from",
    );
    expect(host.textContent).toContain("after Xentra closed in May 2026");
    expect(host.textContent).toContain("1,182 commits across 17 repositories");
  });
});

describe("work page", () => {
  test("renders all eleven projects and the retired entry", async () => {
    await mount(createElement(WorkPage));
    expect(projects).toHaveLength(11);
    expect(host.querySelectorAll(".project")).toHaveLength(11);
    expect(host.querySelector(".archived")?.textContent).toContain("Retired");
    expect(host.querySelector(".archived")?.textContent).toContain("OC Todo");
  });

  test("links every project to its own repository", async () => {
    await mount(createElement(WorkPage));
    const links = [...host.querySelectorAll<HTMLAnchorElement>(".project a[href^='https://github.com/nathwn12/']")];
    expect(links).toHaveLength(11);
  });

  test("renders a backticked identifier as code, not as literal backticks", async () => {
    await mount(createElement(WorkPage));
    expect(host.textContent).not.toContain("`");
    const code = [...host.querySelectorAll("code")].map((node) => node.textContent);
    expect(code).toContain("allow_clipboard:true");
  });
});

describe("removed architecture stays removed", () => {
  test("removed component and library modules do not exist", () => {
    for (const rel of [
      "src/components/CommandPalette.tsx",
      "src/components/PageFoot.tsx",
      "src/components/Hero.tsx",
      "src/components/Header.tsx",
      "src/components/Footer.tsx",
      "src/components/Skills.tsx",
      "src/components/ForwardBand.tsx",
      "src/components/SystemAtlas.tsx",
      "src/components/Experience.tsx",
      "src/components/Contact.tsx",
      "src/lib/theme.ts",
      "src/lib/palette.ts",
      "src/lib/keyboardNav.ts",
      "src/lib/navNames.ts",
      "src/lib/motionPreference.ts",
    ]) {
      expect(exists(rel), rel).toBe(false);
    }
  });

  test("no framer-motion, palette, pager, or relay code remains in the app", () => {
    const files = [
      "src/App.tsx",
      "src/main.tsx",
      "src/lib/router.tsx",
      "src/pages/Home.tsx",
    ];
    for (const file of files) {
      const source = read(file);
      expect(source, file).not.toMatch(/framer-motion/);
      expect(source, file).not.toMatch(/web3forms|FormSubmit|botcheck/i);
      expect(source, file).not.toMatch(/command palette|CommandPalette/i);
      expect(source, file).not.toMatch(/goNext|goPrev|useAdjacentNavigation/);
    }
  });

  test("the document has no theme switch, no palette, and no relay", () => {
    const html = read("index.html");
    expect(html).not.toContain("data-theme");
    expect(html).not.toContain("prefers-color-scheme");
    expect(html).not.toContain("web3forms");
    expect(html).not.toContain("command");
    expect(read("src/index.css")).not.toContain("--grain-opacity");
  });

  test("the retired content modules stay on disk, unused", () => {
    for (const rel of ["src/content/skills.ts", "src/content/forward.ts", "src/content/contact.ts"]) {
      expect(exists(rel), rel).toBe(true);
    }
    const home = read("src/pages/Home.tsx");
    expect(home).not.toContain('from "../components/Skills"');
    expect(home).not.toContain('from "../components/ForwardBand"');
    expect(home).not.toContain('from "../content/skills"');
    expect(home).not.toContain('from "../content/forward"');
  });
});
