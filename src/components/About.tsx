import { motion } from "framer-motion";
import { TerminalWindow } from "./TerminalWindow";

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function About() {
  return (
    <section
      id="about"
      className="py-8 md:py-12 px-4 lg:px-8 relative overflow-hidden"
    >
      <div
        className="section-ambient"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, color-mix(in srgb, var(--color-accent) 10%, transparent) 0%, color-mix(in srgb, var(--color-accent) 2%, transparent) 40%, transparent 65%),
            radial-gradient(ellipse at 80% 30%, color-mix(in srgb, var(--color-accent) 4%, transparent) 0%, transparent 50%)
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
            cat about.md
          </span>
          <motion.div
            initial={{ flex: 0 }}
            animate={{ flex: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="h-[1px] bg-border"
          />
        </motion.div>

        <TerminalWindow title="about.md">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-12"
          >
            <motion.div
              variants={item}
              className="border border-border-accent bg-bg p-4 md:p-6 font-mono"
            >
              <div className="text-accent text-xs mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-accent rounded-full" />
                $ neofetch
              </div>
              <div className="border-t border-border-accent pt-3 space-y-1.5">
                {[
                  ["OS", "Ubuntu Servers / Docker"],
                  ["Kernel", "ASP.NET Core / C#"],
                  ["Uptime", "3 yrs production fintech"],
                  ["Packages", "17 repos · 1,100+ commits"],
                  ["Shell", "Bash / PowerShell"],
                  ["Editor", "Copilot / Claude Code"],
                  ["Certs", "Google IT · Python Automation"],
                  ["Domain", "Fintech Backend"],
                ].map(([label, value]) => (
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
              <motion.div variants={item}>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
                  Crafting reliable systems{" "}
                  <span className="text-accent">that scale</span> under
                  pressure.
                </h2>
              </motion.div>

              <motion.div
                variants={item}
                className="space-y-4 text-text-dim text-sm leading-relaxed"
              >
                <p>
                  Backend Developer with 3 years of production fintech
                  experience — building C# and ASP.NET Core APIs, managing Linux
                  servers and Docker containers, and automating deployments
                  through GitHub Actions.
                </p>
                <p>
                  Treats infrastructure as part of the codebase: Nginx configs,
                  Bash scripts, and CI/CD pipelines receive the same rigor as
                  application code. Backed by Google IT Support and IT
                  Automation with Python certifications.
                </p>
                <p>
                  Daily AI tooling: Copilot, Claude Code, OpenCode, ChatGPT,
                  DeepSeek, and local LLMs (Llama 3, Mistral, Qwen) via Ollama
                  and LM Studio. Based in Hagonoy, Bulacan, Philippines —
                  English (professional), Filipino (native).
                </p>
              </motion.div>

              <motion.div
                variants={item}
                className="grid grid-cols-2 gap-px bg-border-accent border border-border-accent mt-8"
              >
                {[
                  ["CERTIFICATIONS", "GOOGLE IT SUPPORT · IT AUTOMATION"],
                  ["LANGUAGES", "EN, FIL (NATIVE)"],
                  ["STACK", "C#, ASP.NET CORE"],
                  ["REPOS", "17 · 1,100+ COMMITS"],
                ].map(([label, value]) => (
                  <motion.div
                    key={label}
                    whileHover={{
                      backgroundColor:
                        "color-mix(in srgb, var(--color-accent) 3%, transparent)",
                    }}
                    className="bg-bg px-4 py-3 transition-colors duration-300"
                  >
                    <span className="text-[10px] tracking-widest text-text-muted block mb-0.5">
                      {label}
                    </span>
                    <span className="text-xs text-text">{value}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </TerminalWindow>
      </div>
    </section>
  );
}
