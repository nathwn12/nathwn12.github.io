import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { TerminalWindow } from "./TerminalWindow";

type Tier = "DAILY" | "PROD" | "WORKING";

interface PackageInfo {
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

interface RepoGroup {
  /** pacman repo fork, e.g. "core" */
  fork: string;
  /** Full repo tag, e.g. "core/backend" */
  repo: string;
  /** Human-readable category name */
  label: string;
  packages: PackageInfo[];
}

const TIER_STYLES: Record<Tier, { color: string; note: string }> = {
  DAILY: { color: "text-accent", note: "used daily in production work" },
  PROD: { color: "text-accent-2", note: "shipped in production systems" },
  WORKING: {
    color: "text-accent-4",
    note: "competent, not a daily driver",
  },
};

const repos: RepoGroup[] = [
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
        name: "ASP.NET Core",
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
    label: "Cloud & DevOps",
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
        name: "Linux Ubuntu",
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
    label: "AI & Local LLMs",
    packages: [
      {
        name: "GitHub Copilot",
        slug: "github-copilot",
        version: "-",
        description: "pair programmer",
        tier: "DAILY",
      },
      {
        name: "Claude Code",
        slug: "claude-code",
        version: "-",
        description: "agentic coding",
        tier: "DAILY",
      },
      {
        name: "OpenCode",
        slug: "opencode",
        version: "-",
        description: "terminal agent",
        tier: "DAILY",
      },
      {
        name: "ChatGPT",
        slug: "chatgpt",
        version: "-",
        description: "general assistant",
        tier: "DAILY",
      },
      {
        name: "DeepSeek",
        slug: "deepseek",
        version: "r1",
        description: "reasoning model",
        tier: "DAILY",
      },
      {
        name: "Ollama",
        slug: "ollama",
        version: "0.5",
        description: "local model runner",
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
        name: "Llama 3",
        slug: "llama3",
        version: "3.1",
        description: "open-weights model",
        tier: "WORKING",
      },
      {
        name: "Mistral",
        slug: "mistral",
        version: "2",
        description: "open-weights model",
        tier: "WORKING",
      },
      {
        name: "Qwen",
        slug: "qwen",
        version: "2.5",
        description: "open-weights model",
        tier: "WORKING",
      },
      {
        name: "Prompt Engineering",
        slug: "prompt-engineering",
        version: "-",
        description: "llm ergonomics",
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

const marqueeTechs: string[] = [
  "C#",
  "ASP.NET Core",
  "EF Core",
  "Dapper",
  "gRPC",
  "SignalR",
  "REST",
  "MySQL",
  "Redis",
  "RabbitMQ",
  "Serilog",
  "SQL Server",
  "PostgreSQL",
  "MongoDB",
  "MariaDB",
  "AWS EC2",
  "AWS RDS",
  "AWS S3",
  "Docker",
  "GitHub Actions",
  "Nginx",
  "Ubuntu",
  "Bash",
  "PowerShell",
  "JWT",
  "OAuth 2.0",
  "OIDC",
  "RBAC",
  "ABAC",
  "Snyk",
  "OWASP Top 10",
  "SSL/TLS",
  "GitHub Copilot",
  "Claude Code",
  "OpenCode",
  "Ollama",
  "LM Studio",
  "Llama 3",
  "Mistral",
  "Qwen",
  "xUnit",
  "Moq",
  "Git",
  "Postman",
  "Swagger",
];

function PackageRow({ row, index }: { row: PackageInfo; index: number }) {
  const tier = TIER_STYLES[row.tier];
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.28 }}
      className="grid grid-cols-[2rem_minmax(0,1fr)_4rem_auto] md:grid-cols-[2.75rem_11rem_5rem_1fr_5.5rem] gap-x-3 md:gap-x-4 items-baseline px-1 py-1 border-b border-border last:border-b-0 hover:bg-surface transition-colors duration-300"
    >
      <span className="text-[9px] tracking-widest text-text-muted">ii</span>
      <span className="text-xs text-accent truncate min-w-0" title={row.name}>
        {row.slug}
      </span>
      <span className="text-xs text-text-dim tabular-nums">{row.version}</span>
      <span className="hidden md:block text-[11px] text-text-muted truncate min-w-0">
        {row.description}
      </span>
      <span
        className={cn(
          "text-[9px] tracking-widest font-bold text-right",
          tier.color,
        )}
      >
        [{row.tier}]
      </span>
    </motion.div>
  );
}

export function Skills() {
  const totalPackages = repos.reduce(
    (sum, repo) => sum + repo.packages.length,
    0,
  );

  return (
    <section
      id="skills"
      className="py-8 md:py-12 px-4 lg:px-8 relative overflow-hidden"
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-4 mb-12"
        >
          <span className="text-accent-3 text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            pacman -Qqe
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <TerminalWindow title="installed-packages">
          {/* pacman -Qqe output meta */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 md:px-6 py-2 border-b border-border-accent bg-bg text-[10px] tracking-widest text-text-dim">
            <span>
              <span className="text-accent font-bold">{totalPackages}</span>{" "}
              packages
            </span>
            <span>
              <span className="text-accent-2 font-bold">{repos.length}</span>{" "}
              repos
            </span>
            <span>
              last sync <span className="text-text">2026-05</span>
            </span>
          </div>

          {/* Repo blocks — each category is one pacman repository */}
          <div className="bg-bg">
            {repos.map((repo, repoIdx) => {
              const rowBase = repos
                .slice(0, repoIdx)
                .reduce((sum, r) => sum + r.packages.length, 0);
              return (
                <motion.div
                  key={repo.repo}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: repoIdx * 0.06, duration: 0.35 }}
                  className={cn(
                    "px-4 md:px-6 py-5",
                    repoIdx !== repos.length - 1 && "border-b border-border",
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] text-accent-3 shrink-0">
                      ◆
                    </span>
                    <span className="text-[10px] tracking-[0.3em] text-accent-3 font-bold">
                      [{repo.fork}]
                    </span>
                    <span className="text-[10px] tracking-[0.2em] text-text-dim">
                      {repo.label}
                    </span>
                    <div className="flex-1 h-[1px] bg-border" />
                  </div>

                  {/* Column labels — dpkg -l style, desktop only */}
                  <div className="hidden md:grid grid-cols-[2.75rem_11rem_5rem_1fr_5.5rem] gap-x-4 px-1 pb-2 text-[9px] tracking-widest text-text-muted uppercase">
                    <span>status</span>
                    <span>package</span>
                    <span>version</span>
                    <span>description</span>
                    <span>flag</span>
                  </div>

                  {repo.packages.map((row, i) => (
                    <PackageRow key={row.slug} row={row} index={rowBase + i} />
                  ))}
                </motion.div>
              );
            })}
          </div>

          {/* Usage-tier legend — flags, not scores */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 md:px-6 py-3 border-t border-border-accent bg-bg text-[9px] tracking-widest text-text-muted">
            {(["DAILY", "PROD", "WORKING"] as Tier[]).map((tier) => (
              <span key={tier}>
                <span className={cn("font-bold", TIER_STYLES[tier].color)}>
                  [{tier}]
                </span>{" "}
                {TIER_STYLES[tier].note}
              </span>
            ))}
          </div>
        </TerminalWindow>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="mt-6 overflow-hidden border-y border-border py-4 marquee-wrap"
        >
          <div className="flex whitespace-nowrap marquee-track text-[9px] tracking-widest text-text-muted">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                aria-hidden={i === 1}
                className="flex items-center gap-3 px-4"
              >
                {marqueeTechs.map((tech) => (
                  <span
                    key={`${i}-${tech}`}
                    className="hover:text-accent transition-colors duration-300 cursor-pointer"
                  >
                    {tech}
                    <span className="text-border mx-2 pointer-events-none">
                      ◆
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
