import { motion } from "framer-motion";
import { TerminalWindow } from "./TerminalWindow";

interface YearCommit {
  year: string;
  count: number;
  desc: string;
}

interface RepositoryCommit {
  name: string;
  count: number;
  period: string;
}

const yearCommits: YearCommit[] = [
  {
    year: "2023",
    count: 245,
    desc: "First tracked backend delivery year.",
  },
  {
    year: "2024",
    count: 495,
    desc: "Highest output across core fintech services.",
  },
  {
    year: "2025",
    count: 412,
    desc: "Strong sustained delivery across payments and controls.",
  },
  {
    year: "2026",
    count: 30,
    desc: "Latest visible pushed work before portfolio handoff.",
  },
];

const repositoryCommits: RepositoryCommit[] = [
  {
    name: "Payment Processing API",
    count: 844,
    period: "Jul 2023 – Mar 2026",
  },
  {
    name: "Cash Management Service",
    count: 78,
    period: "Dec 2023 – Dec 2025",
  },
  {
    name: "Teller Integration Platform",
    count: 68,
    period: "Dec 2024 – Sep 2025",
  },
  {
    name: "Access Control Microservice",
    count: 48,
    period: "Mar 2024 – Dec 2025",
  },
  {
    name: "Supporting Systems",
    count: 144,
    period: "Merchant integrations, compliance, reporting",
  },
];

const totalCommitCount = yearCommits.reduce(
  (total, item) => total + item.count,
  0,
);
const matchedRepositoryCount = 17;
const largestYearCommitCount = Math.max(
  ...yearCommits.map((item) => item.count),
);
const largestRepositoryCommitCount = Math.max(
  ...repositoryCommits.map((item) => item.count),
);

function formatCount(count: number) {
  return count.toLocaleString("en-US");
}

export function Footprint() {
  return (
    <section
      id="footprint"
      className="py-8 md:py-12 px-4 lg:px-8 relative overflow-hidden"
    >
      <div
        className="section-ambient"
        style={{
          background: `
            radial-gradient(ellipse at 50% 80%, color-mix(in srgb, var(--color-accent-2) 8%, transparent) 0%, color-mix(in srgb, var(--color-accent-2) 2%, transparent) 40%, transparent 65%),
            radial-gradient(ellipse at 80% 20%, color-mix(in srgb, var(--color-accent) 3%, transparent) 0%, transparent 50%)
          `,
        }}
      />
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-4 mb-8 md:mb-10"
        >
          <span className="text-accent-2 text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            du -sh footprint/
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <TerminalWindow title="footprint/">
          <div className="border border-border-accent bg-bg">
            <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-accent border-b border-border-accent">
              <div className="p-4 md:p-5">
                <p className="text-[10px] tracking-widest text-text-muted">
                  TOTAL COMMITS
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-accent">
                  {formatCount(totalCommitCount)}
                </p>
                <p className="mt-1 text-[10px] text-text-dim">
                  cross-checked delivery records
                </p>
              </div>
              <div className="p-4 md:p-5">
                <p className="text-[10px] tracking-widest text-text-muted">
                  REPOSITORIES
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-accent-2">
                  {formatCount(matchedRepositoryCount)}
                </p>
                <p className="mt-1 text-[10px] text-text-dim">
                  matched work repositories
                </p>
              </div>
              <div className="p-4 md:p-5">
                <p className="text-[10px] tracking-widest text-text-muted">
                  VISIBLE WINDOW
                </p>
                <p className="mt-2 text-lg font-bold tabular-nums text-text">
                  2023 – 2026
                </p>
                <p className="mt-1 text-[10px] text-text-dim">
                  year-by-year ledger
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="p-5 md:p-7 lg:border-r lg:border-border-accent"
              >
                <div className="flex items-center gap-3 mb-7">
                  <span className="text-[10px] tracking-widest text-accent-2">
                    [YEARLY COMMITS]
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-text-muted">
                    MAX {formatCount(largestYearCommitCount)}
                  </span>
                </div>

                <div className="space-y-5">
                  {yearCommits.map((item) => (
                    <div key={item.year}>
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="min-w-0">
                          <span className="text-[10px] tracking-widest text-text-muted">
                            {item.year}
                          </span>
                          <p className="mt-1 text-xs leading-relaxed text-text-dim">
                            {item.desc}
                          </p>
                        </div>
                        <span className="shrink-0 text-xl font-bold tabular-nums text-accent">
                          {formatCount(item.count)}
                        </span>
                      </div>
                      <div
                        role="meter"
                        aria-label={`${item.year}: ${formatCount(item.count)} commits`}
                        aria-valuemin={0}
                        aria-valuemax={largestYearCommitCount}
                        aria-valuenow={item.count}
                        className="mt-3 h-2 border border-border-accent bg-surface"
                      >
                        <div
                          aria-hidden="true"
                          className="h-full bg-accent"
                          style={{
                            width: `${(item.count / largestYearCommitCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.05,
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="p-5 md:p-7"
              >
                <div className="flex items-center gap-3 mb-7">
                  <span className="text-[10px] tracking-widest text-accent-2">
                    [REPOSITORY LEDGER]
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-text-muted">
                    MAX {formatCount(largestRepositoryCommitCount)}
                  </span>
                </div>

                <div className="space-y-4">
                  {repositoryCommits.map((repo) => (
                    <div key={repo.name}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm leading-snug text-text break-words">
                            {repo.name}
                          </p>
                          <p className="mt-1 text-[10px] text-text-muted">
                            {repo.period}
                          </p>
                        </div>
                        <span className="shrink-0 text-lg font-bold tabular-nums text-accent-2">
                          {formatCount(repo.count)}
                        </span>
                      </div>
                      <div
                        role="meter"
                        aria-label={`${repo.name}: ${formatCount(repo.count)} commits`}
                        aria-valuemin={0}
                        aria-valuemax={largestRepositoryCommitCount}
                        aria-valuenow={repo.count}
                        className="mt-2 h-1.5 border border-border-accent bg-surface"
                      >
                        <div
                          aria-hidden="true"
                          className="h-full bg-accent-2"
                          style={{
                            width: `${(repo.count / largestRepositoryCommitCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.35 }}
            className="mt-6 border border-border-accent bg-bg p-5 md:p-7"
          >
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="pt-0.5 text-accent-3 text-sm">
                !
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                  <p className="text-[10px] tracking-widest text-accent-3">
                    [SOURCE LEDGER]
                  </p>
                  <span className="text-[10px] text-text-muted">
                    cross-checked snapshot
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-text-dim">
                  Recovered from 21 scanned internal repositories after Xentra
                  closed in May 2026. The original company repositories and work
                  GitHub account are no longer publicly accessible.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-text-dim">
                  This shows sustained backend delivery across multiple release
                  cycles.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "SOURCE: xentra-nathanladero",
                    `${formatCount(totalCommitCount)} COMMITS`,
                    `${formatCount(matchedRepositoryCount)} REPOS MATCHED`,
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-1 border border-border-accent text-text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </TerminalWindow>
      </div>
    </section>
  );
}
