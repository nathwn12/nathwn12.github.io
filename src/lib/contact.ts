/**
 * Single source of truth for the contact address and both document URLs.
 *
 * The relay form retired with the previous direction: contact is a mailto link
 * plus the two PDFs. Every surface that prints the address or links a document
 * reads these constants, so the cover, the footer, and the tests cannot drift.
 */

export const CONTACT_EMAIL = "nathanielnikolai.ladero@gmail.com";

export const RESUME_PATH = "/Nathaniel-Nikolai-Ladero-Resume.pdf";
export const CV_PATH = "/Nathaniel-Nikolai-Ladero-CV.pdf";

/** Mail client draft: one subject, no invented body template. */
export const MAIL_SUBJECT = "Backend role";

export const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  MAIL_SUBJECT,
)}`;

export const GITHUB_URL = "https://github.com/nathwn12";
export const LINKEDIN_URL =
  "https://www.linkedin.com/in/nathaniel-nikolai-l-184181261/";
