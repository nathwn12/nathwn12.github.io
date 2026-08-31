import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "../lib/cn";
import { RouteLink } from "../lib/router";
import { TerminalWindow } from "./TerminalWindow";
import { projects, type Token } from "../content/projects";

type ProjectId = string & { readonly __brand: "Project" };

const textClass: Record<Token, string> = {
  accent: "text-accent",
  "accent-2": "text-accent-2",
  "accent-3": "text-accent-3",
  "accent-4": "text-accent-4",
};

const badgeClass: Record<Token, string> = {
  accent: "text-accent border-accent/30 bg-accent/5",
  "accent-2": "text-accent-2 border-accent-2/30 bg-accent-2/5",
  "accent-3": "text-accent-3 border-accent-3/30 bg-accent-3/5",
  "accent-4": "text-accent-4 border-accent-4/30 bg-accent-4/5",
};

const extMap: Record<string, string> = {
  "C#": ".cs",
  MySqlConnector: ".mysql",
  AWS: ".aws",
  "SQL tuning": ".sql",
  "ASP.NET Web APIs": ".csproj",
  gRPC: ".proto",
  SignalR: ".hub",
  RabbitMQ: ".mq",
  Serilog: ".log",
  JWT: ".jwt",
  "OAuth 2.0": ".oauth",
  "OpenID Connect": ".oid",
  RBAC: ".rbac",
  ABAC: ".abac",
  Snyk: ".snyk",
  "EF Core": ".ef",
  Dapper: ".dapper",
  SQL: ".sql",
  Redis: ".redis",
};

export default function Projects() {
  const [selectedId, setSelectedId] = useState<ProjectId | null>(
    "01" as ProjectId,
  );
  const [cdAnim, setCdAnim] = useState(false);

  useEffect(() => {
    setCdAnim(true);
    const t = setTimeout(() => setCdAnim(false), 500);
    return () => clearTimeout(t);
  }, []);

  const selected = projects.find((p) => p.id === selectedId);

  function handleSelect(id: ProjectId) {
    if (selectedId === id) {
      setSelectedId(null);
      return;
    }
    setCdAnim(true);
    setSelectedId(id);
    setTimeout(() => setCdAnim(false), 400);
  }

  return (
    <section
      id="projects"
      className="py-8 md:py-12 px-4 lg:px-8 relative overflow-hidden"
    >
      <div
        className="section-ambient"
        style={{
          background: `
            radial-gradient(ellipse at 70% 40%, color-mix(in srgb, var(--color-accent-4) 8%, transparent) 0%, color-mix(in srgb, var(--color-accent-4) 2%, transparent) 40%, transparent 65%),
            radial-gradient(ellipse at 30% 70%, color-mix(in srgb, var(--color-accent) 3%, transparent) 0%, transparent 50%)
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
          <span className="text-accent-4 text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            ls -la projects/
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <TerminalWindow title="projects/">
          <p className="px-4 mb-3 text-[10px] font-mono text-text-muted">
            # delivered @ Xentra Infotech Solutions Inc. 2023–2026
          </p>

          {/* ls -la header row */}
          <div className="hidden md:flex items-center gap-4 px-4 py-2 text-[10px] tracking-widest text-text-muted border border-border bg-bg mb-px">
            <span className="w-28">permissions</span>
            <span className="w-8 text-right">links</span>
            <span className="w-20">owner</span>
            <span className="w-16 text-right">size</span>
            <span className="w-24">date</span>
            <span className="flex-1">name</span>
          </div>

          {/* Directory listing */}
          <div className="hidden md:grid gap-px bg-border-accent border border-border-accent mb-6">
            {/* Parent directory */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSelectedId(null);
              }}
              className="flex items-center gap-4 px-4 py-3 bg-bg hover:bg-accent/5 transition-colors duration-300 cursor-pointer"
            >
              <span className="w-28 text-[10px] font-mono text-text-dim">
                drwxr-xr-x
              </span>
              <span className="w-8 text-right text-[10px] text-text-muted">
                2
              </span>
              <span className="w-20 text-[10px] text-text-muted">nathan</span>
              <span className="w-16 text-right text-[10px] text-text-muted">
                4.0K
              </span>
              <span className="w-24 text-[10px] text-text-muted">
                May 28 2026
              </span>
              <span className="flex-1 text-[10px] font-mono text-accent-2">
                ../
              </span>
            </div>

            {projects.map((project) => (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(project.id as ProjectId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSelect(project.id as ProjectId);
                }}
                className={`flex items-center gap-4 px-4 py-3 bg-bg hover:bg-accent/5 transition-all duration-300 cursor-pointer ${
                  selectedId === project.id
                    ? "bg-accent/5 border-l-2 border-accent"
                    : ""
                }`}
              >
                <span className="w-28 text-[10px] font-mono text-text-dim">
                  drwxr-xr-x
                </span>
                <span className="w-8 text-right text-[10px] text-text-muted">
                  2
                </span>
                <span className="w-20 text-[10px] text-text-muted">nathan</span>
                <span className="w-16 text-right text-[10px] text-text-muted">
                  4.0K
                </span>
                <span className="w-24 text-[10px] text-text-muted">
                  May 28 2026
                </span>
                <span
                  className={cn(
                    "flex-1 text-[11px] font-mono hover:text-accent transition-colors",
                    textClass[project.token],
                  )}
                >
                  {project.dir}/
                  <span className="text-[10px] text-text-muted ml-1">
                    {project.tech
                      .map((t) => extMap[t])
                      .filter((v): v is string => v !== undefined)
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .join(" ")}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* Mobile: card view */}
          <div className="md:hidden grid gap-4 mb-6">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.08,
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onClick={() => handleSelect(project.id as ProjectId)}
                className={`group relative border transition-all duration-500 p-4 ${
                  selectedId === project.id
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-border-accent"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] text-text-muted tabular-nums">
                    {project.id}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] tracking-widest px-2 py-0.5 border",
                      badgeClass[project.token],
                    )}
                  >
                    PRODUCTION
                  </span>
                </div>
                <h3 className="text-sm font-bold tracking-tight text-text">
                  {project.name}
                </h3>
                <p className="text-xs text-text-dim mt-1">
                  {project.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Selected project: cat README.md */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: selected ? 1 : 0,
              height: selected ? "auto" : 0,
            }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {selected && (
              <div className="border border-border-accent bg-bg p-6 md:p-8">
                {cdAnim && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-text-muted mb-4 font-mono"
                  >
                    <span className="text-accent">$</span> cd {selected.dir}/
                  </motion.p>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-accent text-xs">$</span>
                  <span className="text-[10px] text-text-dim">
                    cat README.md
                  </span>
                </div>

                <div className="mb-6">
                  <h3
                    className={cn(
                      "text-lg md:text-xl font-bold tracking-tight mb-2",
                      textClass[selected.token],
                    )}
                  >
                    {selected.name}
                  </h3>
                  <p className="text-sm text-text-dim leading-relaxed">
                    {selected.description}
                  </p>
                </div>

                <div className="flex items-center gap-6 mb-6">
                  {selected.stats.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-[10px] tracking-widest text-text-muted mb-0.5 uppercase">
                        {stat.label}
                      </p>
                      <p
                        className={cn(
                          "text-lg font-bold tabular-nums",
                          textClass[stat.token],
                        )}
                      >
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {selected.tech.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] tracking-wider px-2 py-1 border border-border text-text-dim hover:bg-text/5 hover:border-accent/30 transition-all duration-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <RouteLink
                  href="/footprint"
                  className="flex items-center gap-2 text-text-dim hover:text-accent transition-colors duration-300 text-xs tracking-widest group/link"
                >
                  <span>FOOTPRINT ❯</span>
                </RouteLink>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedId(null)}
                  className="mt-4 text-[10px] tracking-widest text-text-muted hover:text-accent transition-colors"
                >
                  <span className="text-accent">$</span> cd ..
                </motion.button>
              </div>
            )}
          </motion.div>
        </TerminalWindow>
      </div>
    </section>
  );
}
