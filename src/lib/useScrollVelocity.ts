import { useRef, useEffect, useState } from "react"

interface ScrollState {
  velocity: number
  direction: "up" | "down" | "idle"
  isScrolling: boolean
}

export function useScrollVelocity(): ScrollState {
  const [state, setState] = useState<ScrollState>({ velocity: 0, direction: "idle", isScrolling: false })
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function onScroll() {
      const now = performance.now()
      const dt = now - lastTime.current
      if (dt < 50) return

      const dy = window.scrollY - lastY.current
      const vel = Math.abs(dy / dt) * 1000

      lastY.current = window.scrollY
      lastTime.current = now

      setState({
        velocity: Math.min(vel, 5000),
        direction: dy > 0 ? "down" : dy < 0 ? "up" : "idle",
        isScrolling: true,
      })

      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        setState((prev) => ({ ...prev, isScrolling: false, direction: "idle", velocity: 0 }))
      }, 300)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [])

  return state
}
