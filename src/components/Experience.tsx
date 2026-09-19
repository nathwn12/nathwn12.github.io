import { useState } from "react";
import { employer, logEntries } from "../content/experience";

/**
 * Experience — `journalctl` log pane.
 *
 * Brutalist pass: one flat surface, ink/paper rules only, named type steps,
 * radius 0, no ambient gradient, no motion (DESIGN.md §4, §5, §6, §10).
 *
 * The active row is marked by the 2px `--border-width-rule` structural rule
 * (ink in light / paper in dark) plus the `↓`/`→` glyph — never by a coloured
 * side stripe (§6, §9 P1 [S2] K4). Inactive rows carry the same 2px width as
 * `transparent`, so the row does not shift when it opens.
 *
 * Accent budget (§2.3 — one accent, three places): the header `$` prompt, the
 * active row's entry id, and the expanded row's status mark.
 */
export function Experience() {
  const [activeExp, setActiveExp] = useState<number | null>(0);

  return (
    <section
      id="experience"
      className="px-gutter py-block md:px-section md:py-section"
    >
      <div className="mx-auto max-w-5xl">
        {/* `prompt: command` section header — product IA, not an eyebrow */}
        <div className="mb-block flex items-center gap-half">
          <span className="text-body text-accent-text">$</span>
          <span className="text-label tracking-[0.15em] text-text-dim">
            journalctl -u career.service --no-pager
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="border border-border-accent bg-bg">
          {/* Service header — single employer era */}
          <div className="flex flex-wrap items-baseline gap-x-gutter gap-y-quarter border-b border-border-accent px-gutter py-half">
            <span className="text-body-lg font-bold text-text">
              {employer.unit}
            </span>
            <span className="text-body font-bold text-text-dim">
              {employer.role}
            </span>
            <span className="text-label text-text-dim">{employer.company}</span>
            <span className="text-label text-text-muted">
              ({employer.location})
            </span>
            <span className="flex-1" />
            <span className="whitespace-nowrap text-label tabular-nums text-text-muted">
              {employer.period}
            </span>
          </div>

          <div className="divide-y divide-border">
            {logEntries.map((exp, i) => {
              const active = activeExp === i;
              return (
                <div
                  key={exp.id}
                  role="button"
                  tabIndex={0}
                  data-nav-item
                  data-nav-activate
                  aria-expanded={active}
                  className={`cursor-pointer border-l-[length:var(--border-width-rule)] transition-colors duration-200 ${
                    active
                      ? "border-l-border-accent bg-surface"
                      : "border-l-transparent hover:bg-surface"
                  }`}
                  onClick={() =>
                    setActiveExp((prev) => (prev === i ? null : i))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveExp((prev) => (prev === i ? null : i));
                    }
                  }}
                >
                  <div className="flex items-center gap-block px-gutter py-block">
                    <span
                      className={`text-label font-bold tabular-nums transition-colors duration-200 ${
                        active ? "text-accent-text" : "text-text-muted"
                      }`}
                    >
                      {exp.id}
                    </span>

                    <span className="text-label font-bold text-text-dim">
                      [OK]
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-quarter md:flex-row md:items-baseline md:justify-between md:gap-gutter">
                        <h3
                          className={`text-body-lg font-bold transition-colors duration-200 ${
                            active ? "text-text" : "text-text-dim"
                          }`}
                        >
                          {exp.unit}
                        </h3>
                        <span className="whitespace-nowrap text-micro tabular-nums text-text-muted">
                          {exp.timestamp}
                        </span>
                      </div>
                      <p className="mt-quarter text-body text-text-dim">
                        {exp.summary}
                      </p>
                    </div>

                    <span
                      aria-hidden="true"
                      className={`text-body-lg ${
                        active ? "text-text" : "text-text-muted"
                      }`}
                    >
                      {active ? "↓" : "→"}
                    </span>
                  </div>

                  {active && (
                    <div className="space-y-block border-t border-border px-gutter py-block md:px-block">
                      <p className="max-w-[65ch] text-body text-text-dim">
                        {exp.description}
                      </p>
                      <ul className="flex flex-wrap gap-half">
                        {exp.tech.map((t) => (
                          <li
                            key={t}
                            className="border border-border px-half py-quarter text-label text-text-muted"
                          >
                            {t}
                          </li>
                        ))}
                      </ul>
                      <p className="flex items-center gap-half text-label text-text-dim">
                        {/* 4px square mark — radius 0, no rounded dot (§5) */}
                        <span
                          aria-hidden="true"
                          className="h-quarter w-quarter shrink-0 bg-accent"
                        />
                        {exp.status}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Provenance footnote — the only surviving footprint-ledger
              detail, kept as a plain log footer row (D3 survivor rule). */}
          <div className="border-t border-border-accent px-gutter py-half md:px-block">
            <p className="text-micro text-text-muted">
              commit ledger recovered from 21 scanned internal repositories
              after Xentra closed May 2026 · 1,182 commits / 17 repos 2023–2026
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
