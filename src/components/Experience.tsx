import { useState } from "react";
import { motion } from "framer-motion";

const experiences = [
  {
    id: "01",
    role: "BACKEND DEVELOPER",
    company: "XENTRA INFOTECH SOLUTIONS, INC.",
    period: "Mar 2023 – May 2026",
    location: "PHILIPPINES",
    description:
      "Built and maintained ASP.NET Core Web APIs for fintech platforms, handling full lifecycle from data modeling through deployment and post-release support. Maintained consistent delivery velocity across 17 repositories with 1,182 commits spanning payment processing, cash management, access control, and integrations.",
    tech: ["C#", "ASP.NET CORE", "MYSQL", "AWS", "JWT", "EF CORE"],
    highlight: true,
  },
  {
    id: "02",
    role: "PERFORMANCE OPTIMIZATION",
    company: "PAYMENT GATEWAY API",
    period: "2024 – 2025",
    location: "XENTRA INFOTECH",
    description:
      "Achieved ~98% latency improvement (from 60s+ to under 1s) by migrating database connectivity from MySql.Data to MySqlConnector in AWS-hosted services. Optimized EF Core queries and SQL stored procedures for production workloads.",
    tech: ["C#", "MYSQLCONNECTOR", "EF CORE", "AWS", "SQL"],
    highlight: false,
  },
  {
    id: "03",
    role: "SECURITY & COMPLIANCE",
    company: "IDENTITY & ACCESS MANAGEMENT",
    period: "2023 – 2025",
    location: "XENTRA INFOTECH",
    description:
      "Implemented JWT-based authentication, OAuth 2.0, OpenID Connect, and RBAC/ABAC patterns. Drove Snyk remediation achieving zero high/critical vulnerabilities in production-bound services.",
    tech: ["JWT", "OAUTH 2.0", "OPENID", "SNYK", "RBAC"],
    highlight: false,
  },
  {
    id: "04",
    role: "MICROSERVICES ARCHITECTURE",
    company: "PLATFORM MODERNIZATION",
    period: "2023 – 2025",
    location: "XENTRA INFOTECH",
    description:
      "Designed and implemented modular microservice-based backend components with Repository and Dependency Injection patterns, improving maintainability and integration flow across the product suite.",
    tech: ["ASP.NET CORE", "DOCKER", "POSTGRES", "CI/CD"],
    highlight: false,
  },
];

export function Experience() {
  const [activeExp, setActiveExp] = useState<number | null>(0);

  return (
    <section id="experience" className="py-24 md:py-32 px-4 lg:px-8 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-12"
        >
          <span className="text-accent text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            tail -f experience.log
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <div className="space-y-px">
          {experiences.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
               transition={{ delay: i * 0.08, duration: 0.4 }}
              role="button"
              tabIndex={0}
              aria-expanded={activeExp === i}
              className={`group cursor-pointer transition-all duration-500 ${
                activeExp === i ? "bg-accent/[0.02]" : "hover:bg-white/[0.01]"
              }`}
              onMouseEnter={() => setActiveExp((prev) => prev === i ? null : i)}
              onFocus={() => setActiveExp((prev) => prev === i ? null : i)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveExp((prev) => prev === i ? null : i); }}
            >
              <div className="flex items-center gap-4 md:gap-8 py-5 md:py-6 px-4 md:px-6 border border-border group-hover:border-border-accent transition-colors duration-300">
                <span className={`text-xs font-bold tabular-nums transition-colors duration-300 ${
                  activeExp === i ? "text-accent" : "text-text-muted"
                }`}>
                  {exp.id}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4">
                    <h3 className={`text-sm md:text-base font-bold tracking-tight transition-colors duration-300 ${
                      activeExp === i ? "text-white" : "text-text-dim"
                    }`}>
                      {exp.role}
                    </h3>
                    <span className="text-[10px] tracking-widest text-text-muted whitespace-nowrap">
                      {exp.period}
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 mt-1">
                    <span className={`text-xs transition-colors duration-300 ${
                      activeExp === i ? "text-accent" : "text-text-dim"
                    }`}>
                      {exp.company}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {exp.location}
                    </span>
                  </div>
                </div>

                <motion.div
                  animate={{ x: activeExp === i ? 4 : 0 }}
                  className="text-border-accent group-hover:text-accent/50 transition-colors"
                >
                  →
                </motion.div>
              </div>

              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: activeExp === i ? "auto" : 0,
                  opacity: activeExp === i ? 1 : 0,
                }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden border-x border-b border-border"
              >
                <div className="p-4 md:p-6 space-y-4">
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
                  {exp.highlight && (
                    <div className="inline-flex items-center gap-2 text-[10px] tracking-widest text-accent mt-2">
                      <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                      PRIMARY ROLE
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
