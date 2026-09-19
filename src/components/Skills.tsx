import { useState } from "react";
import { cn } from "@/lib/cn";
import { repos, TIER_STYLES, type RepoGroup, type Tier } from "../content/skills";

/**
 * Skills — systemd capability board.
 *
 * Brutalist pass: one flat surface replaces the window-in-window nesting
 * (§9 P1 "Nested cards"); hierarchy now comes from rules, spacing and type
 * steps. Radius 0, no hue coding — `accent-2/3/4` alias the single accent, so
 * per-unit tone is carried by the unit's own name and rule, not by colour
 * (§2.3 consequence). All aria/roles/keyboard behaviour is unchanged.
 *
 * Accent budget (§2.3 — one accent, three places): the header `$` prompt, the
 * inspector's `systemctl status` prompt, and the inspector's `[STATUS]` chip.
 * Everything else is ink or concrete. `TIER_STYLES[].color` is therefore
 * consumed once, at the inspected unit's live status.
 */

type CapabilityId = "api" | "data" | "delivery" | "security" | "ai" | "tooling";

interface CapabilityUnit {
  id: CapabilityId;
  name: string;
  repo: RepoGroup;
  role: string;
}

const capabilityUnits: CapabilityUnit[] = [
  {
    id: "api",
    name: "API",
    repo: repos[0],
    role: "Service contracts, transports, and backend runtime.",
  },
  {
    id: "data",
    name: "data",
    repo: repos[1],
    role: "Persistence, caching, messaging, and query performance.",
  },
  {
    id: "delivery",
    name: "delivery",
    repo: repos[2],
    role: "Cloud infrastructure, containers, and release automation.",
  },
  {
    id: "security",
    name: "security",
    repo: repos[3],
    role: "Identity, access policy, dependency safety, and transport security.",
  },
  {
    id: "ai",
    name: "AI",
    repo: repos[4],
    role: "AI-assisted development and local open-weight model workflows.",
  },
  {
    id: "tooling",
    name: "tooling",
    repo: repos[5],
    role: "Testing, documentation, version control, and operational review.",
  },
];

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
      className="px-gutter py-block md:px-section md:py-section"
    >
      <div className="mx-auto max-w-5xl">
        {/* `prompt: command` section header — product IA, not an eyebrow */}
        <div className="mb-block flex items-center gap-half">
          <span className="text-body text-accent-text">$</span>
          <span className="text-label tracking-[0.15em] text-text-dim">
            systemctl --type=service --state=running
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* One flat surface: the control room. No pane is nested in another. */}
        <div className="border border-border-accent bg-bg">
          <div className="flex flex-wrap items-baseline gap-x-gutter gap-y-quarter border-b border-border-accent px-gutter py-half text-label">
            <span className="uppercase tracking-[0.15em] text-text-muted">
              capability-control-room
            </span>
            <span className="flex-1" />
            <span className="text-text-muted">
              <span className="font-bold tabular-nums text-text">
                {totalPackages}
              </span>{" "}
              package records
            </span>
            <span className="text-text-muted">
              <span className="font-bold tabular-nums text-text">
                {capabilityUnits.length}
              </span>{" "}
              running units
            </span>
            <span className="text-text-muted">
              selected{" "}
              <span className="text-text">{selectedView.unit.name}</span>
            </span>
          </div>

          <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)]">
            <section
              aria-labelledby="skills-board-heading"
              className="min-w-0 p-gutter md:p-block"
            >
              <div className="flex items-start justify-between gap-gutter">
                <div className="min-w-0">
                  <h2
                    id="skills-board-heading"
                    className="text-body-lg font-bold text-text"
                  >
                    process board
                  </h2>
                  <p className="mt-half text-body text-text-muted">
                    select a unit to inspect its package records
                  </p>
                </div>
                <span className="shrink-0 text-label tabular-nums text-text-muted">
                  {capabilityUnits.length} services
                </span>
              </div>

              <div
                role="group"
                aria-label="Capability units"
                className="mt-block grid min-w-0 grid-cols-1 gap-px border-t border-border-accent bg-border sm:grid-cols-2"
              >
                {unitViews.map((view, index) => {
                  const selected = view.unit.id === selectedId;
                  return (
                    <button
                      key={view.unit.id}
                      type="button"
                      aria-label={`Inspect ${view.unit.name} capability unit`}
                      aria-pressed={selected}
                      aria-controls="skills-inspector"
                      onClick={() => setSelectedId(view.unit.id)}
                      className={cn(
                        "w-full min-w-0 border-l-[length:var(--border-width-rule)] px-gutter py-block text-left transition-colors duration-200",
                        selected
                          ? "border-l-border-accent bg-surface"
                          : "border-l-transparent bg-bg hover:bg-surface-2",
                      )}
                    >
                      <span className="flex min-w-0 items-baseline justify-between gap-half">
                        <span className="flex min-w-0 items-baseline gap-half">
                          <span className="shrink-0 text-label tabular-nums text-text-muted">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="truncate text-body-lg font-bold text-text">
                            {view.unit.name}
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className={cn(
                            "shrink-0 text-label",
                            selected ? "text-text" : "text-text-muted",
                          )}
                        >
                          {selected ? "[selected]" : "[inspect]"}
                        </span>
                      </span>
                      <span className="mt-quarter block min-w-0 break-words text-label text-text-muted">
                        {view.unit.repo.repo}
                      </span>
                      <span className="mt-half grid min-w-0 grid-cols-3 gap-half border-t border-border pt-half">
                        <span className="min-w-0">
                          <span className="block text-label uppercase tracking-[0.15em] text-text-muted">
                            status
                          </span>
                          <span className="block break-words text-label font-bold text-text-dim">
                            {view.status}
                          </span>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-label uppercase tracking-[0.15em] text-text-muted">
                            tier mix
                          </span>
                          <span className="block break-words text-label tabular-nums text-text-dim">
                            {view.tierSummary}
                          </span>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-label uppercase tracking-[0.15em] text-text-muted">
                            load
                          </span>
                          <span className="block break-words text-label tabular-nums text-text-dim">
                            {view.load}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section
              id="skills-inspector"
              aria-labelledby="skills-inspector-heading"
              className="min-w-0 border-t border-border-accent p-gutter md:p-block lg:border-l lg:border-t-0"
            >
              {/* The whole inspector used to be a live region, so every unit
                  switch re-announced the status details and the package table.
                  One short line now carries the announcement. */}
              <p aria-live="polite" className="sr-only">
                {selectedView.unit.name}: {selectedView.status}
              </p>
              <div className="flex items-baseline gap-half text-label text-text-dim">
                <span className="text-accent-text">$</span>
                <span className="min-w-0 break-words">
                  systemctl status {selectedView.unit.id}.service
                </span>
              </div>

              <div className="mt-block min-w-0">
                <div className="flex min-w-0 items-start justify-between gap-gutter">
                  <div className="min-w-0">
                    <p className="text-label text-text-muted">
                      selected capability unit
                    </p>
                    <h3
                      id="skills-inspector-heading"
                      className="mt-quarter break-words text-title font-bold text-text"
                    >
                      {selectedView.unit.name}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-label font-bold",
                      selectedView.statusColor,
                    )}
                  >
                    [{selectedView.status}]
                  </span>
                </div>
                <p className="mt-half break-words text-body text-text-dim">
                  {selectedView.unit.role}
                </p>

                <dl className="mt-block grid min-w-0 grid-cols-3 gap-half border-t border-border pt-half">
                  <div className="min-w-0">
                    <dt className="text-label uppercase tracking-[0.15em] text-text-muted">
                      status
                    </dt>
                    <dd className="mt-quarter break-words text-label font-bold text-text-dim">
                      {selectedView.status}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-label uppercase tracking-[0.15em] text-text-muted">
                      tier mix
                    </dt>
                    <dd className="mt-quarter break-words text-label tabular-nums text-text-dim">
                      {selectedView.tierSummary}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-label uppercase tracking-[0.15em] text-text-muted">
                      load
                    </dt>
                    <dd className="mt-quarter break-words text-label tabular-nums text-text-dim">
                      {selectedView.load}
                    </dd>
                  </div>
                </dl>

                <div className="mt-half flex min-w-0 flex-wrap items-baseline gap-x-half gap-y-quarter text-label">
                  <span className="text-text-muted">
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

              <div className="mt-block min-w-0">
                <div className="flex items-baseline gap-half text-label text-text-dim">
                  <span className="text-text-muted">$</span>
                  <span className="min-w-0 break-words">
                    ls {selectedView.unit.repo.repo}/
                  </span>
                </div>

                <div
                  role="list"
                  aria-label={`${selectedView.unit.name} packages`}
                  className="mt-half min-w-0 border-t border-border-accent"
                >
                  <div className="hidden grid-cols-[minmax(0,1.1fr)_4rem_minmax(0,1fr)_auto] gap-x-half border-b border-border px-half py-quarter text-label uppercase tracking-[0.15em] text-text-muted md:grid">
                    <span>package</span>
                    <span>version</span>
                    <span>description</span>
                    <span>tier</span>
                  </div>
                  {selectedView.unit.repo.packages.map((row) => (
                    <div
                      key={row.slug}
                      role="listitem"
                      aria-label={`${row.name}, version ${row.version}, ${row.tier}, ${row.description}`}
                      className="grid min-w-0 grid-cols-[minmax(0,1fr)_4rem_auto] items-start gap-x-half border-b border-border px-half py-half transition-colors duration-200 last:border-b-0 hover:bg-surface-2 md:grid-cols-[minmax(0,1.1fr)_4rem_minmax(0,1fr)_auto]"
                    >
                      <span className="min-w-0 break-words">
                        <span className="block break-words text-body text-text">
                          {row.name}
                        </span>
                        <span className="block break-words text-label text-text-muted md:hidden">
                          {row.slug} / {row.description}
                        </span>
                      </span>
                      <span className="break-words text-label tabular-nums text-text-dim">
                        {row.version}
                      </span>
                      <span className="hidden min-w-0 break-words text-label text-text-muted md:block">
                        {row.description}
                      </span>
                      <span className="break-words text-right text-label font-bold text-text-dim">
                        [{row.tier}]
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="flex flex-wrap gap-x-gutter gap-y-half border-t border-border-accent px-gutter py-half text-label text-text-muted md:px-block">
            {(["DAILY", "PROD", "WORKING"] as Tier[]).map((tier) => (
              <span key={tier} className="min-w-0">
                <span className="font-bold text-text">[{tier}]</span>{" "}
                {TIER_STYLES[tier].note}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
