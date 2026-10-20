// @vitest-environment jsdom
/**
 * Contact: the Web3Forms relay form above the keyless mailto block.
 *
 * Static checks keep the kept-behaviour assertions (single CONTACT_EMAIL
 * source, prefilled mailto draft, copy confirmation, issue link, honest
 * next-step line, no FormSubmit, no filler) and pin the relay wiring
 * (endpoint + key module, JSON payload, /thanks route).
 *
 * Runtime checks mount the real Contact with fetch mocked:
 *   valid submit → one POST to WEB3FORMS_ENDPOINT carrying the key and the
 *   typed values, then navigation to /thanks;
 *   success:false → the alert renders with the mailto link inside it;
 *   invalid email → no fetch, the field marked invalid and focused;
 *   the copy status region stays mounted throughout.
 *
 *   npx vitest run tests/contact-status.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Contact } from "../src/components/Contact";
import { navigate } from "../src/lib/router";
import { WEB3FORMS_ENDPOINT, WEB3FORMS_KEY } from "../src/content/contact";

const repoRoot = resolve(import.meta.dirname, "..");
const contactPath = resolve(repoRoot, "src", "components", "Contact.tsx");
const footerPath = resolve(repoRoot, "src", "components", "Footer.tsx");
const libPath = resolve(repoRoot, "src", "lib", "contact.ts");
const contentPath = resolve(repoRoot, "src", "content", "contact.ts");
const thanksPath = resolve(repoRoot, "src", "components", "Thanks.tsx");
const routerPath = resolve(repoRoot, "src", "lib", "router.tsx");
const appPath = resolve(repoRoot, "src", "App.tsx");
const navNamesPath = resolve(repoRoot, "src", "lib", "navNames.ts");

const contact = readFileSync(contactPath, "utf8");
const footer = readFileSync(footerPath, "utf8");
const lib = existsSync(libPath) ? readFileSync(libPath, "utf8") : "";
const content = existsSync(contentPath)
  ? readFileSync(contentPath, "utf8")
  : "";
const thanks = existsSync(thanksPath) ? readFileSync(thanksPath, "utf8") : "";
const router = readFileSync(routerPath, "utf8");
const app = readFileSync(appPath, "utf8");
const navNames = readFileSync(navNamesPath, "utf8");

const ISSUES = "https://github.com/nathwn12/nathwn12/issues/new";

describe("contact kept behaviour", () => {
  test("drops the retired ALL-CAPS status chip for sentence-case copy", () => {
    // docs/premium-direction.md § "All caps labels": every label is
    // sentence case, so the bracket-chip status vocabulary is retired.
    for (const retired of ["[FORM READY]", "[SENDING]", "[QUEUED]", "[ERROR]"]) {
      expect(contact.includes(retired)).toBe(false);
    }
    expect(contact).not.toMatch(/\[[A-Z][A-Z ]+\]/);
  });

  test("shares one CONTACT_EMAIL source across contact and footer links", () => {
    expect(existsSync(libPath), "src/lib/contact.ts should exist").toBe(true);
    expect(lib).toMatch(
      /export const CONTACT_EMAIL = "nathanielnikolai\.ladero@gmail\.com"/,
    );
    expect(contact).toMatch(
      /import \{[^}]*CONTACT_EMAIL[^}]*\} from "\.\.\/lib\/contact"/,
    );
    expect(footer).toMatch(
      /import \{ CONTACT_EMAIL \} from "\.\.\/lib\/contact"/,
    );
    expect(contact).toMatch(/mailto:\$\{CONTACT_EMAIL\}/);
    expect(footer).toMatch(/mailto:\$\{CONTACT_EMAIL\}/);
  });

  test("prefills the mailto draft with the portfolio subject and a body template", () => {
    expect(contact).toMatch(/MAIL_SUBJECT = "Portfolio enquiry"/);
    expect(contact).toMatch(/MAIL_BODY = /);
    expect(contact).toMatch(/subject=\$\{encodeURIComponent\(MAIL_SUBJECT\)\}/);
    expect(contact).toMatch(/body=\$\{encodeURIComponent\(MAIL_BODY\)\}/);
  });

  test("offers copy-email with a visible confirmation state, no mail client needed", () => {
    expect(contact).toMatch(/Copy the email address/);
    expect(contact).toMatch(/Copied to the clipboard/);
    expect(contact).toMatch(/navigator\.clipboard\.writeText\(CONTACT_EMAIL\)/);
    expect(contact).toMatch(/role="status"/);
  });

  test("links the public issue tracker for non-private messages", () => {
    expect(contact.includes(ISSUES)).toBe(true);
    expect(contact).toMatch(/target="_blank"/);
    expect(contact).toMatch(/rel="noopener noreferrer"/);
  });

  test("says what happens next in one honest line", () => {
    expect(contact).toMatch(/usually answer within a day or two/);
  });

  test("retires the old FormSubmit relay", () => {
    expect(contact).not.toMatch(/formsubmit\.co/i);
    expect(contact).not.toMatch(/FormSubmit/);
    expect(contact).not.toMatch(/_honey/);
    expect(contact).not.toMatch(/_captcha/);
  });

  test("removes the goodbye filler from the contact page", () => {
    expect(contact.includes("goodbye")).toBe(false);
    expect(contact.includes("cat /dev/null")).toBe(false);
    expect(contact.includes("Thanks for visiting")).toBe(false);
  });
});

describe("contact relay wiring", () => {
  test("relay module exports the endpoint and the portfolio-contact key", () => {
    expect(existsSync(contentPath), "src/content/contact.ts should exist").toBe(
      true,
    );
    expect(content).toMatch(
      /export const WEB3FORMS_KEY = "20dbb29b-28d6-48d6-8106-80ea7fbe0014"/,
    );
    expect(content).toMatch(
      /export const WEB3FORMS_ENDPOINT = "https:\/\/api\.web3forms\.com\/submit"/,
    );
  });

  test("posts the keyed JSON payload and navigates to /thanks with no redirect field", () => {
    expect(contact).toMatch(/WEB3FORMS_ENDPOINT/);
    expect(contact).toMatch(/WEB3FORMS_KEY/);
    expect(contact).toMatch(/access_key/);
    expect(contact).toMatch(/Portfolio contact — /);
    expect(contact).toMatch(/from_name/);
    expect(contact).toMatch(/botcheck/);
    expect(contact).toMatch(/navigate\(THANKS_PATH\)/);
    expect(contact).toMatch(/THANKS_PATH = "\/thanks"/);
    expect(contact).not.toMatch(/name="redirect"/);
    expect(contact).not.toMatch(/redirect:/);
  });

  test("names the submitting and failure states the brief requires", () => {
    expect(contact).toMatch(/"Sending…"/);
    expect(contact).toMatch(/aria-busy/);
    expect(contact).toMatch(/role="alert"/);
    expect(contact).toMatch(/Could not send/);
    expect(contact).toMatch(/Email me directly instead/);
    expect(contact).toMatch(/aria-invalid/);
    expect(contact).toMatch(/aria-describedby/);
    expect(contact).toMatch(/<label htmlFor/);
  });

  test("restores the /thanks confirmation route end to end", () => {
    expect(existsSync(thanksPath), "src/components/Thanks.tsx should exist").toBe(
      true,
    );
    expect(thanks).toMatch(/<h1/);
    expect(thanks).toMatch(/arrived safely/);
    expect(thanks).toMatch(/href="\/"/);
    expect(thanks).toMatch(/mailto/);
    expect(router).toMatch(/THANKS_ROUTE/);
    expect(router).toMatch(/\/thanks/);
    expect(app).toMatch(/components\/Thanks/);
    expect(navNames).toMatch(/thanks: "Thanks"/);
  });
});

let host: HTMLDivElement;
let root: Root | null = null;

async function mount() {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(createElement(Contact));
  });
}

function field(id: string): HTMLInputElement | HTMLTextAreaElement {
  const el = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `#${id}`,
  );
  if (!el) throw new Error(`missing field #${id}`);
  return el;
}

function mockFetch(result: { ok: boolean; success?: boolean }) {
  const fetchMock = vi.fn(
    async (_url: unknown, _init?: { body?: unknown; method?: string }) => ({
      ok: result.ok,
      json: async () =>
        result.success === undefined ? {} : { success: result.success },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function submitForm() {
  const form = host.querySelector("form");
  if (!form) throw new Error("missing form");
  await act(async () => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
  });
}

const VALID = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hello — I have a systems role worth discussing with you.",
} as const;

beforeEach(() => {
  // A prior submit may have navigated the shared router module to /thanks.
  navigate("/contact");
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

describe("contact relay form", () => {
  test("form present with three labelled fields and the honeypot", async () => {
    await mount();

    const form = host.querySelector("form");
    expect(form).not.toBeNull();

    // Real <label htmlFor> associations, not placeholder-as-label.
    for (const id of ["contact-name", "contact-email", "contact-message"]) {
      const label = host.querySelector(`label[for="${id}"]`);
      expect(label?.textContent?.trim().length ?? 0).toBeGreaterThan(0);
      expect(field(id).getAttribute("placeholder")).toBeNull();
    }

    const name = field("contact-name");
    expect(name.tagName).toBe("INPUT");
    expect(name.getAttribute("type")).toBe("text");
    expect(name.getAttribute("autocomplete")).toBe("name");
    expect(name.hasAttribute("required")).toBe(true);

    const email = field("contact-email");
    expect(email.tagName).toBe("INPUT");
    expect(email.getAttribute("type")).toBe("email");
    expect(email.getAttribute("autocomplete")).toBe("email");
    expect(email.hasAttribute("required")).toBe(true);

    const message = field("contact-message");
    expect(message.tagName).toBe("TEXTAREA");
    expect(message.getAttribute("rows")).toBe("5");
    expect(message.hasAttribute("required")).toBe(true);

    const honeypot = host.querySelector('input[name="botcheck"]');
    expect(honeypot?.getAttribute("type")).toBe("checkbox");
    expect(honeypot?.classList.contains("sr-only")).toBe(true);
    expect(honeypot?.getAttribute("tabindex")).toBe("-1");
    expect(honeypot?.getAttribute("autocomplete")).toBe("off");
    expect(honeypot?.getAttribute("aria-hidden")).toBe("true");
  });

  test("submit with valid values posts once to the endpoint and lands on /thanks", async () => {
    const fetchMock = mockFetch({ ok: true, success: true });
    await mount();

    field("contact-name").value = VALID.name;
    field("contact-email").value = VALID.email;
    field("contact-message").value = VALID.message;
    await submitForm();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(WEB3FORMS_ENDPOINT);
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body.access_key).toBe(WEB3FORMS_KEY);
    expect(body.name).toBe(VALID.name);
    expect(body.email).toBe(VALID.email);
    expect(body.message).toBe(VALID.message);
    expect(body.from_name).toBe(VALID.name);
    expect(String(body.subject)).toContain(VALID.name);
    expect(window.location.pathname).toBe("/thanks");
  });

  test("success:false renders the alert with the mailto link inside it", async () => {
    const fetchMock = mockFetch({ ok: true, success: false });
    await mount();

    field("contact-name").value = VALID.name;
    field("contact-email").value = VALID.email;
    field("contact-message").value = VALID.message;
    await submitForm();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const alert = host.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toMatch(/Could not send/);
    const fallback = alert?.querySelector('a[href^="mailto:"]');
    expect(fallback).not.toBeNull();
    expect(fallback?.textContent).toMatch(/Email me directly instead/);
    expect(window.location.pathname).toBe("/contact");
  });

  test("submit with an invalid email makes no fetch call and marks the field", async () => {
    const fetchMock = mockFetch({ ok: true, success: true });
    await mount();

    field("contact-name").value = VALID.name;
    field("contact-email").value = "not-an-email";
    field("contact-message").value = VALID.message;
    await submitForm();

    expect(fetchMock).not.toHaveBeenCalled();
    const email = field("contact-email");
    expect(email.getAttribute("aria-invalid")).toBe("true");
    expect(email.getAttribute("aria-describedby")).toBe("contact-email-error");
    expect(host.querySelector("#contact-email-error")).not.toBeNull();
    expect(document.activeElement).toBe(email);
    expect(window.location.pathname).toBe("/contact");
  });

  test("status region still always mounted", async () => {
    await mount();
    expect(host.querySelector('[role="status"]')).not.toBeNull();
  });
});
