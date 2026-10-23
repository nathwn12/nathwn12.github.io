import { SkillCategorySchema } from "../types/models";
import { countWords } from "./projects";

/**
 * Content module: Skills section data, moved verbatim out of
 * src/components/Skills.tsx. Validated against the (formerly dormant) zod
 * models at module load. Rendered output must stay byte-identical.
 *
 * Premium pass (docs/premium-direction.md § Skills): groups stay in this order
 * and every package keeps its name, version, and one-line note. What changed is
 * presentation-only — notes are sentence case, the tier is stated in words
 * (`TIER_WORDS`) instead of a colour key, and `GROUP_NOTES` carries the
 * one-line group summary that used to be the inspector's unit role.
 */

export type Tier = "DAILY" | "PROD" | "WORKING";

export interface PackageInfo {
  /** Human-readable name, e.g. "ASP.NET Core" */
  name: string;
  /** Lowercase-hyphenated package slug, e.g. "aspnet-core" */
  slug: string;
  /** Real technology version from the resume-era ecosystem, or "-" when unversioned */
  version: string;
  /** Short one-line note, sentence case */
  description: string;
  tier: Tier;
}

export interface RepoGroup {
  /** Group partition, kept for the content model; not rendered */
  fork: string;
  /** Group path, kept for the content model; not rendered */
  repo: string;
  /** Group heading, sentence case */
  label: string;
  packages: PackageInfo[];
}

/**
 * Tier in words — the direction's vocabulary (daily driver, production shipped,
 * working knowledge). No colour key, no bars, no proficiency numerals, so this
 * is the only tier presentation the page has.
 */
export const TIER_WORDS: Record<Tier, string> = {
  DAILY: "Daily driver",
  PROD: "Production shipped",
  WORKING: "Working knowledge",
};

/** One-line summary per group, keyed by the group heading. */
export const GROUP_NOTES: Record<string, string> = {
  "Backend & Languages":
    "Service contracts, transports, and the backend runtime they run on.",
  "Data & Messaging":
    "Persistence, caching, messaging, and query performance.",
  "Cloud/DevOps": "Cloud infrastructure, containers, and release automation.",
  "Security & Auth":
    "Identity, access policy, dependency safety, and transport security.",
  "AI-Assisted Development":
    "AI-assisted development and local open-weight model workflows.",
  "Testing & Tools":
    "Testing, documentation, version control, and operational review.",
};

export const repos: RepoGroup[] = [
  {
    fork: "core",
    repo: "core/backend",
    label: "Backend & Languages",
    packages: [
      { name: "C#", slug: "csharp", version: "12.0", description: "Primary language", tier: "DAILY" },
      { name: "ASP.NET", slug: "aspnet-core", version: "9.0", description: "Web framework", tier: "DAILY" },
      { name: ".NET 6/7/8/9", slug: "dotnet", version: "9.0", description: "Runtime and SDK", tier: "DAILY" },
      { name: "EF Core", slug: "ef-core", version: "9.0", description: "ORM and migrations", tier: "DAILY" },
      { name: "Dapper", slug: "dapper", version: "2.1", description: "Micro-ORM", tier: "DAILY" },
      { name: "REST", slug: "rest", version: "-", description: "API design", tier: "DAILY" },
      { name: "gRPC", slug: "grpc", version: "2.6x", description: "RPC framework", tier: "PROD" },
      { name: "SignalR", slug: "signalr", version: "9.0", description: "Realtime transport", tier: "PROD" },
      { name: "Microservices", slug: "microservices", version: "-", description: "Architecture pattern", tier: "PROD" },
      { name: "JavaScript", slug: "javascript", version: "ES2024", description: "Client language", tier: "WORKING" },
      { name: "TypeScript", slug: "typescript", version: "5.x", description: "Typed JavaScript", tier: "WORKING" },
      { name: "Python", slug: "python", version: "3.12", description: "Scripting language", tier: "WORKING" },
      { name: "PHP", slug: "php", version: "8.3", description: "Server language", tier: "WORKING" },
      { name: "LINQ", slug: "linq", version: "-", description: "Query language over collections", tier: "DAILY" },
      { name: "Polly", slug: "polly", version: "8.x", description: "Retry and resilience policies", tier: "PROD" },
      { name: "Minimal APIs", slug: "minimal-apis", version: "8.0", description: "Lightweight endpoint style", tier: "PROD" },
      { name: "MediatR", slug: "mediatr", version: "12", description: "In-process request pipeline", tier: "PROD" },
    ],
  },
  {
    fork: "extra",
    repo: "extra/data",
    label: "Data & Messaging",
    packages: [
      { name: "MySQL", slug: "mysql", version: "8.0", description: "Primary relational database", tier: "DAILY" },
      { name: "MariaDB", slug: "mariadb", version: "11.x", description: "MySQL-compatible database", tier: "WORKING" },
      { name: "PostgreSQL", slug: "postgresql", version: "16.x", description: "Relational database", tier: "WORKING" },
      { name: "SQL Server", slug: "sql-server", version: "2022", description: "Managed relational database", tier: "PROD" },
      { name: "MongoDB", slug: "mongodb", version: "7.0", description: "Document database", tier: "WORKING" },
      { name: "Redis", slug: "redis", version: "7.x", description: "Cache and queue", tier: "DAILY" },
      { name: "RabbitMQ", slug: "rabbitmq", version: "3.13", description: "Message broker", tier: "PROD" },
      { name: "Serilog", slug: "serilog", version: "4.x", description: "Structured logging", tier: "PROD" },
      { name: "Query Optimization", slug: "query-optimization", version: "-", description: "Indexing and query plans", tier: "DAILY" },
      { name: "SQL Profiling", slug: "sql-profiling", version: "-", description: "Query plan and timing analysis", tier: "DAILY" },
      { name: "Database Migrations", slug: "database-migrations", version: "-", description: "Versioned schema change", tier: "DAILY" },
      { name: "Redis Streams", slug: "redis-streams", version: "7.x", description: "Append-only event log", tier: "WORKING" },
      { name: "Message Queues", slug: "message-queues", version: "-", description: "Asynchronous delivery patterns", tier: "PROD" },
      { name: "Elasticsearch", slug: "elasticsearch", version: "8.x", description: "Search and log indexing", tier: "WORKING" },
    ],
  },
  {
    fork: "extra",
    repo: "extra/devops",
    label: "Cloud/DevOps",
    packages: [
      { name: "AWS EC2", slug: "aws-ec2", version: "-", description: "Virtual machines", tier: "PROD" },
      { name: "AWS RDS", slug: "aws-rds", version: "-", description: "Managed databases", tier: "PROD" },
      { name: "AWS S3", slug: "aws-s3", version: "-", description: "Object storage", tier: "PROD" },
      { name: "Docker", slug: "docker", version: "26.x", description: "Containerization", tier: "DAILY" },
      { name: "GitHub Actions", slug: "github-actions", version: "-", description: "CI automation", tier: "DAILY" },
      { name: "CI/CD", slug: "ci-cd", version: "-", description: "Delivery pipeline", tier: "DAILY" },
      { name: "Nginx", slug: "nginx", version: "1.26", description: "Reverse proxy", tier: "DAILY" },
      { name: "Let's Encrypt", slug: "lets-encrypt", version: "-", description: "Free TLS certificates", tier: "PROD" },
      { name: "Linux (Ubuntu)", slug: "linux-ubuntu", version: "22.04", description: "Server operating system", tier: "DAILY" },
      { name: "Bash", slug: "bash", version: "5.2", description: "Shell scripting", tier: "DAILY" },
      { name: "PowerShell", slug: "powershell", version: "7.4", description: "Windows automation", tier: "PROD" },
      { name: "Terraform", slug: "terraform", version: "1.9", description: "Infrastructure as code", tier: "WORKING" },
      { name: "Systemd", slug: "systemd", version: "255", description: "Linux service supervision", tier: "DAILY" },
      { name: "AWS Lambda", slug: "aws-lambda", version: "-", description: "Serverless functions", tier: "WORKING" },
      { name: "Cloudflare", slug: "cloudflare", version: "-", description: "DNS and edge delivery", tier: "WORKING" },
      { name: "Portainer", slug: "portainer", version: "2.x", description: "Container management UI", tier: "WORKING" },
    ],
  },
  {
    fork: "extra",
    repo: "extra/security",
    label: "Security & Auth",
    packages: [
      { name: "JWT", slug: "jwt", version: "-", description: "Token authentication", tier: "PROD" },
      { name: "OAuth 2.0", slug: "oauth2", version: "2.0", description: "Authorization framework", tier: "PROD" },
      { name: "OIDC", slug: "oidc", version: "1.0", description: "Identity layer", tier: "PROD" },
      { name: "RBAC", slug: "rbac", version: "-", description: "Role-based access", tier: "PROD" },
      { name: "ABAC", slug: "abac", version: "-", description: "Attribute-based access", tier: "PROD" },
      { name: "Snyk", slug: "snyk", version: "-", description: "Dependency scanning", tier: "PROD" },
      { name: "OWASP Top 10", slug: "owasp-top10", version: "2021", description: "AppSec checklist", tier: "PROD" },
      { name: "SSL/TLS", slug: "ssl-tls", version: "1.3", description: "Transport security", tier: "PROD" },
      { name: "CORS", slug: "cors", version: "-", description: "Cross-origin policy", tier: "PROD" },
      { name: "Rate Limiting", slug: "rate-limiting", version: "-", description: "Abuse and load control", tier: "PROD" },
      { name: "Security Headers", slug: "security-headers", version: "-", description: "Browser hardening policy", tier: "PROD" },
      { name: "Secrets Management", slug: "secrets-management", version: "-", description: "Credential handling practice", tier: "PROD" },
    ],
  },
  {
    fork: "community",
    repo: "community/ai",
    label: "AI-Assisted Development",
    packages: [
      { name: "OpenCode", slug: "opencode", version: "-", description: "Command-line coding agent", tier: "DAILY" },
      { name: "Codex", slug: "codex", version: "-", description: "Coding agent", tier: "DAILY" },
      { name: "LM Studio", slug: "lm-studio", version: "0.3", description: "Local chat GUI", tier: "DAILY" },
      { name: "Qwen 3.8 (35B, A3B)", slug: "qwen-3.8-35b-a3b", version: "-", description: "Open-weights model", tier: "WORKING" },
      { name: "DeepSeek V4 Flash (9B, MTP)", slug: "deepseek-v4-flash-9b-mtp", version: "-", description: "Reasoning model", tier: "DAILY" },
      { name: "Gemma 4 (26B, A4B)", slug: "gemma-4-26b-a4b", version: "-", description: "Open-weights model", tier: "WORKING" },
      { name: "Local LLM Workflows", slug: "local-llm-workflows", version: "-", description: "Local model workflows", tier: "DAILY" },
      { name: "Prompt Engineering", slug: "prompt-engineering", version: "-", description: "LLM ergonomics", tier: "DAILY" },
      { name: "Code Generation", slug: "code-generation", version: "-", description: "Assisted code generation", tier: "DAILY" },
      { name: "Refactoring", slug: "refactoring", version: "-", description: "Assisted refactoring", tier: "DAILY" },
      { name: "Investigative Coding", slug: "investigative-coding", version: "-", description: "Investigative development", tier: "DAILY" },
      { name: "Developer Productivity", slug: "developer-productivity", version: "-", description: "Development workflow support", tier: "DAILY" },
      { name: "Model Context Protocol", slug: "model-context-protocol", version: "-", description: "Tool-server integration", tier: "DAILY" },
      { name: "Agent Skills", slug: "agent-skills", version: "-", description: "Reusable agent workflows", tier: "DAILY" },
      { name: "Spec-Driven Development", slug: "spec-driven-development", version: "-", description: "Plan-first assisted builds", tier: "DAILY" },
      { name: "Prompt Libraries", slug: "prompt-libraries", version: "-", description: "Reusable prompt sets", tier: "DAILY" },
    ],
  },
  {
    fork: "community",
    repo: "community/tooling",
    label: "Testing & Tools",
    packages: [
      { name: "xUnit", slug: "xunit", version: "2.9", description: "Unit testing", tier: "PROD" },
      { name: "Moq", slug: "moq", version: "4.20", description: "Mocking library", tier: "PROD" },
      { name: "Git", slug: "git", version: "2.44", description: "Version control", tier: "DAILY" },
      { name: "GitHub", slug: "github", version: "-", description: "Code hosting", tier: "DAILY" },
      { name: "Postman", slug: "postman", version: "11", description: "API testing", tier: "DAILY" },
      { name: "Swagger/OpenAPI", slug: "swagger", version: "3.0", description: "API documentation", tier: "PROD" },
      { name: "Code Review", slug: "code-review", version: "-", description: "Peer review", tier: "DAILY" },
      { name: "Runbooks", slug: "runbooks", version: "-", description: "Operations playbooks", tier: "PROD" },
      { name: "Vitest", slug: "vitest", version: "2.x", description: "Unit and component tests", tier: "WORKING" },
      { name: "Zod", slug: "zod", version: "4.x", description: "Runtime schema validation", tier: "WORKING" },
      { name: "ESLint", slug: "eslint", version: "9.x", description: "Static analysis", tier: "DAILY" },
      { name: "Prettier", slug: "prettier", version: "3.x", description: "Code formatting", tier: "DAILY" },
      { name: "Testcontainers", slug: "testcontainers", version: "3.x", description: "Throwaway test dependencies", tier: "WORKING" },
    ],
  },
];

const groupCountWord =
  countWords(repos.length).charAt(0).toUpperCase() +
  countWords(repos.length).slice(1);

/** Route lede: reading order and what each package carries - never a
    restatement of the title. */
export const skillsLede = `${groupCountWord} groups, ordered by how often I reach for them — every package with its version and its tier in words.`;

/** Group size note: the count in words. The reading order already lives in
    the route lede and the group's rank, so it is not repeated here. */
export function groupSizeNote(count: number): string {
  return `${countWords(count)} packages`;
}

/* Dormant zod models wired in: validate a domain projection (tier → level,
   mirroring the historical 90/80/70 skill-bar legend) at module load. */
const TIER_LEVEL: Record<Tier, number> = {
  DAILY: 95,
  PROD: 85,
  WORKING: 75,
};

const skillsProjection = repos.map((repo) => ({
  category: repo.label,
  skills: repo.packages.map((pkg) => ({
    name: pkg.name,
    level: TIER_LEVEL[pkg.tier],
  })),
}));

const skillsValidation = SkillCategorySchema.array().safeParse(
  skillsProjection,
);
if (!skillsValidation.success) {
  throw new Error(
    "content/skills.ts: Skill data failed schema validation: " +
      skillsValidation.error.issues.map((issue) => issue.message).join("; "),
  );
}
