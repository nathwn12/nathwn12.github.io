import { useState, useEffect } from "react";
import { cn } from "../lib/cn";
import { projects } from "../content/projects";

type ProjectId = string & { readonly __brand: "Project" };

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

/* Tone comes from type, rules, and inversion — never from hue. `accent-2/3/4`
   are aliases of the single accent (DESIGN.md §2.2/§2.3), so the old
   per-token class maps are gone; the listing reads as ink on paper.
   Accent budget (§2.3 — one accent, three places): the header `$` prompt and
   the opened README's title. `--color-border-accent` rules are ink structure
   (§2.2/§6), not accent usages. */
const META = "w-28 shrink-0 text-micro";
const COL_LINKS = "w-8 text-right text-micro";
const COL_OWNER = "w-20 text-micro";
const COL_SIZE = "w-16 text-right text-micro";
const COL_DATE = "w-24 text-micro";

export default function Projects() {
  const [selectedId, setSelectedId] = useState<ProjectId | null>(
    "01" as ProjectId,
  );
  const [showCd, setShowCd] = useState(false);

  useEffect(() => {
    setShowCd(true);
    const t = setTimeout(() => setShowCd(false), 500);
    return () => clearTimeout(t);
  }, []);

  const selected = projects.find((p) => p.id === selectedId);

  function handleSelect(id: ProjectId) {
    if (selectedId === id) {
      setSelectedId(null);
      return;
    }
    setShowCd(true);
    setSelectedId(id);
    setTimeout(() => setShowCd(false), 400);
  }

  return (
    <section id="projects" className="py-block md:py-section px-gutter">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-gutter mb-section">
          <span className="text-accent-text text-body-lg">$</span>
          <span className="text-label text-text-dim">ls -la projects/</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="border-y border-border-accent">
          <p className="px-gutter py-half text-micro font-mono text-text-muted border-b border-border">
            # delivered @ Xentra Infotech Solutions Inc. 2023–2026
          </p>

          {/* ls -la header row */}
          <div className="hidden md:flex items-center gap-gutter px-gutter py-half text-micro uppercase tracking-[0.2em] text-text-muted border-b border-border bg-bg">
            <span className="w-28">permissions</span>
            <span className="w-8 text-right">links</span>
            <span className="w-20">owner</span>
            <span className="w-16 text-right">size</span>
            <span className="w-24">date</span>
            <span className="flex-1">name</span>
          </div>

          {/* Directory listing */}
          <div className="hidden md:grid gap-px bg-border-accent">
            {/* Parent directory */}
            <div
              role="button"
              tabIndex={0}
              data-nav-item
              onClick={() => setSelectedId(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSelectedId(null);
              }}
              className="flex items-center gap-gutter px-gutter py-half bg-bg hover:bg-text/5 active:bg-text/10 transition-colors duration-200 cursor-pointer"
            >
              <span className={cn(META, "font-mono text-text-dim")}>
                drwxr-xr-x
              </span>
              <span className={cn(COL_LINKS, "text-text-muted")}>2</span>
              <span className={cn(COL_OWNER, "text-text-muted")}>nathan</span>
              <span className={cn(COL_SIZE, "text-text-muted")}>4.0K</span>
              <span className={cn(COL_DATE, "text-text-muted")}>
                May 28 2026
              </span>
              <span className="flex-1 text-micro font-mono text-text-dim">
                ../
              </span>
            </div>

            {projects.map((project) => {
              const active = selectedId === project.id;
              const meta = active ? "text-bg/70" : "text-text-dim";
              const muted = active ? "text-bg/70" : "text-text-muted";
              return (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  data-nav-item
                  data-nav-activate
                  onClick={() => handleSelect(project.id as ProjectId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSelect(project.id as ProjectId);
                  }}
                  className={cn(
                    "flex items-center gap-gutter px-gutter py-half transition-colors duration-200 cursor-pointer",
                    active ? "bg-text text-bg" : "bg-bg hover:bg-text/5 active:bg-text/10",
                  )}
                >
                  <span className={cn(META, "font-mono", meta)}>
                    drwxr-xr-x
                  </span>
                  <span className={cn(COL_LINKS, muted)}>2</span>
                  <span className={cn(COL_OWNER, muted)}>nathan</span>
                  <span className={cn(COL_SIZE, muted)}>4.0K</span>
                  <span className={cn(COL_DATE, muted)}>May 28 2026</span>
                  <span
                    className={cn(
                      "flex-1 text-label font-mono font-bold",
                      active ? "text-bg" : "text-text",
                    )}
                  >
                    {project.dir}/
                    <span className={cn("text-micro ml-half", muted)}>
                      {project.tech
                        .map((t) => extMap[t])
                        .filter((v): v is string => v !== undefined)
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .join(" ")}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mobile: the same listing as rules, not a grid of equal cards */}
          <div className="md:hidden">
            {projects.map((project) => {
              const active = selectedId === project.id;
              return (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  data-nav-item
                  data-nav-activate
                  onClick={() => handleSelect(project.id as ProjectId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSelect(project.id as ProjectId);
                  }}
                  className={cn(
                    "border-b border-border px-gutter py-gutter transition-colors duration-200",
                    active ? "bg-surface-2" : "hover:bg-text/5 active:bg-text/10",
                  )}
                >
                  <div className="flex items-center gap-gutter mb-quarter">
                    <span className="text-micro text-text-muted tabular-nums">
                      {project.id}
                    </span>
                    <span className="text-micro uppercase tracking-[0.2em] text-text-muted">
                      PRODUCTION
                    </span>
                    <span className="ml-auto text-micro font-mono text-text-dim">
                      {project.dir}/
                    </span>
                  </div>
                  <h3 className="text-body-lg font-bold text-text">
                    {project.name}
                  </h3>
                  <p className="text-body text-text-dim mt-quarter max-w-[68ch]">
                    {project.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Selected project: cat README.md — instant mount, no layout animation */}
          {selected && (
            <div className="border border-border-accent bg-bg p-gutter md:p-block">
              {showCd && (
                <p className="text-micro font-mono text-text-muted mb-half">
                  <span className="text-text-dim">$</span> cd {selected.dir}/
                </p>
              )}

              <div className="flex items-center gap-half mb-block">
                <span className="text-body text-text-dim">$</span>
                <span className="text-label text-text-dim">cat README.md</span>
              </div>

              <div className="mb-block">
                <h3 className="text-title font-bold mb-half text-accent-text">
                  {selected.name}
                </h3>
                <p className="text-body text-text-dim max-w-[68ch]">
                  {selected.description}
                </p>
              </div>

              <div className="flex items-center gap-block mb-block">
                {selected.stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-micro uppercase tracking-[0.2em] text-text-muted mb-quarter">
                      {stat.label}
                    </p>
                    <p className="text-title font-bold tabular-nums text-text">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-half mb-block">
                {selected.tech.map((t) => (
                  <span
                    key={t}
                    className="text-micro border border-border px-half py-quarter text-text-dim hover:border-border-accent hover:text-text transition-colors duration-200"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setSelectedId(null)}
                className="text-label text-text-muted hover:text-text active:text-text transition-colors duration-200"
              >
                <span className="text-text-dim">$</span> cd ..
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
