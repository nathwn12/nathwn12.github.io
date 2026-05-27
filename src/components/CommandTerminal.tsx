import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Line {
  id: number
  type: "input" | "output" | "system"
  content: string
}

const SECTIONS = [
  { id: "hero", name: "whoami", desc: "Identity & access" },
  { id: "about", name: "about.md", desc: "System information" },
  { id: "experience", name: "experience.log", desc: "Service journal" },
  { id: "footprint", name: "footprint/", desc: "Delivery stats" },
  { id: "skills", name: "htop", desc: "Resource monitor" },
  { id: "projects", name: "projects/", desc: "Project directory" },
  { id: "education", name: "education.md", desc: "Education history" },
  { id: "contact", name: "inbox", desc: "Mail user agent" },
] as const

const HELP = [
  "╔══════════════════════════════════════════════╗",
  "║ COMMAND         DESCRIPTION                  ║",
  "╠══════════════════════════════════════════════╣",
  "║ help            Show this help message       ║",
  "║ ls              List all sections            ║",
  "║ cd <section>    Navigate to a section        ║",
  "║ whoami          Identity information         ║",
  "║ neofetch        System information           ║",
  "║ clear           Clear terminal               ║",
  "║ date            Current date & time           ║",
  "║ uptime          System uptime                ║",
  "║ ping            Network test                 ║",
  "║ sudo            Elevate privileges            ║",
  "║ theme           Display color scheme          ║",
  "║ history         Command history               ║",
  "║ Ctrl+L          Clear screen                 ║",
  "╚══════════════════════════════════════════════╝",
]

const WELCOME = [
  "╔═══════════════════════════════════════════╗",
  "║   PORTFOLIO TERMINAL v1.0                ║",
  "║   Type 'help' for available commands     ║",
  "╚═══════════════════════════════════════════╝",
]

const TRY_SUDO = [
  "",
  "  ⚠️  Nice try. You don't have sudo on this system.",
  "  ─────────────────────────────────────────────",
  "  Hint: you're already root on your own machine.",
]

export function CommandTerminal() {
  const [visible, setVisible] = useState(false)
  const [lines, setLines] = useState<Line[]>([])
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [welcomed, setWelcomed] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)
  const activeRef = useRef(true)
  const visibleRef = useRef(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const addLine = useCallback((type: Line["type"], content: string) => {
    setLines((prev) => [...prev, { id: idRef.current++, type, content }])
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lines])

  useEffect(() => {
    if (visible) {
      if (!welcomed) {
        setWelcomed(true)
        addLine("system", WELCOME.join("\n"))
      }
      inputRef.current?.focus()
    }
  }, [visible, welcomed, addLine])

  useEffect(() => {
    return () => {
      activeRef.current = false
      timers.current.forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        visibleRef.current = !visibleRef.current
        setVisible(visibleRef.current)
        setHistoryIdx(-1)
        return
      }
      if (e.key === "Escape" && visibleRef.current) {
        visibleRef.current = false
        setVisible(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    const handler = () => {
      visibleRef.current = !visibleRef.current
      setVisible(visibleRef.current)
      setHistoryIdx(-1)
    }
    window.addEventListener("toggle-terminal", handler)
    return () => window.removeEventListener("toggle-terminal", handler)
  }, [])

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }, [])

  const executeCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim()
      if (!trimmed) return

      addLine("input", `$ ${trimmed}`)

      const parts = trimmed.split(/\s+/)
      const command = parts[0].toLowerCase()
      const args = parts.slice(1)

      setHistory((prev) => [...prev, trimmed])
      setHistoryIdx(-1)

      timers.current.forEach(clearTimeout)
      timers.current = []

      switch (command) {
        case "help": {
          addLine("output", HELP.join("\n"))
          break
        }

        case "ls": {
          const list = SECTIONS.map(
            (s) => `  ${s.name.padEnd(16)} ${s.desc}`
          ).join("\n")
          addLine("output", list)
          break
        }

        case "cd": {
          if (!args[0]) {
            addLine("output", "Usage: cd <section>  (try 'ls' to list sections)")
            break
          }
          const target = SECTIONS.find(
            (s) => s.id === args[0] || s.name.replace(/\.|\//g, "") === args[0].replace(/\.|\//g, "")
          )
          if (!target) {
            addLine("output", `cd: no such directory: ${args[0]}`)
            break
          }
          addLine("output", `Navigating to ${target.name}...`)
          const t = setTimeout(() => {
            if (!activeRef.current) return
            visibleRef.current = false
            setVisible(false)
            scrollToSection(target.id)
          }, 250)
          timers.current.push(t)
          break
        }

        case "whoami": {
          addLine(
            "output",
            [
              "  nathaniel-nikolai-ladero",
              "  uid=1000(nathan)  gid=1000(dev)",
              "  groups=1000(dev),4(backend),27(fintech)",
              "  role=Backend Developer",
              "  status=OPEN TO WORK",
            ].join("\n")
          )
          break
        }

        case "neofetch": {
          const info = [
            "  OS        Windows 11 + Arch WSL",
            "  Kernel    .NET 8/9",
            "  Uptime    3+ years",
            "  Shell     C# ASP.NET Core",
            "  Editor    VS Code + Neovim",
            "  Domain    Fintech Backend",
            "  Location  Luzon, PH",
          ]
          info.forEach((line, i) => {
            const t = setTimeout(() => {
              if (activeRef.current) addLine("output", line)
            }, i * 60)
            timers.current.push(t)
          })
          break
        }

        case "clear": {
          setLines([])
          break
        }

        case "date": {
          addLine("output", `  ${new Date().toString()}`)
          break
        }

        case "uptime": {
          const days = Math.floor(
            (Date.now() - new Date("2023-03-01").getTime()) / 86400000
          )
          addLine("output", `  Uptime: ${days} days`)
          addLine("output", "  Status:  ONLINE")
          addLine("output", "  Load:    8 sections, 0 failures")
          break
        }

        case "ping": {
          addLine("output", "  PONG 127.0.0.1 — seq=1 ttl=64 time=0.42ms")
          addLine("output", "  Connection to portfolio is alive.")
          break
        }

        case "sudo": {
          addLine("output", "  [sudo] password for nathan:")
          const t = setTimeout(() => {
            if (activeRef.current) TRY_SUDO.forEach((l) => addLine("output", l))
          }, 800)
          timers.current.push(t)
          break
        }

        case "theme": {
          addLine(
            "output",
            [
              "  Accent     #00ff41  (primary green)",
              "  Accent-2   #00d4ff  (cyan)",
              "  Accent-3   #ff3e00  (orange)",
              "  Accent-4   #7b61ff  (purple)",
              "  Text       #e0e0e0",
              "  BG         #0a0a0a",
              "  Surface    #111111",
            ].join("\n")
          )
          break
        }

        case "history": {
          if (history.length === 0) {
            addLine("output", "  No commands in history.")
            break
          }
          const hist = history.map((h, i) => `  ${i + 1}  ${h}`).join("\n")
          addLine("output", hist)
          break
        }

        default: {
          addLine(
            "output",
            `  command not found: ${command}. Type 'help'.`
          )
        }
      }
    },
    [addLine, history, scrollToSection]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(input)
      setInput("")
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (history.length === 0) return
      const idx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1)
      setHistoryIdx(idx)
      setInput(history[idx])
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIdx === -1) return
      if (historyIdx === history.length - 1) {
        setHistoryIdx(-1)
        setInput("")
      } else {
        const idx = historyIdx + 1
        setHistoryIdx(idx)
        setInput(history[idx])
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === "l") {
      e.preventDefault()
      setLines([])
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[9999] h-[45dvh] md:h-[40dvh] bg-[#0a0a0a] border-t border-border-accent shadow-2xl font-mono flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-1 border-b border-border shrink-0 bg-surface/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-3" />
              <span className="w-2.5 h-2.5 rounded-full bg-accent-2" />
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="text-[10px] tracking-[0.3em] text-text-muted uppercase ml-2 select-none">
                COMMAND TERMINAL
              </span>
            </div>
            <button
              onClick={() => {
                visibleRef.current = false
                setVisible(false)
              }}
              className="text-text-dim hover:text-white transition-colors text-xs tracking-widest cursor-pointer"
              aria-label="Close terminal"
            >
              [×]
            </button>
          </div>

          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-4 py-2 text-xs leading-relaxed"
          >
            {lines.map((line) => (
              <div
                key={line.id}
                className={`whitespace-pre-wrap ${
                  line.type === "input"
                    ? "text-accent"
                    : line.type === "system"
                      ? "text-text-muted"
                      : "text-text"
                }`}
              >
                {line.content}
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-border shrink-0 bg-surface/80 flex items-center gap-2">
            <span className="text-accent text-xs shrink-0 select-none">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="type 'help'..."
              className="flex-1 bg-transparent text-xs text-white outline-none placeholder-text-muted/50"
              spellCheck={false}
              autoComplete="off"
            />
            <span className="text-accent text-xs animate-pulse select-none">█</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
