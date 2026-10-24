// @vitest-environment jsdom
/**
 * Contact is a contact-method page, not a second credentials page.
 *
 * The route keeps its title and the ways to reach the owner (email, copy,
 * GitHub issue), and drops the repeated credentials/degree block. The
 * credentials themselves stay on the landing proof band, and the résumé PDF
 * (which carries the degree) is untouched.
 *
 * Every assertion below can go red:
 *
 *   pnpm vitest run tests/contact-contact-only.test.tsx
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Contact } from "../src/components/Contact";
import { CredentialsStrip } from "../src/components/ProofBand";
import { CONTACT_EMAIL } from "../src/lib/contact";

let host: HTMLDivElement;
let root: Root | null = null;

async function mount(element: ReturnType<typeof createElement>) {
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
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(async () => {
  vi.unstubAllGlobals();
  if (root) {
    await act(async () => {
      root!.unmount();
    });
    root = null;
  }
  host?.remove();
});

describe("contact route", () => {
  test("keeps the title and the real ways to reach the owner", async () => {
    await mount(createElement(Contact));
    const text = host.textContent ?? "";

    expect(host.querySelector("h1")?.textContent?.trim()).toBe("Contact");
    expect(host.querySelector(`a[href^="mailto:${CONTACT_EMAIL}"]`)).not.toBeNull();
    expect(text).toContain("Copy the email address");
    expect(
      host.querySelector(
        'a[href="https://github.com/nathwn12/nathwn12/issues/new"]',
      ),
      "the public GitHub contact channel is missing",
    ).not.toBeNull();
  });

  test("renders contact methods only — no résumé, pager, colophon, location, or bio", async () => {
    await mount(createElement(Contact));
    const text = host.textContent ?? "";

    // The real channels stay: the relay form, the direct mailto, the copy
    // control, and the public issue tracker.
    expect(host.querySelector("form")).not.toBeNull();
    expect(
      host.querySelector(`a[href^="mailto:${CONTACT_EMAIL}"]`),
      "the direct email channel is missing",
    ).not.toBeNull();
    expect(
      host.querySelector('button[type="button"]')?.textContent,
    ).toContain("Copy the email address");
    expect(
      host.querySelector(
        'a[href="https://github.com/nathwn12/nathwn12/issues/new"]',
      ),
      "the public GitHub contact channel is missing",
    ).not.toBeNull();

    // No résumé download on the contacts page.
    expect(text).not.toContain("Download résumé");
    expect(host.querySelector("a[download]")).toBeNull();
    expect(host.querySelector('a[href$=".pdf"]')).toBeNull();

    // No adjacent-page pager and no site colophon/source link.
    expect(text).not.toContain("Previous:");
    expect(text).not.toContain("Next:");
    expect(text).not.toContain("Source on GitHub");
    expect(host.querySelector('a[href*="nathwn12.github.io"]')).toBeNull();
    expect(text).not.toContain("Colophon");

    // No location or other bio copy.
    for (const removed of [
      "Hagonoy",
      "Bulacan",
      "Philippines",
      "UTC+8",
      "Location",
    ]) {
      expect(text, `Contact still renders ${removed}`).not.toContain(removed);
    }
  });

  test("drops the repeated credentials and degree block", async () => {
    await mount(createElement(Contact));
    const text = host.textContent ?? "";

    for (const removed of [
      "Credentials and degree",
      "Google IT Automation with Python",
      "Google IT Support",
      "API Security Fundamentals",
      "OWASP API Security Top 10",
      "BS Information Technology",
      "La Consolacion University Philippines",
      "coursera.org",
      "credly.com",
    ]) {
      expect(text, `Contact still renders ${removed}`).not.toContain(removed);
    }
  });

  test("credentials stay on the landing proof band", async () => {
    await mount(createElement(CredentialsStrip));
    const text = host.textContent ?? "";
    expect(text).toContain("Google IT Automation with Python");
    expect(text).toContain("API Security Fundamentals");
  });
});
