import { motion } from "framer-motion"
import { useState } from "react"
import type { SkillCategory } from "../types/models"

const skillCategories: SkillCategory[] = [
  {
    category: "BACKEND CORE",
    skills: [
      { name: "C#", level: 95 },
      { name: "ASP.NET CORE", level: 93 },
      { name: ".NET 6/7/8/9", level: 92 },
      { name: "REST APIs", level: 94 },
      { name: "MICROSERVICES", level: 88 },
    ],
  },
  {
    category: "DATABASES & STORAGE",
    skills: [
      { name: "MYSQL", level: 90 },
      { name: "POSTGRESQL", level: 85 },
      { name: "SQL SERVER", level: 82 },
      { name: "MONGODB", level: 75 },
      { name: "REDIS", level: 78 },
    ],
  },
  {
    category: "PRODUCTION & SECURITY",
    skills: [
      { name: "AWS", level: 85 },
      { name: "DOCKER", level: 80 },
      { name: "JWT/OAUTH", level: 90 },
      { name: "SNYK", level: 85 },
      { name: "CI/CD", level: 82 },
    ],
  },
  {
    category: "TOOLS & RUNTIME",
    skills: [
      { name: "GIT", level: 95 },
      { name: "VS CODE", level: 93 },
      { name: "NEOVIM", level: 80 },
      { name: "LINUX", level: 82 },
      { name: "OPENAPI", level: 88 },
    ],
  },
]

function SkillBar({ name, level, index }: { name: string; level: number; index: number }) {
  const blocks = "▇▇▇▇▇▇▇▇▇▇"
  const fillCount = Math.round(level / 10)
  const emptyCount = 10 - fillCount
  const barVisual = blocks.slice(0, fillCount) + "░░░░░░░░░░".slice(0, emptyCount)

  const getBarColor = (lvl: number) => {
    if (lvl >= 90) return "text-accent"
    if (lvl >= 80) return "text-accent-2"
    if (lvl >= 70) return "text-accent-3"
    return "text-accent-4"
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="group"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] tracking-wider text-text-dim group-hover:text-white transition-colors duration-300">
          {name}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs tracking-wider ${getBarColor(level)} font-bold tabular-nums w-9 shrink-0`}>
          {level}%
        </span>
        <span className="font-mono text-xs tracking-wider text-text-dim">
          {barVisual}
        </span>
      </div>
      <div className="h-[3px] bg-border relative overflow-hidden mt-1">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.04 + 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full ${level >= 90 ? "bg-accent" : level >= 80 ? "bg-accent-2" : level >= 70 ? "bg-accent-3" : "bg-accent-4"} relative overflow-hidden`}
          style={{
            boxShadow: level >= 90 ? "0 0 8px rgba(34,197,94,0.3)" : "none",
          }}
        >
          <motion.div
            initial={{ x: "-100%" }}
            whileInView={{ x: "200%" }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04 + 0.5, duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

export function Skills() {
  const [loadAvg] = useState(() => `${Math.floor(Math.random() * 3 + 1)}.${Math.floor(Math.random() * 99)}`)
  return (
    <section id="skills" className="py-24 md:py-32 px-4 lg:px-8 relative overflow-hidden">
      <div className="section-ambient"
        style={{
          background: `
            radial-gradient(ellipse at 30% 60%, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.03) 40%, transparent 65%),
            radial-gradient(ellipse at 70% 20%, rgba(56,189,248,0.05) 0%, transparent 50%)
          `,
        }}
      />
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-12"
        >
          <span className="text-accent-3 text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            htop
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        {/* htop-style frame */}
        <div className="border border-border-accent bg-surface">
          {/* Title bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border-accent bg-surface text-[9px] tracking-widest text-text-muted">
            <span className="text-accent">htop — LOAD AVERAGE: {loadAvg}</span>
            <span className="text-border-accent">TASKS: 4, UPTIME: 3+ YEARS</span>
          </div>

          {/* Content */}
          <div className="grid md:grid-cols-2 gap-px bg-border-accent">
            {skillCategories.map((cat, catIdx) => (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: catIdx * 0.08, duration: 0.5 }}
                className="bg-bg p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[10px] text-accent-3 shrink-0">
                    ◆
                  </span>
                  <span className="text-[10px] tracking-[0.3em] text-accent-3 font-bold">
                    [{cat.category}]
                  </span>
                  <div className="flex-1 h-[1px] bg-border" />
                </div>
                <div className="space-y-4">
                  {cat.skills.map((skill, idx) => (
                    <SkillBar
                      key={skill.name}
                      name={skill.name}
                      level={skill.level}
                      index={catIdx * 5 + idx}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom status bar */}
          <div className="flex items-center gap-6 px-4 py-2 border-t border-border-accent bg-surface text-[9px] tracking-widest text-text-muted">
            {["F1 Help", "F2 Setup", "F3 Search", "F4 Filter", "F5 Tree"].map((key) => (
              <span key={key} className="text-border-accent">{key}</span>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-6 overflow-hidden border-y border-border py-4 marquee-wrap"
        >
          <div className="flex whitespace-nowrap marquee-track text-[9px] tracking-widest text-text-muted">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4">
                <span className="text-accent-3">PID 1 —</span>
                {[
                  "C#", "ASP.NET CORE", "MYSQL", "AWS", "DOCKER",
                  "JWT", "EF CORE", "POSTGRES", "REDIS", "GIT",
                  "LINUX", "OAUTH", "SNYK", "REST", "SWAGGER",
                ].map((tech) => (
                  <a
                    key={`${i}-${tech}`}
                    href="#skills"
                    className="hover:text-accent transition-colors duration-300"
                  >
                    {tech}
                    <span className="text-border mx-2 pointer-events-none">◆</span>
                  </a>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
