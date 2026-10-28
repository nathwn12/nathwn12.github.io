/**
 * Content module: Hero — the landing page's two authored claims.
 *
 * Owns the opening claim (the static h1 deck), the one prose line naming the
 * stack the career was built on, the availability line, and the core stack
 * list the About band prints. Every other claim on this site already lives in
 * src/content/*.ts; this module gives these the same single home so copy can be
 * corrected without touching a component.
 *
 * Validation choice: a plain typed export with no module-load check. These are
 * fixed copy strings and a fact list with no shared domain primitive, so a
 * schema would add ceremony without a mismatch it could catch.
 */

/** The fixed opening claim - the one sentence the cover spends its display. */
export const heroClaim: string =
  "Payment backends that hold up under production load.";

/** The one prose line naming the systems the stack carried. */
export const coreStack: string =
  "C# and ASP.NET services for payments, cash management, and access control.";

/**
 * Availability. Owner-confirmed truth: open to backend roles, remote. Remote was
 * explicitly confirmed by the owner on 2026-10-28; hybrid, salary, and
 * notice-period claims remain unconfirmed and may not be attached. The string is
 * reproduced byte for byte in public/llms.txt, and the cover and the contact
 * band both render this constant so the three cannot drift.
 */
export const availability: string = "Open to backend roles — remote.";

/**
 * The core stack read off the delivered record and the published CV. Order is
 * the one the About band prints; every entry is already named in
 * index.html's Person JSON-LD and src/content/skills.ts.
 */
export const coreStackList: string[] = [
  "C#",
  "ASP.NET Core",
  "EF Core",
  "Dapper",
  "MySQL",
  "Redis",
  "RabbitMQ",
  "AWS",
  "Docker",
  "GitHub Actions",
  "JWT",
  "OAuth 2.0",
];
