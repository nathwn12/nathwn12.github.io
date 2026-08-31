import type { ReactNode } from "react"

interface TerminalWindowProps {
  title: string
  children: ReactNode
  statusBar?: ReactNode
}

const dots = [
  { color: "bg-accent-3", label: "close" },
  { color: "bg-accent-2", label: "minimize" },
  { color: "bg-accent", label: "maximize" },
] as const

export function TerminalWindow({ title, children, statusBar }: TerminalWindowProps) {
  return (
    <div className="border border-border-accent bg-surface">
      <div className="terminal-titlebar">
        {dots.map((dot) => (
          <span key={dot.label} className={`terminal-dot ${dot.color}`} />
        ))}
        <span className="text-[10px] tracking-[0.3em] text-text-muted ml-2 uppercase">
          {title}
        </span>
      </div>
      {children}
      {statusBar && (
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border-accent bg-surface text-[10px] tracking-widest text-text-muted">
          {statusBar}
        </div>
      )}
    </div>
  )
}
