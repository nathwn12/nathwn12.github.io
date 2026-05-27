import { motion } from "framer-motion"
import { useScrollVelocity } from "../lib/useScrollVelocity"
import { useState, useEffect } from "react"

export function Footer() {
  const { isScrolling } = useScrollVelocity()
  const [idle, setIdle] = useState(true)

  useEffect(() => {
    if (isScrolling) setIdle(false)
    const t = setTimeout(() => setIdle(true), 5000)
    return () => clearTimeout(t)
  }, [isScrolling])

  const uptimeDays = Math.floor((Date.now() - new Date("2023-03-01").getTime()) / 86400000)

  return (
    <footer className="py-10 px-4 lg:px-8 border-t border-border relative overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.2 }}
          viewport={{ once: true }}
          className="overflow-hidden mb-6 marquee-wrap"
        >
          <div className="marquee-track whitespace-nowrap text-[10px] tracking-[0.3em] text-text-dim uppercase">
            {Array(4)
              .fill(
                "NATHANIEL NIKOLAI LADERO — BACKEND DEVELOPER — C# ASP.NET CORE — FINTECH SYSTEMS — OPEN TO WORK — "
              )
              .join("")}
          </div>
        </motion.div>

        <div className="flex items-center gap-2 justify-center mb-6">
          <span className="text-accent text-xs">$</span>
          <motion.button
            onClick={() => document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.95 }}
            className="text-xs tracking-widest text-text-dim hover:text-accent transition-colors duration-300"
          >
            cd ~/home
          </motion.button>
          <span className="terminal-cursor text-accent text-xs font-bold">█</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-dim">
          <div className="flex items-center gap-4">
            <span
              className={`w-2 h-2 rounded-full inline-block transition-colors duration-300 ${
                idle ? "bg-accent" : "bg-accent-3 animate-pulse"
              }`}
            />
            <span>{idle ? "SYSTEM IDLE" : "SYSTEM ACTIVE"}</span>
            <span className="hidden sm:inline text-border-accent">|</span>
            <span className="hidden sm:inline text-border-accent">
              UPTIME: {uptimeDays} DAYS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-border-accent">MEM: 45%</span>
            <span className="text-border-accent">|</span>
            <span className="text-border-accent">TASKS: 4</span>
            <span className="text-border-accent">|</span>
            <span className="text-border-accent">PROCS: 17</span>
          </div>
          <div>
            NNL · {new Date().getFullYear()} · LUZON, PH
          </div>
          <div className="font-mono text-text-dim/50">
            <a href="https://github.com/nathwn12" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              github/nathwn12
            </a>
            <span className="mx-2">·</span>
            <a href="https://www.linkedin.com/in/nathaniel-nikolai-l-184181261/" target="_blank" rel="noopener noreferrer" className="hover:text-accent-2 transition-colors">
              linkedin
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
