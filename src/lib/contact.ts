/**
 * Single source of truth for the contact email address and the two documents.
 *
 * The site has no contact form: a message is a mailto with the draft already
 * written (the Contact band), and the résumé and CV are two PDFs at the site
 * root. This module is the only place either path is typed, so the first
 * screen, the footer and the build all agree. The documents are offered once
 * per route: by the cover on `/`, by the footer on the two routes with no cover.
 */
export const CONTACT_EMAIL = "nathanielnikolai.ladero@gmail.com";

export const RESUME_PATH = "/Nathaniel-Nikolai-Ladero-Resume.pdf";
export const CV_PATH = "/Nathaniel-Nikolai-Ladero-CV.pdf";

export const RESUME_FILENAME = "Nathaniel-Nikolai-Ladero-Resume.pdf";
export const CV_FILENAME = "Nathaniel-Nikolai-Ladero-CV.pdf";
