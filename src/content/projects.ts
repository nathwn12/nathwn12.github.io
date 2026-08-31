import { ProjectSchema } from "../types/models";

/**
 * Content module: Projects section data, moved verbatim out of
 * src/components/Projects.tsx. Validated against the (formerly dormant)
 * zod models at module load. Rendered output must stay byte-identical.
 */

export type Token = "accent" | "accent-2" | "accent-3" | "accent-4";

export interface ProjectLore {
  id: string;
  /** README title shown in the expanded `cat` view */
  name: string;
  /** Directory name in the `ls -la` listing */
  dir: string;
  description: string;
  tech: string[];
  token: Token;
  stats: { label: string; value: string; token: Token }[];
}

// Selected production work from the résumé record.
export const projects: ProjectLore[] = [
  {
    id: "01",
    name: "Payments Latency Migration",
    dir: "payments-latency-migration",
    description:
      "Migrated MySql.Data → MySqlConnector on AWS; profiled slow queries and tuned indexes across payment services — worst-case query time cut from ~60s to under 1s (98% reduction).",
    tech: ["C#", "MySqlConnector", "AWS", "SQL tuning"],
    token: "accent",
    stats: [
      { label: "latency cut", value: "98%", token: "accent" },
      { label: "worst-case query", value: "60s → <1s", token: "accent" },
      { label: "scope", value: "payment svcs", token: "accent" },
    ],
  },
  {
    id: "02",
    name: "Fintech Service Platform",
    dir: "fintech-service-platform",
    description:
      "1,100+ commits across 17 repositories: ASP.NET Web APIs, gRPC endpoints, SignalR hubs, RabbitMQ messaging, and Serilog for centralized structured logging across environments — products spanning payments, cash management, and access control.",
    tech: ["C#", "ASP.NET Web APIs", "gRPC", "SignalR", "RabbitMQ", "Serilog"],
    token: "accent-2",
    stats: [
      { label: "commits", value: "1,100+", token: "accent-2" },
      { label: "repositories", value: "17", token: "accent-2" },
      { label: "product domains", value: "3", token: "accent-2" },
    ],
  },
  {
    id: "03",
    name: "Auth Hardening",
    dir: "auth-hardening",
    description:
      "Implemented JWT, OAuth 2.0, and OpenID Connect with RBAC + ABAC authorization; maintained zero high or critical Snyk findings on production deployments through proactive dependency scanning and secure code review.",
    tech: ["JWT", "OAuth 2.0", "OpenID Connect", "RBAC", "ABAC", "Snyk"],
    token: "accent-3",
    stats: [
      { label: "high/critical", value: "0", token: "accent-3" },
      {
        label: "auth protocols",
        value: "JWT · OAuth2 · OIDC",
        token: "accent-3",
      },
      { label: "access models", value: "RBAC + ABAC", token: "accent-3" },
    ],
  },
  {
    id: "04",
    name: "Read Cache Data Layer",
    dir: "read-cache-data-layer",
    description:
      "Designed EF Core + Dapper data layers for high-throughput financial transactions; tuned SQL indexes and integrated Redis caching on frequently accessed reference data, reducing read latency by over 40%.",
    tech: ["C#", "EF Core", "Dapper", "SQL", "Redis"],
    token: "accent-4",
    stats: [
      { label: "read latency gain", value: "40%+", token: "accent-4" },
      { label: "hot data cache", value: "Redis", token: "accent-4" },
      { label: "data layers", value: "EF Core + Dapper", token: "accent-4" },
    ],
  },
];

/* Dormant zod models wired in: token → palette hex (dark theme) so the real
   data can be validated against ProjectSchema at module load. */
const TOKEN_HEX: Record<Token, string> = {
  accent: "#8ae234",
  "accent-2": "#729fcf",
  "accent-3": "#f57900",
  "accent-4": "#ad7fa8",
};

const projectsProjection = projects.map((project) => ({
  id: project.id,
  name: project.name,
  description: project.description,
  tech: project.tech,
  status: "PRODUCTION" as const,
  color: TOKEN_HEX[project.token],
  stats: project.stats.map((stat) => ({
    label: stat.label,
    value: stat.value,
    color: TOKEN_HEX[stat.token],
  })),
}));

const projectsValidation = ProjectSchema.array().safeParse(projectsProjection);
if (!projectsValidation.success) {
  throw new Error(
    "content/projects.ts: Project data failed schema validation: " +
      projectsValidation.error.issues.map((issue) => issue.message).join("; "),
  );
}