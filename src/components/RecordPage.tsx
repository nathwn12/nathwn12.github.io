import { useState } from "react";
import {
  commitTotal,
  employer,
  experience,
  experienceLede,
  formerRoleLine,
  provenance,
  repositoryCount,
  tenureSpan,
  type ExperienceEntry,
} from "../content/experience";
import { countWords } from "../content/projects";
import { SkillsIndex } from "./SkillsIndex";

interface TechFilter {
  key: string;
  label: string;
  matches: (entry: ExperienceEntry) => boolean;
}

/** The filter is derived from the record's own tech lists, never from a
    hand-maintained per-entry tag string. Adding a tech to an entry changes the
    count in the same edit. */
const TECH_FILTERS: readonly TechFilter[] = [
  { key: "csharp", label: "C#", matches: (entry) => entry.tech.includes("C#") },
  {
    key: "aspnet",
    label: "ASP.NET",
    matches: (entry) => entry.tech.some((tech) => tech.startsWith("ASP.NET")),
  },
  {
    key: "efcore",
    label: "EF Core",
    matches: (entry) => entry.tech.includes("EF Core"),
  },
  { key: "sql", label: "SQL", matches: (entry) => entry.tech.includes("SQL") },
  {
    key: "redis",
    label: "Redis",
    matches: (entry) => entry.tech.includes("Redis"),
  },
  {
    key: "rabbitmq",
    label: "RabbitMQ",
    matches: (entry) => entry.tech.includes("RabbitMQ"),
  },
  {
    key: "docker",
    label: "Docker",
    matches: (entry) => entry.tech.includes("Docker"),
  },
  { key: "jwt", label: "JWT", matches: (entry) => entry.tech.includes("JWT") },
  { key: "aws", label: "AWS", matches: (entry) => entry.tech.includes("AWS") },
];

const COUNT_WORDS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
];

function countLabel(count: number): string {
  if (count === 1) return "One entry";
  return `${COUNT_WORDS[count] ?? count} entries`;
}

function keysFor(entry: ExperienceEntry): string {
  return TECH_FILTERS.filter((filter) => filter.matches(entry))
    .map((filter) => filter.key)
    .join(" ");
}

/**
 * The full record: nine entries, newest first, each pairing its outcome with
 * the moves behind it. The technology filter is the page's one live control:
 * keyboard-operable buttons, `aria-pressed`, and a polite count. Every entry is
 * rendered by default, so the record is complete without JavaScript.
 */
export function RecordPage() {
  const [active, setActive] = useState("all");
  const visible = experience.filter(
    (entry) =>
      active === "all" ||
      TECH_FILTERS.some(
        (filter) => filter.key === active && filter.matches(entry),
      ),
  );

  return (
    <div className="record-page">
      <section className="page-head field-paper" aria-labelledby="record-title">
        <div className="wrap">
          <h1 id="record-title">The record</h1>
          <p className="lede">{experienceLede}</p>
          <p className="former">
            {formerRoleLine}, {employer.location}. {tenureSpan}.
          </p>
        </div>
      </section>

      <div className="filter field-paper">
        <div className="filter-inner wrap">
          <h2 id="filter-label" className="filter-label">
            Filter by technology
          </h2>
          <div className="filters" role="group" aria-labelledby="filter-label">
            <button
              className="filter-btn"
              type="button"
              aria-pressed={active === "all"}
              onClick={() => setActive("all")}
            >
              All {countWords(experience.length)}
            </button>
            {TECH_FILTERS.map((filter) => {
              const count = experience.filter(filter.matches).length;
              return (
                <button
                  key={filter.key}
                  className="filter-btn"
                  type="button"
                  aria-pressed={active === filter.key}
                  onClick={() => setActive(filter.key)}
                >
                  {filter.label}
                  <span className="sr-only"> ({countLabel(count)})</span>
                </button>
              );
            })}
          </div>
          <p className="filter-count" role="status" aria-live="polite">
            {countLabel(visible.length)}
          </p>
        </div>
      </div>

      <section
        className="record-list field-paper"
        aria-label="Experience entries"
      >
        <div className="record-list-inner">
          {experience.map((entry) => {
            const shown = visible.includes(entry);
            return (
              <article
                className="entry"
                key={entry.id}
                data-entry
                data-tech={keysFor(entry)}
                hidden={!shown}
              >
                <div className="entry-meta">
                  <p className="entry-date">{entry.date}</p>
                  <p className="entry-status">{entry.status}</p>
                </div>
                <div className="entry-body">
                  <h2>{entry.name}</h2>
                  <p className="entry-outcome">{entry.outcome}</p>
                  <p className="entry-desc">{entry.description}</p>
                  <ul className="entry-highlights">
                    {entry.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                  <p className="entry-tech">{entry.tech.join(", ")}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <SkillsIndex />

      <section
        className="provenance-band field-ink"
        aria-labelledby="provenance-heading"
      >
        <div className="inner wrap">
          <h2 className="head" id="provenance-heading">
            Where the numbers come from
          </h2>
          <div>
            <p>{provenance}</p>
            <p className="small">
              {commitTotal.toLocaleString("en-US")} commits across{" "}
              {repositoryCount} repositories from 2023 to 2026. Every dated entry
              above is drawn from the delivered record; no metric is estimated.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
