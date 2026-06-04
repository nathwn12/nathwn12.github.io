import { motion } from "framer-motion"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

const childVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function Hero() {
  return (
    <section id="hero" className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden">
      {/* Ambient green gradient */}
      <div className="section-ambient"
        style={{
          background: `
            radial-gradient(ellipse at 25% 30%, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.02) 45%, transparent 70%),
            radial-gradient(ellipse at 75% 70%, rgba(34,197,94,0.06) 0%, transparent 50%)
          `,
        }}
      />
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,197,94,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.06) 1px, transparent 1px)
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
          <motion.div variants={childVariants} className="mb-6 flex items-center gap-2">
            <span className="text-accent text-sm">$</span>
            <span className="text-text-muted text-sm">whoami</span>
            <span className="terminal-cursor text-accent text-sm font-bold">█</span>
          </motion.div>

          {/* Name — clean, no glitch */}
          <motion.h1
            variants={childVariants}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter leading-[0.85] mb-6"
          >
            <span className="block text-white">NATHANIEL</span>
            <span className="block text-accent">NIKOLAI LADERO</span>
          </motion.h1>

          {/* Role — static, no typewriter */}
          <motion.p
            variants={childVariants}
            className="text-xs md:text-sm tracking-[0.3em] text-text-dim mb-10"
          >
            BACKEND DEVELOPER · API ARCHITECT · FINTECH ENGINEER
          </motion.p>

          {/* Stats grid — terminal window */}
          <motion.div variants={childVariants} className="border border-border-accent">
            <div className="terminal-titlebar">
              <span className="terminal-dot bg-accent-3" />
              <span className="terminal-dot bg-accent-2" />
              <span className="terminal-dot bg-accent" />
              <span className="text-[9px] tracking-[0.3em] text-text-muted ml-2 uppercase">profile</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border-accent">
              {[
                { label: "LOCATION", value: "LUZON, PHILIPPINES" },
                { label: "EXPERIENCE", value: "3+ YEARS" },
                { label: "ROLE", value: "BACKEND DEV" },
                { label: "STATUS", value: "OPEN TO WORK" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ backgroundColor: "rgba(34,197,94,0.05)" }}
                  className="bg-bg p-4 md:p-6 group transition-colors duration-500"
                >
                  <p className="text-[10px] tracking-[0.2em] text-text-muted mb-1">
                    {stat.label}
                  </p>
                  <p className="text-sm md:text-base font-bold text-white group-hover:text-accent transition-colors duration-300">
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>
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
            <span className="terminal-cursor text-accent text-sm font-bold">█</span>
          </motion.div>

          {/* Scroll indicator — simplified */}
          <motion.div
            variants={childVariants}
            className="mt-16 flex flex-col items-center gap-2 text-text-muted text-xs tracking-widest"
          >
            <div className="w-[1px] h-10 bg-accent/30" />
            <span className="text-[9px] tracking-[0.4em]">SCROLL</span>
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
  )
}
