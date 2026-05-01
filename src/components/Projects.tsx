import { motion } from "framer-motion";

const projects = [
  {
    id: "01",
    name: "PAYMENT GATEWAY API OPTIMIZATION",
    description: "98% latency reduction on a payment processing API by migrating from MySql.Data to MySqlConnector in AWS production.",
    tech: ["C#", "ASP.NET CORE", "EF CORE", "AWS", "MYSQL"],
    status: "PRODUCTION",
    color: "#00ff41",
    stats: { improvement: "98%", latency: "60s→1s", uptime: "99.9%" },
  },
  {
    id: "02",
    name: "IDENTITY & ACCESS MANAGEMENT",
    description: "Authentication microservice with OAuth 2.0, OpenID Connect, and JWT — zero high/critical Snyk vulnerabilities at deployment.",
    tech: ["C#", "OAUTH 2.0", "JWT", "OPENID", "SNYK"],
    status: "PRODUCTION",
    color: "#00d4ff",
    stats: { vulns: "0 CRIT", "auth flows": "3", coverage: "100%" },
  },
  {
    id: "03",
    name: "MICROSERVICES PLATFORM",
    description: "Monolith-to-microservices migration using Repository pattern and DI for independent scaling and reduced deployment coupling.",
    tech: ["ASP.NET CORE", "DOCKER", "POSTGRES", "CI/CD"],
    status: "PRODUCTION",
    color: "#ff3e00",
    stats: { services: "6", coupling: "-40%", deploys: "3× FASTER" },
  },
  {
    id: "04",
    name: "DEVEX & API STANDARDS",
    description: "Swagger/OpenAPI standards and Postman collections that reduced integration friction across QA and frontend teams.",
    tech: ["SWAGGER", "OPENAPI", "POSTMAN", "REST"],
    status: "SHIPPED",
    color: "#7b61ff",
    stats: { teams: "3", friction: "-60%", endpoints: "100+" },
  },
];

export function Projects() {
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
            SECTION 05 // PROJECTS
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-px bg-border-accent border border-border-accent">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
               transition={{ delay: i * 0.08, duration: 0.4 }}
              className="group bg-bg p-6 md:p-8 relative overflow-hidden transition-all duration-500 hover:bg-surface"
            >
              <div
                className="absolute inset-0 border-2 border-transparent group-hover:border-opacity-20 transition-all duration-500 pointer-events-none"
                style={{ borderColor: project.color }}
              />
              <div
                className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 opacity-30 group-hover:opacity-100 transition-opacity duration-500"
                style={{ borderColor: project.color }}
              />

              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] text-text-muted tabular-nums">
                      {project.id}
                    </span>
                    <span
                      className="text-[10px] tracking-widest px-2 py-0.5 border"
                      style={{
                        color: project.color,
                        borderColor: `${project.color}33`,
                        backgroundColor: `${project.color}08`,
                      }}
                    >
                      {project.status}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold tracking-tight text-white group-hover:text-accent transition-colors duration-300">
                    {project.name}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-text-dim leading-relaxed mb-6 line-clamp-3">
                {project.description}
              </p>

              <div className="grid grid-cols-3 gap-px bg-border-accent border border-border-accent mb-6">
                {Object.entries(project.stats).map(([key, value]) => (
                  <div key={key} className="bg-bg px-3 py-2 text-center">
                    <p className="text-[9px] tracking-widest text-text-muted mb-0.5 uppercase">
                      {key}
                    </p>
                    <p className="text-xs font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] tracking-wider px-2 py-1 bg-surface border border-border text-text-dim hover:text-white hover:border-border-accent transition-all duration-300"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2 text-text-muted group-hover:text-accent transition-colors duration-300 text-xs tracking-widest">
                <span>VIEW DETAILS</span>
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  →
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
