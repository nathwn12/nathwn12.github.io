import { SkillCategorySchema } from "../types/models";

/**
 * Content module: Skills section data, moved verbatim out of
 * src/components/Skills.tsx. Validated against the (formerly dormant)
 * zod models at module load. Rendered output must stay byte-identical.
 */

export type Tier = "DAILY" | "PROD" | "WORKING";

export interface PackageInfo {
  /** Human-readable name, e.g. "ASP.NET Core" */
  name: string;
  /** Lowercase-hyphenated package slug, e.g. "aspnet-core" */
  slug: string;
  /** Real technology version from the resume-era ecosystem, or "-" when unversioned */
  version: string;
  /** Short dim one-liner */
  description: string;
  tier: Tier;
}

export interface RepoGroup {
  /** pacman repo fork, e.g. "core" */
  fork: string;
  /** Full repo tag, e.g. "core/backend" */
  repo: string;
  /** Human-readable category name */
  label: string;
  packages: PackageInfo[];
}

export const TIER_STYLES: Record<Tier, { color: string; note: string }> = {
  DAILY: { color: "text-accent", note: "used daily in production work" },
  PROD: { color: "text-accent-2", note: "shipped in production systems" },
  WORKING: {
    color: "text-accent-4",
    note: "competent, not a daily driver",
  },
};

export const repos: RepoGroup[] = [
  {
    fork: "core",
    repo: "core/backend",
    label: "Backend & Languages",
    packages: [
      {
        name: "C#",
        slug: "csharp",
        version: "12.0",
        description: "primary language",
        tier: "DAILY",
      },
      {
        name: "ASP.NET",
        slug: "aspnet-core",
        version: "9.0",
        description: "web framework",
        tier: "DAILY",
      },
      {
        name: ".NET 6/7/8/9",
        slug: "dotnet",
        version: "9.0",
        description: "runtime & sdk",
        tier: "DAILY",
      },
      {
        name: "EF Core",
        slug: "ef-core",
        version: "9.0",
        description: "orm / migrations",
        tier: "DAILY",
      },
      {
        name: "Dapper",
        slug: "dapper",
        version: "2.1",
        description: "micro-orm",
        tier: "DAILY",
      },
      {
        name: "REST",
        slug: "rest",
        version: "-",
        description: "api design",
        tier: "DAILY",
      },
      {
        name: "gRPC",
        slug: "grpc",
        version: "2.6x",
        description: "rpc framework",
        tier: "PROD",
      },
      {
        name: "SignalR",
        slug: "signalr",
        version: "9.0",
        description: "realtime transport",
        tier: "PROD",
      },
      {
        name: "Microservices",
        slug: "microservices",
        version: "-",
        description: "architecture pattern",
        tier: "PROD",
      },
      {
        name: "JavaScript",
        slug: "javascript",
        version: "ES2024",
        description: "client language",
        tier: "WORKING",
      },
      {
        name: "TypeScript",
        slug: "typescript",
        version: "5.x",
        description: "typed javascript",
        tier: "WORKING",
      },
      {
        name: "Python",
        slug: "python",
        version: "3.12",
        description: "scripting language",
        tier: "WORKING",
      },
      {
        name: "PHP",
        slug: "php",
        version: "8.3",
        description: "server language",
        tier: "WORKING",
      },
    ],
  },
  {
    fork: "extra",
    repo: "extra/data",
    label: "Data & Messaging",
    packages: [
      {
        name: "MySQL",
        slug: "mysql",
        version: "8.0",
        description: "primary relational db",
        tier: "DAILY",
      },
      {
        name: "MariaDB",
        slug: "mariadb",
        version: "11.x",
        description: "mysql-compatible db",
        tier: "WORKING",
      },
      {
        name: "PostgreSQL",
        slug: "postgresql",
        version: "16.x",
        description: "relational db",
        tier: "WORKING",
      },
      {
        name: "SQL Server",
        slug: "sql-server",
        version: "2022",
        description: "managed relational db",
        tier: "PROD",
      },
      {
        name: "MongoDB",
        slug: "mongodb",
        version: "7.0",
        description: "document db",
        tier: "WORKING",
      },
      {
        name: "Redis",
        slug: "redis",
        version: "7.x",
        description: "cache & queue",
        tier: "DAILY",
      },
      {
        name: "RabbitMQ",
        slug: "rabbitmq",
        version: "3.13",
        description: "message broker",
        tier: "PROD",
      },
      {
        name: "Serilog",
        slug: "serilog",
        version: "4.x",
        description: "structured logging",
        tier: "PROD",
      },
      {
        name: "Query Optimization",
        slug: "query-optimization",
        version: "-",
        description: "indexing & plans",
        tier: "DAILY",
      },
    ],
  },
  {
    fork: "extra",
    repo: "extra/devops",
    label: "Cloud/DevOps",
    packages: [
      {
        name: "AWS EC2",
        slug: "aws-ec2",
        version: "-",
        description: "virtual machines",
        tier: "PROD",
      },
      {
        name: "AWS RDS",
        slug: "aws-rds",
        version: "-",
        description: "managed databases",
        tier: "PROD",
      },
      {
        name: "AWS S3",
        slug: "aws-s3",
        version: "-",
        description: "object storage",
        tier: "PROD",
      },
      {
        name: "Docker",
        slug: "docker",
        version: "26.x",
        description: "containerization",
        tier: "DAILY",
      },
      {
        name: "GitHub Actions",
        slug: "github-actions",
        version: "-",
        description: "ci automation",
        tier: "DAILY",
      },
      {
        name: "CI/CD",
        slug: "ci-cd",
        version: "-",
        description: "delivery pipeline",
        tier: "DAILY",
      },
      {
        name: "Nginx",
        slug: "nginx",
        version: "1.26",
        description: "reverse proxy",
        tier: "DAILY",
      },
      {
        name: "Let's Encrypt",
        slug: "lets-encrypt",
        version: "-",
        description: "free tls certs",
        tier: "PROD",
      },
      {
        name: "Linux (Ubuntu)",
        slug: "linux-ubuntu",
        version: "22.04",
        description: "server os",
        tier: "DAILY",
      },
      {
        name: "Bash",
        slug: "bash",
        version: "5.2",
        description: "shell scripting",
        tier: "DAILY",
      },
      {
        name: "PowerShell",
        slug: "powershell",
        version: "7.4",
        description: "windows automation",
        tier: "PROD",
      },
    ],
  },
  {
    fork: "extra",
    repo: "extra/security",
    label: "Security & Auth",
    packages: [
      {
        name: "JWT",
        slug: "jwt",
        version: "-",
        description: "token authentication",
        tier: "PROD",
      },
      {
        name: "OAuth 2.0",
        slug: "oauth2",
        version: "2.0",
        description: "authorization framework",
        tier: "PROD",
      },
      {
        name: "OIDC",
        slug: "oidc",
        version: "1.0",
        description: "identity layer",
        tier: "PROD",
      },
      {
        name: "RBAC",
        slug: "rbac",
        version: "-",
        description: "role-based access",
        tier: "PROD",
      },
      {
        name: "ABAC",
        slug: "abac",
        version: "-",
        description: "attribute-based access",
        tier: "PROD",
      },
      {
        name: "Snyk",
        slug: "snyk",
        version: "-",
        description: "dependency scanning",
        tier: "PROD",
      },
      {
        name: "OWASP Top 10",
        slug: "owasp-top10",
        version: "2021",
        description: "appsec checklist",
        tier: "PROD",
      },
      {
        name: "SSL/TLS",
        slug: "ssl-tls",
        version: "1.3",
        description: "transport security",
        tier: "PROD",
      },
    ],
  },
  {
    fork: "community",
    repo: "community/ai",
    label: "AI-Assisted Development",
    packages: [
      {
        name: "OpenCode",
        slug: "opencode",
        version: "-",
        description: "terminal agent",
        tier: "DAILY",
      },
      {
        name: "Codex",
        slug: "codex",
        version: "-",
        description: "coding agent",
        tier: "DAILY",
      },
      {
        name: "LM Studio",
        slug: "lm-studio",
        version: "0.3",
        description: "local chat gui",
        tier: "DAILY",
      },
      {
        name: "Qwen 3.8",
        slug: "qwen-3.8",
        version: "-",
        description: "open-weights model",
        tier: "WORKING",
      },
      {
        name: "DeepSeek V4 Flash",
        slug: "deepseek-v4-flash",
        version: "-",
        description: "reasoning model",
        tier: "DAILY",
      },
      {
        name: "Qwen 3.5 (9B, 27B)",
        slug: "qwen-3.5-9b-27b",
        version: "-",
        description: "open-weights model",
        tier: "WORKING",
      },
      {
        name: "Local LLM Workflows",
        slug: "local-llm-workflows",
        version: "-",
        description: "local model workflows",
        tier: "DAILY",
      },
      {
        name: "Prompt Engineering",
        slug: "prompt-engineering",
        version: "-",
        description: "llm ergonomics",
        tier: "DAILY",
      },
      {
        name: "Code Generation",
        slug: "code-generation",
        version: "-",
        description: "assisted code generation",
        tier: "DAILY",
      },
      {
        name: "Refactoring",
        slug: "refactoring",
        version: "-",
        description: "assisted refactoring",
        tier: "DAILY",
      },
      {
        name: "Investigative Coding",
        slug: "investigative-coding",
        version: "-",
        description: "investigative development",
        tier: "DAILY",
      },
      {
        name: "Developer Productivity",
        slug: "developer-productivity",
        version: "-",
        description: "development workflow support",
        tier: "DAILY",
      },
    ],
  },
  {
    fork: "community",
    repo: "community/tooling",
    label: "Testing & Tools",
    packages: [
      {
        name: "xUnit",
        slug: "xunit",
        version: "2.9",
        description: "unit testing",
        tier: "PROD",
      },
      {
        name: "Moq",
        slug: "moq",
        version: "4.20",
        description: "mocking library",
        tier: "PROD",
      },
      {
        name: "Git",
        slug: "git",
        version: "2.44",
        description: "version control",
        tier: "DAILY",
      },
      {
        name: "GitHub",
        slug: "github",
        version: "-",
        description: "code hosting",
        tier: "DAILY",
      },
      {
        name: "Postman",
        slug: "postman",
        version: "11",
        description: "api testing",
        tier: "DAILY",
      },
      {
        name: "Swagger/OpenAPI",
        slug: "swagger",
        version: "3.0",
        description: "api documentation",
        tier: "PROD",
      },
      {
        name: "Code Review",
        slug: "code-review",
        version: "-",
        description: "peer review",
        tier: "DAILY",
      },
      {
        name: "Runbooks",
        slug: "runbooks",
        version: "-",
        description: "ops playbooks",
        tier: "PROD",
      },
    ],
  },
];

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