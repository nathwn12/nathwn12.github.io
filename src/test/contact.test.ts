// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { validateContact } from "../lib/contact";

/** Contact validation smoke test — mirrors the zod schema added in
 *  src/lib/contact.ts and pre-submit validation in Contact.tsx:
 *  invalid input rejected with a terminal-flavored error, valid accepted.
 *  Covers every validated user field: name, email, subject, message.
 */
describe("contact validation", () => {
  it("rejects missing name and invalid email", () => {
    const result = validateContact({
      name: "",
      email: "not-an-email",
      subject: "Job inquiry",
      message: "hi",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("name");
  });

  it("rejects an empty message", () => {
    const result = validateContact({
      name: "Nat",
      email: "n@example.com",
      subject: "Job inquiry",
      message: "   ",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing or blank subject", () => {
    const blank = validateContact({
      name: "Nat",
      email: "n@example.com",
      subject: "   ",
      message: "Hello",
    });
    expect(blank.ok).toBe(false);
    if (!blank.ok) expect(blank.error).toContain("subject");

    const missing = validateContact({
      name: "Nat",
      email: "n@example.com",
      message: "Hello",
    });
    expect(missing.ok).toBe(false);
  });

  it("rejects an overlong subject beyond maxLength 300", () => {
    const result = validateContact({
      name: "Nat",
      email: "n@example.com",
      subject: "x".repeat(301),
      message: "Hello",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("300");
  });

  it("accepts valid input and returns trimmed values", () => {
    const result = validateContact({
      name: "  Nathaniel  ",
      email: " n@example.com ",
      subject: "  Role inquiry  ",
      message: "  Hello from the terminal  ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe("Nathaniel");
      expect(result.data.email).toBe("n@example.com");
      expect(result.data.subject).toBe("Role inquiry");
      expect(result.data.message).toBe("Hello from the terminal");
    }
  });
});