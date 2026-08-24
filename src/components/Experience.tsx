import { useState } from "react";
import { motion } from "framer-motion";
import { TerminalWindow } from "./TerminalWindow";

const employer = {
  unit: "career.service",
  role: "Backend Developer",
  company: "Xentra Infotech Solutions Inc.",
  location: "Remote",
  period: "Mar 2023 – May 2026",
};

const logEntries = [
  {
    id: "01",
    unit: "career.service",
    timestamp: "2023-04-11 09:12:05",
    status: "OK",
    summary: "Shipped 1,100+ commits across 17 repositories",
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

export function Experience() {
  const [activeExp, setActiveExp] = useState<number | null>(0);

  return (
    <section
      id="experience"
      className="py-8 md:py-12 px-4 lg:px-8 relative overflow-hidden"
    >
      <div
        className="section-ambient"
        style={{
          background: `
            radial-gradient(ellipse at 80% 50%, color-mix(in srgb, var(--color-accent-2) 8%, transparent) 0%, color-mix(in srgb, var(--color-accent-2) 2%, transparent) 40%, transparent 65%),
            radial-gradient(ellipse at 20% 80%, color-mix(in srgb, var(--color-accent-2) 4%, transparent) 0%, transparent 50%)
          `,
        }}
      />
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-4 mb-12"
        >
          <span className="text-accent text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            journalctl -u career.service --no-pager
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <TerminalWindow title="career.service">
          {/* Service header — single employer era */}
          <div className="px-4 md:px-6 py-3 border-b border-border bg-text/[0.01]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="text-accent font-bold">{employer.unit}</span>
              <span className="text-text font-bold">{employer.role}</span>
              <span className="text-text-dim">{employer.company}</span>
              <span className="text-text-muted">({employer.location})</span>
              <span className="flex-1" />
              <span className="text-text-muted whitespace-nowrap">
                {employer.period}
              </span>
            </div>
          </div>

          <div className="space-y-px">
            {logEntries.map((exp, i) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.08,
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={activeExp === i}
                  className={`group cursor-pointer transition-all duration-500 border border-border hover:border-accent/20 ${
                    activeExp === i
                      ? "bg-accent/[0.02] border-accent/30"
                      : "hover:bg-text/[0.01]"
                  }`}
                  onClick={() =>
                    setActiveExp((prev) => (prev === i ? null : i))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setActiveExp((prev) => (prev === i ? null : i));
                  }}
                >
                  <div className="flex items-center gap-4 md:gap-8 py-5 md:py-6 px-4 md:px-6">
                    <motion.span
                      className={`text-xs font-bold tabular-nums transition-colors duration-300 ${
                        activeExp === i ? "text-accent" : "text-text-dim"
                      }`}
                    >
                      {exp.id}
                    </motion.span>

                    <span className="text-xs font-bold text-accent">[OK]</span>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4">
                        <h3
                          className={`text-sm md:text-base font-bold tracking-tight transition-colors duration-300 ${
                            activeExp === i ? "text-text" : "text-text-dim"
                          }`}
                        >
                          {exp.unit}
                        </h3>
                        <span className="text-[10px] tracking-widest text-text-muted whitespace-nowrap tabular-nums">
                          {exp.timestamp}
                        </span>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 mt-1">
                        <span className="text-xs text-text-dim">
                          {exp.summary}
                        </span>
                      </div>
                    </div>

                    <motion.div
                      animate={{
                        x: activeExp === i ? 4 : 0,
                      }}
                      className={`text-lg transition-colors duration-300 ${
                        activeExp === i ? "text-accent" : "text-text-muted"
                      }`}
                    >
                      {activeExp === i ? "↓" : "→"}
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: activeExp === i ? "auto" : 0,
                      opacity: activeExp === i ? 1 : 0,
                    }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 md:p-6 space-y-4 border-t border-accent/10">
                      <p className="text-sm text-text-dim leading-relaxed max-w-3xl">
                        {exp.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {exp.tech.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] tracking-wider px-2 py-1 border border-border-accent text-text-dim hover:border-accent/30 hover:text-accent transition-colors duration-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="inline-flex items-center gap-2 text-[10px] tracking-widest text-accent mt-2">
                        <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full" />
                        {exp.status}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </TerminalWindow>
      </div>
    </section>
  );
}
