import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { TerminalWindow } from "./TerminalWindow";
import { repos, TIER_STYLES, type RepoGroup, type Tier } from "../content/skills";

type CapabilityId = "api" | "data" | "delivery" | "security" | "ai" | "tooling";
type UnitAccent = "accent" | "accent-2" | "accent-3" | "accent-4";

interface CapabilityUnit {
  id: CapabilityId;
  name: string;
  repo: RepoGroup;
  role: string;
  accent: UnitAccent;
}

const capabilityUnits: CapabilityUnit[] = [
  {
    id: "api",
    name: "API",
    repo: repos[0],
    role: "Service contracts, transports, and backend runtime.",
    accent: "accent",
  },
  {
    id: "data",
    name: "data",
    repo: repos[1],
    role: "Persistence, caching, messaging, and query performance.",
    accent: "accent-2",
  },
  {
    id: "delivery",
    name: "delivery",
    repo: repos[2],
    role: "Cloud infrastructure, containers, and release automation.",
    accent: "accent-3",
  },
  {
    id: "security",
    name: "security",
    repo: repos[3],
    role: "Identity, access policy, dependency safety, and transport security.",
    accent: "accent-4",
  },
  {
    id: "ai",
    name: "AI",
    repo: repos[4],
    role: "AI-assisted development and local open-weight model workflows.",
    accent: "accent",
  },
  {
    id: "tooling",
    name: "tooling",
    repo: repos[5],
    role: "Testing, documentation, version control, and operational review.",
    accent: "accent-2",
  },
];

const UNIT_ACCENTS: Record<
  UnitAccent,
  { text: string; border: string; background: string }
> = {
  accent: {
    text: "text-accent",
    border: "border-l-accent",
    background: "bg-accent/5",
  },
  "accent-2": {
    text: "text-accent-2",
    border: "border-l-accent-2",
    background: "bg-accent-2/5",
  },
  "accent-3": {
    text: "text-accent-3",
    border: "border-l-accent-3",
    background: "bg-accent-3/5",
  },
  "accent-4": {
    text: "text-accent-4",
    border: "border-l-accent-4",
    background: "bg-accent-4/5",
  },
};

export function Skills() {
  const [selectedId, setSelectedId] = useState<CapabilityId>("api");
  const totalPackages = repos.reduce(
    (sum, repo) => sum + repo.packages.length,
    0,
  );
  const unitViews = capabilityUnits.map((unit) => {
    const counts = {
      DAILY: unit.repo.packages.filter(({ tier }) => tier === "DAILY").length,
      PROD: unit.repo.packages.filter(({ tier }) => tier === "PROD").length,
      WORKING: unit.repo.packages.filter(({ tier }) => tier === "WORKING")
        .length,
    } satisfies Record<Tier, number>;
    const status =
      counts.DAILY > 0 ? "RUNNING" : counts.PROD > 0 ? "PROD" : "WORKING";
    const statusColor =
      status === "RUNNING"
        ? TIER_STYLES.DAILY.color
        : status === "PROD"
          ? TIER_STYLES.PROD.color
          : TIER_STYLES.WORKING.color;

    return {
      unit,
      counts,
      status,
      statusColor,
      tierSummary: `${counts.DAILY}D / ${counts.PROD}P / ${counts.WORKING}W`,
      load: `${unit.repo.packages.length} pkgs / ${counts.DAILY} daily`,
    };
  });
  const selectedView =
    unitViews.find(({ unit }) => unit.id === selectedId) ?? unitViews[0];

  if (!selectedView) return null;

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
          className="flex items-center gap-4 mb-8 md:mb-10"
        >
          <span className="text-accent-3 text-sm">$</span>
          <span className="text-xs tracking-[0.25em] text-text-dim">
            systemctl --type=service --state=running
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <TerminalWindow title="capability-control-room">
          <div className="flex flex-wrap gap-x-5 gap-y-1 px-4 md:px-6 py-2 border-b border-border-accent bg-bg text-[10px] tracking-widest text-text-dim">
            <span>
              <span className="text-accent font-bold">{totalPackages}</span>{" "}
              package records
            </span>
            <span>
              <span className="text-accent-2 font-bold">
                {capabilityUnits.length}
              </span>{" "}
              running units
            </span>
            <span>
              selected{" "}
              <span className="text-text">{selectedView.unit.name}</span>
            </span>
          </div>

          <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)]">
            <section
              aria-labelledby="skills-board-heading"
              className="min-w-0 bg-bg p-4 md:p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h2
                    id="skills-board-heading"
                    className="text-[10px] tracking-[0.3em] text-accent-3 font-bold uppercase"
                  >
                    process board
                  </h2>
                  <p className="mt-1 text-[10px] leading-relaxed text-text-muted">
                    select a unit to inspect its package records
                  </p>
                </div>
                <span className="shrink-0 text-[10px] tracking-widest text-text-muted">
                  {capabilityUnits.length} services
                </span>
              </div>

              <div
                role="group"
                aria-label="Capability units"
                className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-px bg-border-accent border border-border-accent"
              >
                {unitViews.map((view, index) => {
                  const tone = UNIT_ACCENTS[view.unit.accent];
                  const selected = view.unit.id === selectedId;
                  return (
                    <motion.button
                      key={view.unit.id}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.035,
                        duration: 0.24,
                      }}
                      aria-label={`Inspect ${view.unit.name} capability unit`}
                      aria-pressed={selected}
                      aria-controls="skills-inspector"
                      onClick={() => setSelectedId(view.unit.id)}
                      className={cn(
                        "group min-w-0 w-full text-left border-l-2 bg-bg px-4 py-4 transition-colors duration-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent focus-visible:outline-offset-[-2px]",
                        selected
                          ? cn(tone.border, tone.background)
                          : "border-l-transparent hover:bg-surface hover:border-l-border-accent",
                      )}
                    >
                      <span className="flex min-w-0 items-start justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 text-[10px] tabular-nums text-text-muted">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={cn(
                              "truncate text-sm font-bold tracking-tight",
                              tone.text,
                            )}
                          >
                            {view.unit.name}
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className={cn(
                            "shrink-0 text-[10px] tracking-widest",
                            selected ? tone.text : "text-text-muted",
                          )}
                        >
                          {selected ? "[selected]" : "[inspect]"}
                        </span>
                      </span>
                      <span className="mt-1 block min-w-0 break-words text-[10px] text-text-muted">
                        {view.unit.repo.repo}
                      </span>
                      <span className="mt-3 grid min-w-0 grid-cols-3 gap-2 border-t border-border pt-3">
                        <span className="min-w-0">
                          <span className="block text-[10px] tracking-widest text-text-muted uppercase">
                            status
                          </span>
                          <span
                            className={cn(
                              "block break-words text-[10px] font-bold",
                              view.statusColor,
                            )}
                          >
                            {view.status}
                          </span>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[10px] tracking-widest text-text-muted uppercase">
                            tier mix
                          </span>
                          <span className="block break-words text-[10px] text-text-dim tabular-nums">
                            {view.tierSummary}
                          </span>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[10px] tracking-widest text-text-muted uppercase">
                            load
                          </span>
                          <span className="block break-words text-[10px] text-text-dim tabular-nums">
                            {view.load}
                          </span>
                        </span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </section>

            <section
              id="skills-inspector"
              aria-labelledby="skills-inspector-heading"
              aria-live="polite"
              className="min-w-0 border-t border-border-accent bg-bg p-4 md:p-6 lg:border-l lg:border-t-0"
            >
              <div className="mb-4 flex items-center gap-2 text-[10px] text-text-dim">
                <span className="text-accent">$</span>
                <span className="min-w-0 break-words">
                  systemctl status {selectedView.unit.id}.service
                </span>
              </div>

              <motion.div
                key={selectedView.unit.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <div className="border border-border-accent bg-surface p-4 md:p-5">
                  <div className="flex min-w-0 items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] tracking-widest text-text-muted uppercase">
                        selected capability unit
                      </p>
                      <h3
                        id="skills-inspector-heading"
                        className={cn(
                          "mt-1 break-words text-lg font-bold tracking-tight",
                          UNIT_ACCENTS[selectedView.unit.accent].text,
                        )}
                      >
                        {selectedView.unit.name}
                      </h3>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-[10px] tracking-widest font-bold",
                        selectedView.statusColor,
                      )}
                    >
                      [{selectedView.status}]
                    </span>
                  </div>
                  <p className="mt-3 break-words text-xs leading-relaxed text-text-dim">
                    {selectedView.unit.role}
                  </p>

                  <dl className="mt-5 grid min-w-0 grid-cols-3 gap-2 border-t border-border pt-4">
                    <div className="min-w-0">
                      <dt className="text-[10px] tracking-widest text-text-muted uppercase">
                        status
                      </dt>
                      <dd
                        className={cn(
                          "mt-1 break-words text-[10px] font-bold",
                          selectedView.statusColor,
                        )}
                      >
                        {selectedView.status}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[10px] tracking-widest text-text-muted uppercase">
                        tier mix
                      </dt>
                      <dd className="mt-1 break-words text-[10px] text-text-dim tabular-nums">
                        {selectedView.tierSummary}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[10px] tracking-widest text-text-muted uppercase">
                        load
                      </dt>
                      <dd className="mt-1 break-words text-[10px] text-text-dim tabular-nums">
                        {selectedView.load}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                    <span className="text-accent-3">
                      [{selectedView.unit.repo.fork}]
                    </span>
                    <span className="break-words text-text-dim">
                      {selectedView.unit.repo.repo}
                    </span>
                    <span className="break-words text-text-muted">
                      / {selectedView.unit.repo.label}
                    </span>
                  </div>
                </div>

                <div className="mt-6 min-w-0">
                  <div className="mb-2 flex min-w-0 items-center gap-2 text-[10px] text-text-dim">
                    <span className="text-accent">$</span>
                    <span className="min-w-0 break-words">
                      ls {selectedView.unit.repo.repo}/
                    </span>
                  </div>

                  <div
                    role="list"
                    aria-label={`${selectedView.unit.name} packages`}
                    className="min-w-0 border border-border-accent"
                  >
                    <div className="hidden grid-cols-[minmax(0,1.1fr)_4rem_minmax(0,1fr)_auto] gap-x-3 border-b border-border-accent px-3 py-2 text-[10px] tracking-widest text-text-muted uppercase md:grid">
                      <span>package</span>
                      <span>version</span>
                      <span>description</span>
                      <span>tier</span>
                    </div>
                    {selectedView.unit.repo.packages.map((row, index) => (
                      <motion.div
                        key={row.slug}
                        role="listitem"
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: index * 0.015,
                          duration: 0.18,
                        }}
                        aria-label={`${row.name}, version ${row.version}, ${row.tier}, ${row.description}`}
                        className="grid min-w-0 grid-cols-[minmax(0,1fr)_4rem_auto] items-start gap-x-3 border-b border-border px-3 py-2 last:border-b-0 hover:bg-surface transition-colors duration-200 md:grid-cols-[minmax(0,1.1fr)_4rem_minmax(0,1fr)_auto]"
                      >
                        <span className="min-w-0 break-words">
                          <span className="block break-words text-[11px] text-accent">
                            {row.name}
                          </span>
                          <span className="block break-words text-[10px] leading-relaxed text-text-muted md:hidden">
                            {row.slug} / {row.description}
                          </span>
                        </span>
                        <span className="break-words text-[10px] text-text-dim tabular-nums">
                          {row.version}
                        </span>
                        <span className="hidden min-w-0 break-words text-[10px] leading-relaxed text-text-muted md:block">
                          {row.description}
                        </span>
                        <span
                          className={cn(
                            "break-words text-right text-[10px] tracking-widest font-bold",
                            TIER_STYLES[row.tier].color,
                          )}
                        >
                          [{row.tier}]
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </section>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border-accent bg-bg px-4 py-3 text-[10px] tracking-widest text-text-muted md:px-6">
            {(["DAILY", "PROD", "WORKING"] as Tier[]).map((tier) => (
              <span key={tier} className="min-w-0">
                <span className={cn("font-bold", TIER_STYLES[tier].color)}>
                  [{tier}]
                </span>{" "}
                {TIER_STYLES[tier].note}
              </span>
            ))}
          </div>
        </TerminalWindow>
      </div>
    </section>
  );
}
