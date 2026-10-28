// @vitest-environment jsdom
/**
 * The contact band: mailto, no form, no repeated documents.
 *
 * The relay form is retired for good — no endpoint, no key, no third party, and
 * no `/thanks` confirmation. What is left has to be complete on its own: a
 * mailto with the subject and opening line written, the address as text for
 * anyone whose mail client is not configured, a copy control with a visible
 * confirmation, and the public issue link for a non-private message.
 *
 * The documents do not live here: the cover owns the pair on the record and the
 * footer owns it on the two detail routes. The availability sentence does not
 * live here either — it is stated once at the top of the record, and repeating
 * it in the closing viewport made the page say the same thing twice.
 *
 *   pnpm vitest run tests/contact-band.test.tsx
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Contact } from "../src/components/Contact";
import { CONTACT_CTA } from "../src/content/ledger";
import { CONTACT_EMAIL } from "../src/lib/contact";

const root = resolve(import.meta.dirname, "..");
const ISSUES = "https://github.com/nathwn12/nathwn12/issues/new";
const AVAILABILITY = "Open to backend roles \u2014 remote.";

let host: HTMLDivElement;
let mounted: Root | null = null;

async function mount() {
  host = document.createElement("div");
  document.body.appendChild(host);
  mounted = createRoot(host);
  await act(async () => {
    mounted!.render(createElement(Contact));
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
  if (mounted) {
    await act(async () => {
      mounted!.unmount();
    });
    mounted = null;
  }
  host?.remove();
});

describe("the band refuses to be a form", () => {
  test("has no form, input, textarea or submit control", async () => {
    await mount();
    expect(host.querySelector("form")).toBeNull();
    expect(host.querySelector("input")).toBeNull();
    expect(host.querySelector("textarea")).toBeNull();
    expect(host.querySelector('button[type="submit"]')).toBeNull();
  });

  test("names no relay service in the component or the shell", async () => {
    for (const file of [
      "src/components/Contact.tsx",
      "src/App.tsx",
      "src/lib/contact.ts",
      "src/lib/router.tsx",
    ]) {
      const source = readFileSync(resolve(root, file), "utf8").toLowerCase();
      expect(source, file).not.toContain("web3forms");
      expect(source, file).not.toContain("access_key");
    }
  });
});

describe("mailto is the primary action", () => {
  test("the button is the one contact phrase and opens a written draft", async () => {
    await mount();
    const button = host.querySelector<HTMLAnchorElement>("a.button");
    expect(button).not.toBeNull();
    expect(button!.textContent?.trim()).toBe(CONTACT_CTA);
    expect(CONTACT_CTA).toBe("Email me");

    const href = button!.getAttribute("href")!;
    expect(href.startsWith(`mailto:${CONTACT_EMAIL}?`)).toBe(true);
    expect(href).toContain("subject=Portfolio%20enquiry");
    expect(href).toContain("body=");
    // The draft starts the message the visitor would otherwise have to write.
    expect(decodeURIComponent(href)).toContain("Hi Nathaniel,");
  });

  test("the address itself is visible and copyable", async () => {
    await mount();
    const address = [...host.querySelectorAll("a")].find(
      (anchor) => anchor.textContent?.trim() === CONTACT_EMAIL,
    );
    expect(address, "the address is not shown as text").toBeDefined();
    expect(address!.getAttribute("href")).toContain(`mailto:${CONTACT_EMAIL}`);

    expect(host.textContent).toContain("Copy the email address");
    expect(host.querySelector('[role="status"]')).not.toBeNull();
  });

  test("offers the public issue tracker for a non-private message", async () => {
    await mount();
    const issue = host.querySelector<HTMLAnchorElement>(`a[href="${ISSUES}"]`);
    expect(issue).not.toBeNull();
    expect(issue!.getAttribute("target")).toBe("_blank");
    expect(issue!.getAttribute("rel")).toBe("noopener noreferrer");
  });

  test("says what happens next in one honest line", async () => {
    await mount();
    expect(host.textContent).toContain(
      "I read every note and usually answer within a day or two.",
    );
  });
});

describe("the band does not repeat the documents", () => {
  test("no download anchors and no file names", async () => {
    await mount();
    expect(host.querySelectorAll("a[download]")).toHaveLength(0);
    expect(host.querySelectorAll('a[href$=".pdf"]')).toHaveLength(0);
    expect(host.textContent).not.toMatch(/Résumé \(PDF\)|CV \(PDF\)/);
    expect(host.textContent).not.toContain(
      "Nathaniel-Nikolai-Ladero-Resume.pdf",
    );
    expect(host.textContent).not.toContain("Nathaniel-Nikolai-Ladero-CV.pdf");
    expect(host.textContent).not.toContain("Documents");
  });

  test("the availability line is not repeated in the closing band", async () => {
    /* It is stated once, where a reader meets it, at the top of the record.
       A second copy here made the closing viewport say the same sentence
       twice, so the band must not carry it at all - not as its last paragraph,
       not as a suffix, not in the markup. */
    await mount();
    expect(host.textContent).not.toContain(AVAILABILITY);
    expect(host.textContent).not.toMatch(/Open to backend roles/i);
  });
});
