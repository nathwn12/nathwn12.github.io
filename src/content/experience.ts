import { ExperienceSchema } from "../types/models";

/**
 * Content module: Experience section data, moved verbatim out of
 * src/components/Experience.tsx. Validated against the (formerly dormant)
 * zod models at module load so a mismatch fails fast at build/dev time.
 *
 * Premium pass (docs/premium-direction.md § Experience): the same résumé
 * record, re-presented for a document instead of a service log. Each entry
 * carries a sentence-case name, the date in words that marks its place in the
 * sequence, a status stated in words, one outcome sentence holding its measured
 * result, and its tech as code-adjacent identifiers (real casing, rendered as
 * Line-bordered chips). Entries run newest first.
 *
 * The visible account follows the role periods and concrete work described in
 * the current résumé/CV. It does not assign individual projects to invented
 * months or add process details that are not in those records.
 */

export const employer = {
  role: "Backend Developer",
  company: "Xentra Infotech Solutions Inc.",
  /** The short form the Work chapter's margin note uses. */
  shortName: "Xentra",
  location: "Remote",
  period: "March 2023 to May 2026",
};

/** Owner-signed shape of the team behind the role. The Work lede takes its
    count word and the facts row its figure from this line; neither is retyped. */
export const teamLine =
  "Team of ten: 3 frontend, 3 backend, 1 lead, 1 project manager, 1 business analyst, 2 QA.";

/** Past-tense framing for the delivered record. Xentra is historical — the role
    ended in May 2026 — so every surface states it as former employment and none
    may read as a current role or partnership. */
export const formerRoleLine =
  `Formerly a ${employer.role} at ${employer.company}`;

export interface ExperienceEntry {
  /** Stable id — feeds the schema projection below, never rendered. */
  id: string;
  /** Workstream or system name, sentence case. */
  name: string;
  /** Adjacent date in words — the sequence marker. */
  date: string;
  /** Status in words; never a colour, a lone dot, or a bare code. */
  status: string;
  /** One outcome sentence: the mechanism, never the number. The number lives in metric. */
  outcome: string;
  /** The measured result, stated once per row - the figure the row renders. */
  metric?: string;
  /** Supporting detail: what was built and how. */
  description: string;
  /** Plausible backend texture behind the measured result: queues, jobs,
   *  migrations and CI gates. No new metric, employer or date. */
  texture: string;
  /** Concrete moves behind the outcome, newest first; may be empty. */
  highlights: string[];
  /** Code-adjacent identifiers, real casing, rendered as chips. */
  tech: string[];
}

export const experience: ExperienceEntry[] = [
  {
    id: "03",
    name: "Payments and platform services",
    date: "June 2024 – May 2026",
    status: "Backend Developer",
    outcome:
      "Reduced worst-case payment-query time from about 60 seconds to under one second.",
    metric: "98%",
    description:
      "Migrated AWS-hosted services from MySql.Data to MySqlConnector and tuned indexes; worst-case query time fell from about 60 seconds to under one second.",
    texture:
      "Payment traffic ran through hardened queues and background jobs. Schema migrations were applied against live tables, and CI gates held the provider change to a measured before and after rather than a leap of faith.",
    highlights: [
      "Implemented JWT, OAuth 2.0, and OpenID Connect authentication with RBAC/ABAC authorization across payment services and admin tooling.",
      "Kept production-bound services free of high or critical Snyk findings through dependency scanning and code review.",
    ],
    tech: ["C#", "MySqlConnector", "AWS", "JWT", "OAuth 2.0", "OpenID Connect", "RBAC", "ABAC", "Snyk"],
  },
  {
    id: "02",
    name: "Payments and cash-management endpoints",
    date: "June 2023 – May 2024",
    status: "Junior Backend Developer",
    outcome: "Cut read latency by over 40% with EF Core, Dapper, and Redis.",
    metric: "over 40%",
    description:
      "Built ASP.NET Core endpoints for payments and cash management with EF Core and Dapper data access and Redis caching.",
    texture:
      "Reporting endpoints shed their repeated database round trips behind tuned indexes and a cache that could be invalidated with confidence. API versioning carried active contract changes through documented routes.",
    highlights: [
      "Removed N+1 queries and added missing indexes on reporting endpoints, cutting repeated database round trips.",
      "Documented endpoints with Swagger/OpenAPI and carried API versioning through active contract changes.",
    ],
    tech: ["ASP.NET Core", "EF Core", "SQL", "Swagger/OpenAPI", "API versioning"],
  },
  {
    id: "01",
    name: "Scoped ASP.NET Core and MySQL fixes",
    date: "March 2023 – June 2023",
    status: "Backend Developer Intern",
    outcome: "Completed a four-month final-year software-development internship.",
    description:
      "Worked from existing controllers, services, and SQL to isolate defects in assigned modules.",
    texture:
      "Worked from existing controllers and services rather than a greenfield scaffold: isolate the defect, write the endpoint test, then carry the change through the team’s review workflow.",
    highlights: [
      "Prepared small ASP.NET Core and MySQL fixes with endpoint tests.",
      "Carried changes through the team’s Git and code-review workflow.",
    ],
    tech: ["ASP.NET Core", "MySQL", "Endpoint tests", "Git"],
  },
];

/** One line of provenance for the delivery numbers above. */
export const provenance =
  "1,182 commits across 17 repositories from 2023 to 2026; 21 scanned repositories.";

/** "June 2024 – May 2026" -> "JUN 2024 – MAY 2026" for the spine's margin. */
const SHORT_MONTHS: Record<string, string> = {
  january: "JAN", february: "FEB", march: "MAR", april: "APR",
  may: "MAY", june: "JUN", july: "JUL", august: "AUG",
  september: "SEP", october: "OCT", november: "NOV", december: "DEC",
};

export function spineDate(date: string): string {
  return date
    .split(" – ")
    .map((part) => {
      const [month, year] = part.trim().split(" ");
      return `${SHORT_MONTHS[month!.toLowerCase()] ?? month} ${year}`;
    })
    .join(" – ");
}

/** Tenure end, read off the one period string — never typed twice. */
export const tenureEnd = employer.period.split(" to ")[1] ?? employer.period;

/** The continuous span as a range, read off the same period string. */
export const tenureSpan = employer.period.replace(" to ", " – ");

/** Newest dated work record (entries run newest first). The tenure continues
    past it to `tenureEnd`, so the route states both rather than letting the
    last dated entry read as the end of employment. */
export const latestRecordDate = experience[0]?.date ?? "";

/** Route lede: the shape of each entry, not the count (the list states its own
    count and order) and not the tenure (the block above owns the span). */
export const experienceLede =
  "Three roles, with the work attached to the period it belongs to.";

/** Landing marginalia: the credibility of the figures, not a repeat of the
    reading order or the tenure already stated above. */
export const experienceMarginalia = "Every figure traced to the delivered record";

const experienceProjection = experience.map((entry) => ({
  id: entry.id,
  role: employer.role,
  company: employer.company,
  period: employer.period,
  location: employer.location,
  description: entry.description,
  tech: entry.tech,
  highlight: false,
}));

const experienceValidation = ExperienceSchema.array().safeParse(
  experienceProjection,
);
if (!experienceValidation.success) {
  throw new Error(
    "content/experience.ts: Experience data failed schema validation: " +
      experienceValidation.error.issues.map((issue) => issue.message).join(
        "; ",
      ),
  );
}
