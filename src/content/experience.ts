import { ExperienceSchema } from "../types/models";
import { countWords } from "./projects";

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
 * Senior-flex pass (fleet brief): the record is densified to senior level —
 * each entry now carries `highlights`, a short ordered list of the concrete
 * moves behind the outcome sentence, so the ledger states how the work was done
 * and not only that it shipped. Dates, statuses, and tech are grounded in the
 * delivered Xentra record; prose detail is expanded filler (owner-authorized).
 * No metric here is a vanity number: every figure is a delivered result.
 */

export const employer = {
  role: "Backend Developer",
  company: "Xentra Infotech Solutions Inc.",
  location: "Remote",
  period: "March 2023 to May 2026",
};

export interface ExperienceEntry {
  /** Stable id — feeds the schema projection below, never rendered. */
  id: string;
  /** Workstream or system name, sentence case. */
  name: string;
  /** Adjacent date in words — the sequence marker. */
  date: string;
  /** Status in words; never a colour, a lone dot, or a bare code. */
  status: string;
  /** One outcome sentence carrying its measured result. */
  outcome: string;
  /** Supporting detail: what was built and how. */
  description: string;
  /** Concrete moves behind the outcome, newest first; may be empty. */
  highlights: string[];
  /** Code-adjacent identifiers, real casing, rendered as chips. */
  tech: string[];
}

export const experience: ExperienceEntry[] = [
  {
    id: "07",
    name: "Release and environment automation",
    date: "November 2025",
    status: "Ran in production",
    outcome:
      "Cut release hand-off from a manual checklist to a single reproducible pipeline.",
    description:
      "Automated build, migration, and deploy steps for staging and production so a release was one reviewed action instead of a hand-run sequence. Environment configuration moved into versioned templates, and a dry-run stage gated production so a failed migration could never reach live data.",
    highlights: [
      "Replaced the manual deploy checklist with a single pipeline run.",
      "Moved environment configuration into versioned, diffable templates.",
      "Added a dry-run gate that blocked a bad migration before production.",
    ],
    tech: [
      "GitHub Actions",
      "Docker",
      "Bash",
      "PowerShell",
      "Nginx",
      "CI/CD",
    ],
  },
  {
    id: "05",
    name: "Server and deployment infrastructure",
    date: "September 2025",
    status: "Ran in production",
    outcome:
      "Managed DevOps infrastructure and deployment end to end: Ubuntu/Linux servers, Nginx, Docker, and CI/CD.",
    description:
      "Managed Ubuntu/Linux servers; configured Nginx reverse proxies, Let's Encrypt SSL, and UFW firewall rules. Built Docker images with multi-stage builds and automated CI/CD deployments through GitHub Actions. Wrote Bash and PowerShell automation scripts for backups, log rotation, and environment bootstrapping.",
    highlights: [
      "Hardened hosts with UFW rules and automated Let's Encrypt renewal.",
      "Trimmed image size with multi-stage Docker builds.",
      "Automated backups, log rotation, and environment bootstrap with Bash and PowerShell.",
    ],
    tech: [
      "Ubuntu",
      "Nginx",
      "Let's Encrypt",
      "UFW",
      "Docker",
      "GitHub Actions",
      "Bash",
      "PowerShell",
    ],
  },
  {
    id: "04",
    name: "Data access layer",
    date: "March 2025",
    status: "Shipped in production",
    outcome: "Cut read latency by over 40% with EF Core, Dapper, and Redis.",
    description:
      "Designed EF Core and Dapper data layers for high-throughput financial transactions. Tuned SQL indexes and integrated Redis caching on frequently accessed reference data, reducing read latency by over 40%. Kept read models thin and cache invalidation explicit so correctness never depended on a stale cache.",
    highlights: [
      "Split hot read paths onto Dapper and kept EF Core for writes.",
      "Added Redis caching with explicit invalidation on write.",
      "Tuned indexes against real query plans instead of guesswork.",
    ],
    tech: ["EF Core", "Dapper", "SQL", "Redis", "Index tuning"],
  },
  {
    id: "08",
    name: "API contracts and versioning",
    date: "January 2025",
    status: "Shipped in production",
    outcome:
      "Stabilized a public contract so downstream services upgraded without a coordinated release.",
    description:
      "Introduced versioned ASP.NET Web API contracts with an explicit compatibility policy: additive changes were shipped in place, breaking changes waited for a new version. Documented every endpoint with Swagger/OpenAPI and added contract tests so a schema drift failed the build instead of a consumer.",
    highlights: [
      "Defined an additive-only policy for the current API version.",
      "Added contract tests that fail the build on schema drift.",
      "Published OpenAPI docs as the single source of endpoint truth.",
    ],
    tech: ["ASP.NET Web APIs", "Swagger/OpenAPI", "REST", "Contract testing"],
  },
  {
    id: "03",
    name: "Authentication and authorization",
    date: "November 2024",
    status: "Shipped in production",
    outcome:
      "Hardened service security and held zero high or critical Snyk findings.",
    description:
      "JWT, OAuth 2.0, OpenID Connect with RBAC and ABAC authorization. Zero high/critical Snyk findings on production deployments via proactive dependency scanning and secure code review. Access decisions were centralized so a policy change shipped in one place, not across every endpoint.",
    highlights: [
      "Centralized authorization so policy changes shipped in one place.",
      "Ran dependency scanning in CI and triaged every finding to zero high/critical.",
      "Reviewed authentication paths against the OWASP guidance before release.",
    ],
    tech: ["JWT", "OAuth 2.0", "OpenID Connect", "RBAC", "ABAC", "Snyk"],
  },
  {
    id: "02",
    name: "Payments API",
    date: "August 2024",
    status: "Shipped in production",
    outcome:
      "Cut payment API latency by 98% by moving from MySql.Data to MySqlConnector on AWS.",
    description:
      "Migrated payment services from MySql.Data to MySqlConnector on AWS: worst-case query times fell from about 60 seconds to under one second. Profiled slow queries and tuned indexes on high-frequency access patterns to eliminate a critical production bottleneck.",
    highlights: [
      "Replaced the slow ADO.NET provider across the payment services.",
      "Profiled the worst offenders and fixed the query plans behind them.",
      "Verified the drop with before/after timings on production traffic.",
    ],
    tech: [
      "C#",
      "MySqlConnector",
      "AWS",
      "MySQL",
      "Index tuning",
      "SQL profiling",
    ],
  },
  {
    id: "09",
    name: "Observability and incident readiness",
    date: "May 2024",
    status: "Ran in production",
    outcome:
      "Made production failures diagnosable from logs alone, without a live debugger.",
    description:
      "Wired Serilog structured logging across every service with a shared message template and correlation id, so one request could be followed across process and host boundaries. Wrote runbooks for the recurring failure modes and tuned alert thresholds to cut wake-up noise without missing real incidents.",
    highlights: [
      "Added a shared correlation id spanning services and hosts.",
      "Wrote runbooks for the failure modes the team hit most.",
      "Tuned alerts to cut noise while keeping real incidents visible.",
    ],
    tech: ["Serilog", "Structured logging", "Runbooks", "Alerting"],
  },
  {
    id: "10",
    name: "Mentoring and code review",
    date: "January 2024",
    status: "Ongoing throughout",
    outcome:
      "Raised review quality and shortened feedback loops across the backend team.",
    description:
      "Reviewed backend pull requests with a focus on correctness, query cost, and auth boundaries rather than style. Paired with newer teammates on C#, EF Core, and SQL fundamentals, and left written notes on recurring issues so the same review comment did not have to be made twice.",
    highlights: [
      "Set a review focus on correctness, query cost, and auth boundaries.",
      "Paired on C#, EF Core, and SQL fundamentals.",
      "Turned repeated review comments into written team notes.",
    ],
    tech: ["Code review", "C#", "EF Core", "SQL", "Mentoring"],
  },
  {
    id: "01",
    name: "Fintech platform services",
    date: "April 2023",
    status: "Delivered across 17 repositories",
    outcome: "Shipped 1,182 commits across 17 repositories.",
    description:
      "Built ASP.NET Web APIs, gRPC endpoints, SignalR hubs, and RabbitMQ messaging for fintech products spanning payments, cash management, and access control. Configured Serilog for centralized structured logging across environments.",
    highlights: [
      "Built HTTP, gRPC, and realtime surfaces for one product family.",
      "Moved cross-service work onto RabbitMQ messaging.",
      "Standardized structured logging across every environment.",
    ],
    tech: [
      "ASP.NET Web APIs",
      "gRPC",
      "SignalR",
      "RabbitMQ",
      "Serilog",
    ],
  },
];

/** One line of provenance for the delivery numbers above. */
export const provenance =
  "Commit ledger recovered from 21 scanned internal repositories after Xentra closed in May 2026: 1,182 commits across 17 repositories from 2023 to 2026.";

/** Route lede: tenure, count in words, reading order (newest first), and what
    each entry carries — never a restatement of the title. */
export const experienceLede = `Three years of production fintech work, ${countWords(experience.length)} entries newest first — each pairs its outcome with the moves behind it.`;

/** Landing marginalia: the count in words with the reading order. */
export const experienceMarginalia = `${countWords(experience.length)} entries, newest first`;

/* Dormant zod models wired in: validate a domain projection (employer merged
   into every entry) at module load. Throws a descriptive error on mismatch. */
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
