import { motion } from "framer-motion";
import { useState } from "react";

const projects = [
  {
    id: "01",
    name: "PAYMENT GATEWAY API OPTIMIZATION",
    description: "98% latency reduction on a payment processing API by migrating from MySql.Data to MySqlConnector in AWS production.",
    tech: ["C#", "ASP.NET CORE", "EF CORE", "AWS", "MYSQL"],
    status: "PRODUCTION",
    color: "#00ff41",
    stats: [
      { label: "improvement", value: "98%", color: "#00ff41" },
      { label: "latency", value: "60s→1s", color: "#00ff41" },
      { label: "uptime", value: "99.9%", color: "#00ff41" },
    ],
  },
  {
    id: "02",
    name: "IDENTITY & ACCESS MANAGEMENT",
    description: "Authentication microservice with OAuth 2.0, OpenID Connect, and JWT — zero high/critical Snyk vulnerabilities at deployment.",
    tech: ["C#", "OAUTH 2.0", "JWT", "OPENID", "SNYK"],
    status: "PRODUCTION",
    color: "#00d4ff",
    stats: [
      { label: "vulns", value: "0 CRIT", color: "#00d4ff" },
      { label: "auth flows", value: "3", color: "#00d4ff" },
      { label: "coverage", value: "100%", color: "#00d4ff" },
    ],
  },
  {
    id: "03",
    name: "MICROSERVICES PLATFORM",
    description: "Monolith-to-microservices migration using Repository pattern and DI for independent scaling and reduced deployment coupling.",
    tech: ["ASP.NET CORE", "DOCKER", "POSTGRES", "CI/CD"],
    status: "PRODUCTION",
    color: "#ff3e00",
    stats: [
      { label: "services", value: "6", color: "#ff3e00" },
      { label: "coupling", value: "-40%", color: "#ff3e00" },
      { label: "deploys", value: "3× FASTER", color: "#ff3e00" },
    ],
  },
  {
    id: "04",
    name: "DEVEX & API STANDARDS",
    description: "Swagger/OpenAPI standards and Postman collections that reduced integration friction across QA and frontend teams.",
    tech: ["SWAGGER", "OPENAPI", "POSTMAN", "REST"],
    status: "SHIPPED",
    color: "#7b61ff",
    stats: [
      { label: "teams", value: "3", color: "#7b61ff" },
      { label: "friction", value: "-60%", color: "#7b61ff" },
      { label: "endpoints", value: "100+", color: "#7b61ff" },
    ],
  },
];

export function Projects() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section id="projects" className="py-24 md:py-32 px-4 lg:px-8 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-12"
        >
          <span className="text-accent-4 text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            ls projects/
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {projects.map((project, i) => {
            const isHovered = hoveredId === project.id;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                onMouseEnter={() => setHoveredId(project.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(project.id)}
                onBlur={() => setHoveredId(null)}
                className="group relative border border-border hover:border-border-accent transition-all duration-500"
              >
                <div
                  className="h-[2px] w-full transition-opacity duration-500"
                  style={{
                    backgroundColor: project.color,
                    opacity: isHovered ? 1 : 0.5,
                  }}
                />

                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] text-text-muted tabular-nums">
                          {project.id}
                        </span>
                        <span
                          className="text-[10px] tracking-widest px-2 py-0.5"
                          style={{
                            color: project.color,
                            border: `1px solid ${project.color}44`,
                            backgroundColor: `${project.color}0d`,
                          }}
                        >
                          {project.status}
                        </span>
                      </div>
                      <h3
                        className="text-lg md:text-xl font-bold tracking-tight transition-colors duration-300"
                        style={{
                          color: isHovered ? project.color : "#e0e0e0",
                        }}
                      >
                        {project.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-text-dim leading-relaxed mb-6">
                    {project.description}
                  </p>

                  <div className="flex items-center gap-6 mb-6">
                    {project.stats.map((stat) => (
                      <div key={stat.label}>
                        <p className="text-[9px] tracking-widest text-text-muted mb-0.5 uppercase">
                          {stat.label}
                        </p>
                        <p
                          className="text-lg font-bold tabular-nums transition-colors duration-300"
                          style={{
                            color: isHovered ? stat.color : "#666666",
                          }}
                        >
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] tracking-wider px-2 py-1 border border-border text-text-dim hover:bg-white/5 transition-all duration-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <a
                    href="#footprint"
                    className="mt-6 flex items-center gap-2 text-text-dim hover:text-accent transition-colors duration-300 text-xs tracking-widest"
                  >
                    <span>FOOTPRINT</span>
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                    >
                      ❯
                    </motion.span>
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
