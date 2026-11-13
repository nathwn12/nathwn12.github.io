/**
 * Content module: Hero — the page's opening claim and its availability line.
 *
 * Owns the sentence the record band opens on, and the one line that says what
 * kind of work is wanted. The identity itself (the three display lines and the
 * standfirst) lives in src/content/ledger.ts with the rest of the home copy.
 *
 * Validation choice: a plain typed export with no module-load check. The
 * other content modules validate at load because they project domain records
 * against zod models; these are fixed copy strings with no shared domain
 * primitive, so a schema would add ceremony without a mismatch it could catch.
 */

/** The record band's opening sentence. It was the cover's headline; it is a
 *  sentence now, and the payment figure underneath it is what backs it. */
export const recordOpener: string =
  "Payment backends that hold up under production load.";

/** The availability status line shown on the cover. */
export const availability: string =
  "Open to software engineering roles — remote.";
