/**
 * Content module: Hero — the landing page's two authored claims.
 *
 * Owns the opening claim (the static h1 hook) and the one prose line naming
 * the stack the career was built on. Every other claim on this site already
 * lives in src/content/*.ts; this module gives these two the same single
 * home so copy can be corrected without touching a component.
 *
 * Validation choice: a plain typed export with no module-load check. The
 * other content modules validate at load because they project domain records
 * against zod models; these are two fixed copy strings with no shared domain
 * primitive, so a schema would add ceremony without a mismatch it could catch.
 */

/** The fixed opening hook — leads every visit, static default. */
export const heroClaim: string =
  "Payment backends that hold up under production load.";

/** The one prose line naming the systems the stack carried. */
export const coreStack: string =
  "C# and ASP.NET services for payments, cash management, and access control.";

/** The availability status line shown directly under the contact CTA. */
export const availability: string = "Open to backend roles — remote.";
