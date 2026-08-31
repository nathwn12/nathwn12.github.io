import { ExperienceSchema } from "../types/models";

/**
 * Content module: Experience section data, moved verbatim out of
 * src/components/Experience.tsx. Validated against the (formerly dormant)
 * zod models at module load so a mismatch fails fast at build/dev time.
 * Rendered output must stay byte-identical to the pre-move component.
 */

export const employer = {
  unit: "career.service",
  role: "Backend Developer",
  company: "Xentra Infotech Solutions Inc.",
  location: "Remote",
  period: "Mar 2023 – May 2026",
};

export interface LogEntry {
  id: string;
  unit: string;
  timestamp: string;
  status: string;
  summary: string;
  description: string;
  tech: string[];
}

export const logEntries: LogEntry[] = [
  {
    id: "01",
    unit: "career.service",
    timestamp: "2023-04-11 09:12:05",
    status: "OK",
    summary: "Shipped 1,182 commits across 17 repositories",
    description:
      "Built ASP.NET Web APIs, gRPC endpoints, SignalR hubs, and RabbitMQ messaging for fintech products spanning payments, cash management, and access control. Configured Serilog for centralized structured logging across environments.",
    tech: ["ASP.NET WEB APIS", "GRPC", "SIGNALR", "RABBITMQ", "SERILOG"],
  },
  {
    id: "02",
    unit: "payments-api.service",
    timestamp: "2024-08-14 14:37:42",
    status: "OK",
    summary: "Cut API latency by 98% — MySql.Data → MySqlConnector on AWS",
    description:
      "Migrated payment services from MySql.Data to MySqlConnector on AWS — worst-case query times ~60s → under 1s. Profiled slow queries, tuned indexes on high-frequency access patterns to eliminate a critical production bottleneck.",
    tech: [
      "C#",
      "MYSQLCONNECTOR",
      "AWS",
      "MYSQL",
      "INDEX TUNING",
      "SQL PROFILING",
    ],
  },
  {
    id: "03",
    unit: "auth.service",
    timestamp: "2024-11-02 16:05:19",
    status: "OK",
    summary: "Hardened service security — zero high/critical Snyk findings",
    description:
      "JWT, OAuth 2.0, OpenID Connect with RBAC and ABAC authorization. Zero high/critical Snyk findings on production deployments via proactive dependency scanning and secure code review.",
    tech: ["JWT", "OAUTH 2.0", "OPENID CONNECT", "RBAC", "ABAC", "SNYK"],
  },
  {
    id: "04",
    unit: "data-access.service",
    timestamp: "2025-03-19 11:48:33",
    status: "OK",
    summary: "Slashed read latency by 40%+ — EF Core, Dapper, Redis",
    description:
      "Designed EF Core and Dapper data layers for high-throughput financial transactions. Tuned SQL indexes and integrated Redis caching on frequently accessed reference data, reducing read latency by over 40%.",
    tech: ["EF CORE", "DAPPER", "SQL", "REDIS", "INDEX TUNING"],
  },
  {
    id: "05",
    unit: "infra.service",
    timestamp: "2025-09-27 07:22:58",
    status: "OK",
    summary:
      "Managed DevOps infrastructure and deployment — Ubuntu/Linux, Nginx, Docker, CI/CD",
    description:
      "Managed Ubuntu/Linux servers; configured Nginx reverse proxies, Let's Encrypt SSL, and UFW firewall rules. Built Docker images with multi-stage builds and automated CI/CD deployments through GitHub Actions. Wrote Bash and PowerShell automation scripts for backups, log rotation, and environment bootstrapping.",
    tech: [
      "UBUNTU",
      "NGINX",
      "LET'S ENCRYPT",
      "UFW",
      "DOCKER",
      "GITHUB ACTIONS",
      "BASH",
      "POWERSHELL",
    ],
  },
  {
    id: "06",
    unit: "ai-workflow.service",
    timestamp: "2026-02-10 13:59:47",
    status: "OK",
    summary: "Integrated AI across the development lifecycle",
    description:
      "Uses LM Studio, OpenCode, and Codex daily for coding, refactoring, investigative development, and prompt engineering. Works with preferred local models including Qwen 3.8, DeepSeek V4 Flash, and Qwen 3.5 (9B, 27B) for local LLM workflows.",
    tech: [
      "LM STUDIO",
      "OPENCODE",
      "CODEX",
      "QWEN 3.8",
      "DEEPSEEK V4 FLASH",
      "QWEN 3.5 (9B/27B)",
    ],
  },
];

/* Dormant zod models wired in: validate a domain projection (employer merged
   into every entry) at module load. Throws a descriptive error on mismatch. */
const experienceProjection = logEntries.map((entry) => ({
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