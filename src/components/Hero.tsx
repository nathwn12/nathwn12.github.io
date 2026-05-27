import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

type RoleTitle = "BACKEND DEVELOPER" | "API ARCHITECT" | "FINTECH ENGINEER" | "SYSTEMS BUILDER"
export const ROLE_TITLES: readonly RoleTitle[] = [
  "BACKEND DEVELOPER",
  "API ARCHITECT",
  "FINTECH ENGINEER",
  "SYSTEMS BUILDER",
] as const

const bootLines = [
  "[OK] Loading kernel modules ...",
  "[OK] Initializing user profile ...",
  "[OK] Establishing secure channel ...",
  "[OK] System ready.",
] as const

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

const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"

function scrambleText(target: string, duration = 1200): string {
  let result = ""
  const charsShown = Math.ceil((Date.now() % duration) / (duration / target.length))
  for (let i = 0; i < target.length; i++) {
    if (i < charsShown) {
      result += target[i]
    } else {
      result += scrambleChars[Math.floor(Math.random() * scrambleChars.length)]
    }
  }
  return result
}

export function Hero() {
  const [roleIndex, setRoleIndex] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [charIndex, setCharIndex] = useState(0)
  const [bootPhase, setBootPhase] = useState(0)
  const [bootComplete, setBootComplete] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [scrambledNNL, setScrambledNNL] = useState("NNL")

  useEffect(() => {
    const current = ROLE_TITLES[roleIndex]
    let innerTimer: ReturnType<typeof setTimeout> | undefined

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(current.slice(0, charIndex + 1))
        setCharIndex((prev) => prev + 1)
        if (charIndex + 1 === current.length) {
          innerTimer = setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        setDisplayText(current.slice(0, charIndex - 1))
        setCharIndex((prev) => prev - 1)
        if (charIndex - 1 === 0) {
          setIsDeleting(false)
          setRoleIndex((prev) => (prev + 1) % ROLE_TITLES.length)
        }
      }
    }, isDeleting ? 40 : 80)

    return () => {
      if (timeout) clearTimeout(timeout)
      if (innerTimer) clearTimeout(innerTimer)
    }
  }, [charIndex, isDeleting, roleIndex])

  useEffect(() => {
    if (bootPhase < bootLines.length) {
      const t = setTimeout(() => {
        setBootPhase((prev) => prev + 1)
      }, 400 + Math.random() * 300)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => setBootComplete(true), 300)
      return () => clearTimeout(t)
    }
  }, [bootPhase])

  useEffect(() => {
    if (!bootComplete) return
    const t = setTimeout(() => setUnlocked(true), 200)
    return () => clearTimeout(t)
  }, [bootComplete])

  useEffect(() => {
    if (!unlocked) return
    const interval = setInterval(() => {
      setScrambledNNL(scrambleText("NNL", 1200))
    }, 100)
    const t = setTimeout(() => {
      clearInterval(interval)
      setScrambledNNL("NNL")
    }, 1500)
    return () => {
      clearInterval(interval)
      clearTimeout(t)
    }
  }, [unlocked])

  return (
    <section id="hero" className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,65,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,65,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <AnimatePresence>
        {!bootComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-bg"
          >
            <div className="text-left font-mono">
              {bootLines.slice(0, bootPhase).map((line, i) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-xs text-accent mb-1 tracking-wider"
                >
                  {line}
                </motion.p>
              ))}
              {bootPhase < bootLines.length && (
                <span className="terminal-cursor text-accent text-xs">█</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bootComplete && !unlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-bg"
          >
            <motion.div
              initial={{ scale: 1, filter: "brightness(1)" }}
              animate={{
                scale: [1, 1.02, 0.98, 1],
                filter: [
                  "brightness(1)",
                  "brightness(3) saturate(0.5)",
                  "brightness(0.8) saturate(2)",
                  "brightness(1)",
                ],
              }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <p className="text-text-dim text-sm tracking-widest">SCREEN UNLOCKING...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {unlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="res-switch"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 0.06, scale: 1 }}
              transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] md:text-[25rem] font-bold text-accent select-none pointer-events-none leading-none tracking-tighter"
            >
              {scrambledNNL}
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="relative z-10 px-4 lg:px-8 flex justify-center"
            >
              <div className="max-w-5xl w-full">
                <motion.div variants={childVariants} className="mb-6 flex items-center gap-2">
                  <span className="text-accent text-sm">$</span>
                  <span className="text-text-muted text-sm">whoami</span>
                  <span className="terminal-cursor text-accent text-sm font-bold">█</span>
                </motion.div>

                <motion.h1
                  variants={childVariants}
                  className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter leading-[0.85] mb-8"
                >
                  <span className="block text-white">NATHANIEL</span>
                  <span className="block glitch-text text-accent glow-green" data-text="NIKOLAI LADERO">
                    NIKOLAI LADERO
                  </span>
                </motion.h1>

                <motion.div variants={childVariants} className="flex items-center gap-3 mb-10">
                  <motion.div
                    animate={{ width: ["2rem", "6rem", "2rem"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
                    className="h-[2px] bg-accent"
                  />
                  <p className="text-sm md:text-base tracking-[0.3em] text-accent font-light">
                    {displayText}
                    <span className="terminal-cursor font-bold">_</span>
                  </p>
                </motion.div>

                <motion.div variants={childVariants} className="border border-border-accent">
                  <div className="terminal-titlebar">
                    <span className="terminal-dot bg-accent-3" />
                    <span className="terminal-dot bg-accent-2" />
                    <span className="terminal-dot bg-accent" />
                    <span className="text-[9px] tracking-[0.3em] text-text-muted ml-2 uppercase">login-session.exe</span>
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
                        whileHover={{ backgroundColor: "rgba(0,255,65,0.05)" }}
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
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    className="text-accent"
                  >
                    ↓
                  </motion.span>
                  <span className="terminal-cursor text-accent text-sm font-bold">█</span>
                </motion.div>

                <motion.div
                  variants={childVariants}
                  className="mt-16 flex flex-col items-center gap-2 text-text-muted text-xs tracking-widest"
                >
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      animate={{ y: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
                      className="w-[1px] h-10 bg-accent/30"
                    />
                  </div>
                  <span className="text-[9px] tracking-[0.4em]">INITIALIZE SECTIONS</span>
                </motion.div>

                <motion.div
                  variants={childVariants}
                  className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.5em] text-border-accent"
                  style={{ writingMode: "vertical-rl" }}
                >
                  BACKEND.DEVELOPER.RESUME — BUILD 2026 — C# .NET FINTECH
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
