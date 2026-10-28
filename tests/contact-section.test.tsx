// @vitest-environment jsdom
/**
 * Contact is a mailto and the two documents. Nothing else.
 *
 * The Web3Forms relay, its validation module, its /thanks confirmation, and the
 * copy-address/issue-tracker controls retired with the previous direction. What
 * survives is the fact floor: one email address from one constant, both PDFs at
 * their root URLs with a download attribute, GitHub, the availability line, and
 * the honest answer-time sentence.
 *
 *   pnpm vitest run tests/contact-section.test.tsx
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ContactBand } from "../src/components/ContactBand";
import { availability } from "../src/content/hero";
import {
  CONTACT_EMAIL,
  CV_PATH,
  MAILTO,
  RESUME_PATH,
} from "../src/lib/contact";

const repoRoot = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

let host: HTMLDivElement;
let root: Root | null = null;

beforeEach(async () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(createElement(ContactBand));
  });
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

describe("contact section", () => {
  test("keeps the available-to-work line, remote included", () => {
    expect(availability).toBe("Open to backend roles — remote.");
    const lede = host.querySelector(".contact-lede");
    expect(lede?.textContent).toBe("Open to backend roles — remote.");
    expect(lede?.textContent).not.toMatch(/hybrid|salary|notice/i);
  });

  test("offers both documents at their root URLs with a download", () => {
    expect(RESUME_PATH).toBe("/Nathaniel-Nikolai-Ladero-Resume.pdf");
    expect(CV_PATH).toBe("/Nathaniel-Nikolai-Ladero-CV.pdf");
    const resume = host.querySelector<HTMLAnchorElement>(
      `a[href="${RESUME_PATH}"][download]`,
    );
    const cv = host.querySelector<HTMLAnchorElement>(
      `a[href="${CV_PATH}"][download]`,
    );
    expect(resume?.textContent).toBe("Résumé");
    expect(cv?.textContent).toBe("CV");
  });

  test("shares one email source and one mailto across the row and the note", () => {
    expect(CONTACT_EMAIL).toBe("nathanielnikolai.ladero@gmail.com");
    expect(MAILTO).toContain(`mailto:${CONTACT_EMAIL}`);
    const mailtos = [...host.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]')];
    expect(mailtos.length).toBeGreaterThanOrEqual(2);
    for (const link of mailtos) {
      expect(link.getAttribute("href")).toBe(MAILTO);
    }
    expect(host.querySelector(".contact-note")?.textContent).toContain(
      CONTACT_EMAIL,
    );
  });

  test("links GitHub in a new tab with rel protection", () => {
    const github = host.querySelector<HTMLAnchorElement>(
      'a[href="https://github.com/nathwn12"]',
    );
    expect(github?.textContent).toBe("GitHub");
    expect(github?.getAttribute("target")).toBe("_blank");
    expect(github?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  test("states what happens next in one honest line", () => {
    expect(host.querySelector(".contact-note")?.textContent).toMatch(
      /usually answer within a day or two/,
    );
  });

  test("has no form, relay, or runtime fetch", () => {
    expect(host.querySelector("form")).toBeNull();
    expect(host.querySelector("input, textarea, select")).toBeNull();
    const component = read("src/components/ContactBand.tsx");
    expect(component).not.toMatch(/web3forms|fetch\(|FormSubmit|botcheck/i);
    expect(existsSync(resolve(repoRoot, "src/content/contact.ts"))).toBe(true);
    // The module may stay on disk, but nothing imports it any more.
    for (const file of [
      "src/App.tsx",
      "src/components/ContactBand.tsx",
      "src/lib/contact.ts",
    ]) {
      expect(read(file), file).not.toContain("content/contact");
    }
  });

  test("keeps the colophon on the paper", () => {
    const foot = host.querySelector(".site-foot");
    expect(foot?.textContent).toContain(
      "Nathaniel Nikolai Ladero, backend developer.",
    );
    expect(foot?.textContent).toContain("Philippines, remote.");
    expect(foot?.textContent).toContain("2026");
  });
});
