import { motion } from "framer-motion";
import { navigate } from "../lib/router";
import { TerminalWindow } from "./TerminalWindow";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const systemFacts = [
  ["OS", "Ubuntu/Linux Servers / Docker"],
  ["Kernel", ".NET 6/7/8/9 / C#"],
  ["Packages", "17 repos · 1,100+ commits"],
  ["Shell", "Bash / PowerShell"],
  ["AI Tools", "LM Studio / OpenCode / Codex"],
  ["Certs", "Google IT Support · IT Automation with Python"],
] as const;

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-full flex flex-col justify-center overflow-hidden"
    >
      {/* Ambient green gradient */}
      <div
        className="section-ambient"
        style={{
          background: `
            radial-gradient(ellipse at 25% 30%, color-mix(in srgb, var(--color-accent) 8%, transparent) 0%, color-mix(in srgb, var(--color-accent) 1%, transparent) 45%, transparent 70%),
            radial-gradient(ellipse at 75% 70%, color-mix(in srgb, var(--color-accent) 4%, transparent) 0%, transparent 50%)
          `,
        }}
      />
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(color-mix(in srgb, var(--color-accent) 4%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 4%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 px-4 lg:px-8 flex justify-center"
      >
        <div className="max-w-5xl w-full">
          {/* $ whoami prompt */}
          <motion.div
            variants={childVariants}
            className="mb-6 flex items-center gap-2"
          >
            <span className="text-accent text-sm">$</span>
            <span className="text-text-muted text-sm">whoami</span>
            <span className="terminal-cursor text-accent text-sm font-bold">
              █
            </span>
          </motion.div>

          {/* Name — clean, no glitch */}
          <motion.h1
            variants={childVariants}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter leading-[0.85] mb-6"
          >
            <span className="block text-text">NATHANIEL</span>
            <span className="block text-accent">NIKOLAI LADERO</span>
          </motion.h1>

          {/* Role — static, no typewriter */}
          <motion.p
            variants={childVariants}
            className="text-xs md:text-sm tracking-[0.3em] text-text-dim mb-6"
          >
            BACKEND DEVELOPER — 3 YRS PRODUCTION FINTECH
          </motion.p>

          {/* Summary — drawn from resume */}
          <motion.p
            variants={childVariants}
            className="text-sm md:text-base text-text-dim leading-relaxed max-w-2xl mb-10"
          >
            Backend Developer with 3 years of production fintech experience and
            extensive hands-on DevOps experience. Builds C# and ASP.NET APIs,
            manages Ubuntu/Linux servers and Docker containers, configures Nginx
            reverse proxies, and automates CI/CD deployments through GitHub
            Actions with Bash and PowerShell. Uses a practical AI-assisted
            workflow, backed by Google IT Support and IT Automation with Python
            certifications.
          </motion.p>

          {/* Stats grid — terminal window */}
          <motion.div
            variants={childVariants}
            className="border border-border-accent"
          >
            <div className="terminal-titlebar">
              <span className="terminal-dot bg-accent-3" />
              <span className="terminal-dot bg-accent-2" />
              <span className="terminal-dot bg-accent" />
              <span className="text-[9px] tracking-[0.3em] text-text-muted ml-2 uppercase">
                profile
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border-accent">
              {[
                { label: "LOCATION", value: "HAGONOY, BULACAN, PH" },
                { label: "EXPERIENCE", value: "3 YEARS" },
                { label: "ROLE", value: "BACKEND DEVELOPER" },
                { label: "STATUS", value: "OPEN TO WORK" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{
                    backgroundColor:
                      "color-mix(in srgb, var(--color-accent) 5%, transparent)",
                  }}
                  className="bg-bg p-4 md:p-6 group transition-colors duration-500"
                >
                  <p className="text-[10px] tracking-[0.2em] text-text-muted mb-1">
                    {stat.label}
                  </p>
                  <p className="text-sm md:text-base font-bold text-text group-hover:text-accent transition-colors duration-300">
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* System dossier — the non-duplicated profile detail */}
          <motion.div variants={childVariants} className="mt-10">
            <TerminalWindow title="system.md">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-12 p-4 md:p-6"
              >
                <motion.div
                  variants={childVariants}
                  className="border border-border-accent bg-bg p-4 md:p-6 font-mono"
                >
                  <div className="text-accent text-xs mb-3 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-accent rounded-full" />
                    $ neofetch
                  </div>
                  <div className="border-t border-border-accent pt-3 space-y-1.5">
                    {systemFacts.map(([label, value]) => (
                      <motion.div
                        key={label}
                        whileHover={{ x: 4 }}
                        className="flex gap-2 text-xs group cursor-default"
                      >
                        <span className="text-text-muted shrink-0 w-16">
                          {label}
                        </span>
                        <span className="text-text group-hover:text-accent transition-colors duration-300">
                          {value}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <span className="text-accent text-xs">$ </span>
                  </div>
                </motion.div>

                <div className="space-y-6">
                  <motion.div variants={childVariants}>
                    <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
                      Crafting reliable systems{" "}
                      <span className="text-accent">that scale</span> under
                      pressure.
                    </h2>
                  </motion.div>

                  <motion.div
                    variants={childVariants}
                    className="space-y-4 text-text-dim text-sm leading-relaxed"
                  >
                    <p>
                      Treats infrastructure as part of the codebase: Nginx
                      configs, Bash scripts, and CI/CD pipelines receive the
                      same rigor as application code.
                    </p>
                    <p>
                      Daily AI tooling: LM Studio, OpenCode, and Codex, with
                      preferred local models Qwen 3.8, DeepSeek V4 Flash, and
                      Qwen 3.5 (9B, 27B). English (professional), Filipino
                      (native).
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </TerminalWindow>
          </motion.div>

          {/* Resume download */}
          <motion.div
            variants={childVariants}
            className="mt-12 flex items-center gap-3 text-xs tracking-widest group"
          >
            <span className="text-accent text-sm">$</span>
            <motion.a
              href="Nathaniel-Nikolai-Ladero-Resume.pdf"
              download="Nathaniel-Nikolai-Ladero-Resume.pdf"
              whileHover={{ x: 4 }}
              className="text-text-dim hover:text-accent transition-colors duration-300 cursor-pointer"
            >
              wget ./resume.pdf
            </motion.a>
            <span className="text-accent">↓</span>
          </motion.div>

          {/* Page navigation hints */}
          <motion.div
            variants={childVariants}
            className="mt-16 flex items-center justify-center gap-8 text-text-muted"
          >
            <button
              type="button"
              disabled
              className="flex items-center gap-2 text-[9px] tracking-[0.3em] opacity-40 cursor-not-allowed"
            >
              <span className="text-xs">←</span>
              <span>PREV</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/experience")}
              className="flex items-center gap-2 text-[9px] tracking-[0.3em] hover:text-accent transition-colors duration-300 cursor-pointer"
            >
              <span>NEXT</span>
              <span className="text-xs">→</span>
            </button>
          </motion.div>

          {/* Vertical sidebar */}
          <motion.div
            variants={childVariants}
            className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.5em] text-border-accent"
            style={{ writingMode: "vertical-rl" }}
          >
            BACKEND.DEVELOPER.RESUME — BUILD 2026 — C# .NET FINTECH
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
