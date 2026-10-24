import { z } from "zod";

/**
 * Single source of truth for the contact email address.
 *
 * Consumed by the Contact address block, the compose form (FormSubmit), the
 * direct-email fallback in the error state, and the Footer quick link. Keep
 * the account on formsubmit.co in sync with this value.
 */
export const CONTACT_EMAIL = "nathanielnikolai.ladero@gmail.com";

export const RESUME_PATH = "/Nathaniel-Nikolai-Ladero-Resume.pdf";

/**
 * Pre-submit validation schema for the compose form fields. Mirrors the
 * HTML5 constraints on the inputs (required, maxLength) so invalid payloads
 * are rejected client-side before any FormSubmit POST.
 *
 * Messages are user-facing sentences (docs/premium-direction.md § Adversarial
 * review): sentence case, no command-line framing, and each one names the field it
 * belongs to so the field-level text and the error summary can both stand
 * alone. The send contract — field names, order, and the values that reach
 * FormSubmit — is unchanged.
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(100, "Name must be 100 characters or fewer."),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter an email address in the form name@example.com.")
    .max(254, "Email address must be 254 characters or fewer."),
  subject: z
    .string()
    .trim()
    .min(1, "Add a subject.")
    .max(300, "Subject must be 300 characters or fewer."),
  message: z
    .string()
    .trim()
    .min(1, "Write your message.")
    .max(5000, "Message must be 5000 characters or fewer."),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export type ContactValidationResult =
  | { ok: true; data: ContactFormValues }
  | { ok: false; error: string };

/** The four validated form fields, in the order they are labeled on the page. */
export type ContactField = "name" | "email" | "subject" | "message";

export interface ContactFieldError {
  field: ContactField;
  message: string;
}

const FIELD_NAMES: readonly ContactField[] = [
  "name",
  "email",
  "subject",
  "message",
];

/** Used only when zod reports a structural issue (`Required`, `Invalid input`)
    instead of one of the sentence-case messages above — a missing key rather
    than an empty one, which the form itself never sends. */
const FIELD_FALLBACK: Record<ContactField, string> = {
  name: "Enter your name.",
  email: "Enter your email address.",
  subject: "Add a subject.",
  message: "Write your message.",
};

const STRUCTURAL_MESSAGE = /^(required|invalid input|invalid type)/i;

/**
 * Validate the raw form payload once, per field: the first issue for each of
 * the four fields, in form order. The compose form renders these beside the
 * control they belong to, and again in the linked error summary — one parse,
 * so the two surfaces cannot disagree.
 */
export function validateContactFields(input: unknown): ContactFieldError[] {
  const result = contactFormSchema.safeParse(input);
  if (result.success) return [];

  const errors: ContactFieldError[] = [];
  const seen = new Set<ContactField>();

  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    if (!FIELD_NAMES.includes(key as ContactField)) continue;
    const field = key as ContactField;
    if (seen.has(field)) continue;
    seen.add(field);
    errors.push({
      field,
      message: STRUCTURAL_MESSAGE.test(issue.message)
        ? FIELD_FALLBACK[field]
        : issue.message,
    });
  }

  return errors.sort(
    (a, b) => FIELD_NAMES.indexOf(a.field) - FIELD_NAMES.indexOf(b.field),
  );
}

/** Validate the raw form payload before it reaches FormSubmit: the first
    issue anywhere in the payload, as one message. */
export function validateContact(input: unknown): ContactValidationResult {
  const result = contactFormSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const [first] = validateContactFields(input);
  return { ok: false, error: first?.message ?? "Check the form and try again." };
}
