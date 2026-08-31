import { z } from "zod";

/**
 * Single source of truth for the contact email address.
 *
 * Consumed by the Contact address-book card, the compose form (FormSubmit),
 * the direct-email panel, and the Footer quick link. Keep the account on
 * formsubmit.co in sync with this value.
 */
export const CONTACT_EMAIL = "nathanielnikolai.ladero@gmail.com";

/**
 * Pre-submit validation schema for the compose form fields. Mirrors the
 * HTML5 constraints on the inputs (required, maxLength) so invalid payloads
 * are rejected client-side in the terminal UI language before any FormSubmit
 * POST. Message text is terminal-flavored: `msg: <field> — <reason>`.
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "msg: name — required field missing")
    .max(100, "msg: name — exceeds 100 characters"),
  email: z
    .string()
    .trim()
    .min(1, "msg: email — required field missing")
    .email("msg: email — invalid address")
    .max(254, "msg: email — exceeds 254 characters"),
  subject: z
    .string()
    .trim()
    .min(1, "msg: subject — required field missing")
    .max(300, "msg: subject — exceeds 300 characters"),
  message: z
    .string()
    .trim()
    .min(1, "msg: message — required field missing")
    .max(5000, "msg: message — exceeds 5000 characters"),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export type ContactValidationResult =
  | { ok: true; data: ContactFormValues }
  | { ok: false; error: string };

/** Validate the raw form payload before it reaches FormSubmit. */
export function validateContact(input: unknown): ContactValidationResult {
  const result = contactFormSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const issue = result.error.issues[0];
  const message =
    typeof issue?.message === "string" && issue.message.startsWith("msg: ")
      ? issue.message
      : `msg: ${issue?.message ?? "invalid input"}`;
  return { ok: false, error: message };
}