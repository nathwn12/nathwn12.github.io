import { useState } from "react";
import { motion } from "framer-motion";
import { TerminalWindow } from "./TerminalWindow";
import { employer, logEntries } from "../content/experience";

export function Experience() {
  const [activeExp, setActiveExp] = useState<number | null>(0);

  return (
    <section
      id="experience"
      className="py-8 md:py-12 px-4 lg:px-8 relative overflow-hidden"
    >
      <div
        className="section-ambient"
        style={{
          background: `
            radial-gradient(ellipse at 80% 50%, color-mix(in srgb, var(--color-accent-2) 8%, transparent) 0%, color-mix(in srgb, var(--color-accent-2) 2%, transparent) 40%, transparent 65%),
            radial-gradient(ellipse at 20% 80%, color-mix(in srgb, var(--color-accent-2) 4%, transparent) 0%, transparent 50%)
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
          <span className="text-accent text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            journalctl -u career.service --no-pager
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <TerminalWindow title="career.service">
          {/* Service header — single employer era */}
          <div className="px-4 md:px-6 py-3 border-b border-border bg-text/[0.01]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="text-accent font-bold">{employer.unit}</span>
              <span className="text-text font-bold">{employer.role}</span>
              <span className="text-text-dim">{employer.company}</span>
              <span className="text-text-muted">({employer.location})</span>
              <span className="flex-1" />
              <span className="text-text-muted whitespace-nowrap">
                {employer.period}
              </span>
            </div>
          </div>

          <div className="space-y-px">
            {logEntries.map((exp, i) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.08,
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={activeExp === i}
                  className={`group cursor-pointer transition-all duration-500 border border-border hover:border-accent/20 ${
                    activeExp === i
                      ? "bg-accent/[0.02] border-accent/30"
                      : "hover:bg-text/[0.01]"
                  }`}
                  onClick={() =>
                    setActiveExp((prev) => (prev === i ? null : i))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setActiveExp((prev) => (prev === i ? null : i));
                  }}
                >
                  <div className="flex items-center gap-4 md:gap-8 py-5 md:py-6 px-4 md:px-6">
                    <motion.span
                      className={`text-xs font-bold tabular-nums transition-colors duration-300 ${
                        activeExp === i ? "text-accent" : "text-text-dim"
                      }`}
                    >
                      {exp.id}
                    </motion.span>

                    <span className="text-xs font-bold text-accent">[OK]</span>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4">
                        <h3
                          className={`text-sm md:text-base font-bold tracking-tight transition-colors duration-300 ${
                            activeExp === i ? "text-text" : "text-text-dim"
                          }`}
                        >
                          {exp.unit}
                        </h3>
                        <span className="text-[10px] tracking-widest text-text-muted whitespace-nowrap tabular-nums">
                          {exp.timestamp}
                        </span>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 mt-1">
                        <span className="text-xs text-text-dim">
                          {exp.summary}
                        </span>
                      </div>
                    </div>

                    <motion.div
                      animate={{
                        x: activeExp === i ? 4 : 0,
                      }}
                      className={`text-lg transition-colors duration-300 ${
                        activeExp === i ? "text-accent" : "text-text-muted"
                      }`}
                    >
                      {activeExp === i ? "↓" : "→"}
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: activeExp === i ? "auto" : 0,
                      opacity: activeExp === i ? 1 : 0,
                    }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 md:p-6 space-y-4 border-t border-accent/10">
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
                      <div className="inline-flex items-center gap-2 text-[10px] tracking-widest text-accent mt-2">
                        <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full" />
                        {exp.status}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </TerminalWindow>
      </div>
    </section>
  );
}
