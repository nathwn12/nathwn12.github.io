// Static regression test for the keyless Contact page + the single
// contact-email constant. Node-only source analysis (no jsdom / DOM /
// rendering):
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
const ISSUES = "https://github.com/nathwn12/nathwn12/issues/new";

describe("contact keyless regressions", () => {
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
    // the raw address may only live in the constant module
    expect(
      (lib.match(/nathanielnikolai\.ladero@gmail\.com/g) ?? []).length,
    ).toBe(1);
    expect(contact.includes(EMAIL)).toBe(false);
    expect(footer.includes(EMAIL)).toBe(false);
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
    expect(contact.match(/role="status"/g)?.length).toBe(1);
  });

  test("links the public issue tracker for non-private messages", () => {
    expect(contact.includes(ISSUES)).toBe(true);
    expect(contact).toMatch(/target="_blank"/);
    expect(contact).toMatch(/rel="noopener noreferrer"/);
  });

  test("says what happens next in one honest line", () => {
    expect(contact).toMatch(/usually answer within a day or two/);
  });

  test("carries no form that posts nowhere: no form element, no relay, no honeypot", () => {
    expect(contact).not.toMatch(/<form/);
    expect(contact).not.toMatch(/formsubmit\.co/i);
    expect(contact).not.toMatch(/FormSubmit/);
    expect(contact).not.toMatch(/_honey/);
    expect(contact).not.toMatch(/_captcha/);
    expect(contact).not.toMatch(/handleSubmit/);
    expect(contact).not.toMatch(/validateContactFields/);
  });

  test("removes the goodbye filler from the contact page", () => {
    expect(contact.includes("goodbye")).toBe(false);
    expect(contact.includes("cat /dev/null")).toBe(false);
    expect(contact.includes("Thanks for visiting")).toBe(false);
  });
});
