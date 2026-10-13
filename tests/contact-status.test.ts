// Static regression test for the Contact status chip + the single contact-email
// constant. Node-only source analysis (no jsdom / DOM / rendering):
//   npx vitest run tests/contact-status.test.ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "..");
const contactPath = resolve(root, "src", "components", "Contact.tsx");
const footerPath = resolve(root, "src", "components", "Footer.tsx");
const libPath = resolve(root, "src", "lib", "contact.ts");

const contact = readFileSync(contactPath, "utf8");
const footer = readFileSync(footerPath, "utf8");
const lib = existsSync(libPath) ? readFileSync(libPath, "utf8") : "";

const EMAIL = "nathanielnikolai.ladero@gmail.com";

describe("contact status chip regressions", () => {
  test("drops the retired ALL-CAPS status chip for sentence-case copy", () => {
    // docs/premium-direction.md § "All caps labels": every label is
    // sentence case, so the bracket-chip status vocabulary is retired.
    for (const retired of ["[FORM READY]", "[SENDING]", "[QUEUED]", "[ERROR]"]) {
      expect(contact.includes(retired)).toBe(false);
    }
    expect(contact).not.toMatch(/\[[A-Z][A-Z ]+\]/);
    expect(contact.includes("Message sent.")).toBe(true);
    expect(contact.includes("Sending your message…")).toBe(true);
  });

  test("renders the chip as a single always-mounted role=status live region", () => {
    expect(contact).toMatch(/role="status"/);
    expect(contact).not.toMatch(/role=\{formStatus/);
    expect(contact.match(/role="status"/g)?.length).toBe(1);
  });

  test("derives the status line from status.kind, not a STATUS_PANEL lookup", () => {
    expect(contact).toMatch(/status\.kind === "sent"/);
    expect(contact).toMatch(/status\.kind === "sending"/);
    expect(contact).not.toMatch(/STATUS_PANEL/);
    expect(contact).not.toMatch(/formStatus/);
    expect(contact).not.toMatch(/\? "border-/);
  });

  test("shares one CONTACT_EMAIL source across contact, form, and footer links", () => {
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
    expect(contact).toMatch(
      /https:\/\/formsubmit\.co\/ajax\/\$\{CONTACT_EMAIL\}/,
    );
    expect(footer).toMatch(/mailto:\$\{CONTACT_EMAIL\}/);
    // the raw address may only live in the constant module
    expect(
      (lib.match(/nathanielnikolai\.ladero@gmail\.com/g) ?? []).length,
    ).toBe(1);
    expect(contact.includes(EMAIL)).toBe(false);
    expect(footer.includes(EMAIL)).toBe(false);
  });

  test("removes the goodbye filler from the contact status footer", () => {
    expect(contact.includes("goodbye")).toBe(false);
    expect(contact.includes("cat /dev/null")).toBe(false);
    expect(contact.includes("Thanks for visiting")).toBe(false);
  });

  test("keeps FormSubmit captcha enabled and the honeypot intact", () => {
    expect(contact).toMatch(/name="_captcha" value="true"/);
    expect(contact.includes('type="hidden"')).toBe(true);
    expect(contact.includes('name="_honey"')).toBe(true);
    expect(contact.includes("tabIndex={-1}")).toBe(true);
    expect(contact.includes('autoComplete="off"')).toBe(true);
    expect(contact.includes('style={{ display: "none" }}')).toBe(true);
  });

  test("parses FormSubmit responses defensively without leaking raw bytes", () => {
    expect(contact).not.toMatch(/const result = await res\.json\(\)/);
    expect(contact).toMatch(
      /payloadJson\?\.message \|\| "Something went wrong\."/,
    );
    expect(contact.includes("Non-JSON body")).toBe(true);
  });

  test("blocks duplicate parallel submissions at the submit boundary", () => {
    expect(contact).toMatch(/if \(isSubmitting\) return;/);
  });

  test("bounds compose inputs with sensible maxLength limits", () => {
    expect(contact).toMatch(/id="form-name"[\s\S]*?maxLength=\{100\}/);
    expect(contact).toMatch(/id="form-email"[\s\S]*?maxLength=\{254\}/);
    expect(contact).toMatch(/id="form-subject"[\s\S]*?maxLength=\{300\}/);
    expect(contact).toMatch(/id="form-message"[\s\S]*?maxLength=\{5000\}/);
  });

  test("keeps one role=status chip and one role=alert detail panel", () => {
    expect(contact.match(/role="status"/g)?.length).toBe(1);
    expect(contact.match(/role="alert"/g)?.length).toBe(1);
  });
});
