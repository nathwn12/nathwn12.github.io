import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { TerminalWindow } from "./TerminalWindow"

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function About() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="about" className="py-24 md:py-32 px-4 lg:px-8 relative overflow-hidden">
      <div className="section-ambient"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(0,255,65,0.15) 0%, rgba(0,255,65,0.03) 40%, transparent 65%),
            radial-gradient(ellipse at 80% 30%, rgba(0,255,65,0.06) 0%, transparent 50%)
          `,
        }}
      />
      <div className="max-w-5xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-12"
        >
          <span className="text-accent text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            cat about.md
          </span>
          <motion.div
            animate={isInView ? { flex: 1 } : { flex: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="h-[1px] bg-border"
          />
        </motion.div>

        <TerminalWindow title="about.md">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-12"
        >
          <motion.div variants={item} className="border border-border-accent bg-bg p-4 md:p-6 font-mono">
            <div className="text-accent text-xs mb-3 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-accent rounded-full pulse-dot" />
              $ neofetch
            </div>
            <div className="border-t border-border-accent pt-3 space-y-1.5">
              {[
                ["OS", "Windows 11 / Arch WSL"],
                ["Kernel", ".NET 8/9 · ASP.NET Core"],
                ["Uptime", "3+ years active"],
                ["Packages", "17 repos · 1,182 commits"],
                ["Shell", "C# / ASP.NET Core"],
                ["Editor", "VS Code / Neovim"],
                ["Domain", "Fintech Backend"],
              ].map(([label, value]) => (
                <motion.div
                  key={label}
                  whileHover={{ x: 4 }}
                  className="flex gap-2 text-xs group cursor-default"
                >
                  <span className="text-text-muted shrink-0 w-16">{label}</span>
                  <span className="text-white group-hover:text-accent transition-colors duration-300">{value}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-3">
              <span className="text-accent text-xs">$ </span>
              <span className="terminal-cursor text-accent text-xs font-bold">█</span>
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.div variants={item}>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
                Crafting reliable systems{" "}
                <span className="text-accent glow-green">
                  that scale
                </span>{" "}
                under pressure.
              </h2>
            </motion.div>

            <motion.div variants={item} className="space-y-4 text-text-dim text-sm leading-relaxed">
              <p>
                Backend Developer with 3+ years building secure backend systems for fintech
                applications. Strong in C# and ASP.NET Core, with hands-on ownership of APIs,
                databases, microservices, AWS-hosted services, and production releases.
              </p>
              <p>
                Strongest when owning backend delivery end to end: technical design, data
                modeling, implementation, API documentation, deployment support, and production issue resolution.
              </p>
              <p>
                Based in Luzon, Philippines — open to remote opportunities
                globally. Thrive in cross-functional teams and fast-moving environments where
                quality and velocity both matter.
              </p>
            </motion.div>

            <motion.div variants={item} className="grid grid-cols-2 gap-px bg-border-accent border border-border-accent mt-8">
              {[
                ["DEGREE", "B.S. Information Technology"],
                ["LANGUAGES", "EN, FIL"],
                ["STACK", "C#, ASP.NET Core"],
                ["EDITOR", "VS CODE / NEOVIM"],
              ].map(([label, value]) => (
                <motion.div
                  key={label}
                  whileHover={{ backgroundColor: "rgba(0,255,65,0.03)" }}
                  className="bg-bg px-4 py-3 transition-colors duration-300"
                >
                  <span className="text-[10px] tracking-widest text-text-muted block mb-0.5">
                    {label}
                  </span>
                  <span className="text-xs text-white">{value}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
        </TerminalWindow>
      </div>
    </section>
  )
}
