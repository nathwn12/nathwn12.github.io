// Static regression test for the keyless Contact page:
// mailto draft + copy button + issue link, and nothing else.
// Node-only source analysis (no jsdom / DOM / rendering):
//   npx vitest run tests/contact-status.test.ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "..");
const contactPath = resolve(root, "src", "components", "Contact.tsx");
const footerPath = resolve(root, "src", "components", "Footer.tsx");
const libPath = resolve(root, "src", "lib", "contact.ts");
const contentPath = resolve(root, "src", "content", "contact.ts");
const thanksPath = resolve(root, "src", "components", "Thanks.tsx");
const routerPath = resolve(root, "src", "lib", "router.tsx");
const appPath = resolve(root, "src", "App.tsx");
const navNamesPath = resolve(root, "src", "lib", "navNames.ts");

const contact = readFileSync(contactPath, "utf8");
const footer = readFileSync(footerPath, "utf8");
const lib = existsSync(libPath) ? readFileSync(libPath, "utf8") : "";
const router = readFileSync(routerPath, "utf8");
const app = readFileSync(appPath, "utf8");
const navNames = readFileSync(navNamesPath, "utf8");

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
    // the raw address lives only in the constant module
    expect(
      (lib.match(/nathanielnikolai\.ladero@gmail\.com/g) ?? []).length,
    ).toBe(1);
    expect(contact.includes(EMAIL)).toBe(false);
    expect(footer.includes(EMAIL)).toBe(false);
  });

  test("has no relay scaffolding module left behind", () => {
    expect(
      existsSync(contentPath),
      "src/content/contact.ts should be deleted",
    ).toBe(false);
    expect(contact).not.toMatch(/content\/contact/);
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

  test("renders no form element anywhere on the page", () => {
    expect(contact).not.toMatch(/<form[\s>]/);
    expect(contact).not.toMatch(/ContactRelayForm/);
    expect(contact).not.toMatch(/relayEnabled/);
    expect(contact).not.toMatch(/handleSubmit/);
  });

  test("carries no relay credentials or endpoints", () => {
    expect(contact).not.toMatch(/access_key/);
    expect(contact).not.toMatch(/api\.web3forms\.com/);
    expect(contact).not.toMatch(/[Ww]eb3[Ff]orms/);
    expect(contact).not.toMatch(/WEB3FORMS_KEY/);
  });

  test("retires the old FormSubmit relay", () => {
    expect(contact).not.toMatch(/formsubmit\.co/i);
    expect(contact).not.toMatch(/FormSubmit/);
    expect(contact).not.toMatch(/_honey/);
    expect(contact).not.toMatch(/_captcha/);
  });

  test("has no /thanks confirmation route left behind", () => {
    expect(
      existsSync(thanksPath),
      "src/components/Thanks.tsx should be deleted",
    ).toBe(false);
    expect(contact).not.toMatch(/\/thanks/);
    expect(router).not.toMatch(/THANKS_ROUTE/);
    expect(router).not.toMatch(/\/thanks/);
    expect(app).not.toMatch(/[Tt]hanks/);
    expect(navNames).not.toMatch(/thanks/);
  });

  test("removes the goodbye filler from the contact page", () => {
    expect(contact.includes("goodbye")).toBe(false);
    expect(contact.includes("cat /dev/null")).toBe(false);
    expect(contact.includes("Thanks for visiting")).toBe(false);
  });
});
