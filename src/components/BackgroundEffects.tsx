import { useEffect, useRef } from "react"
import { useScrollVelocity } from "../lib/useScrollVelocity"

const FPS = 12
const INTERVAL = 1000 / FPS

const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>/{}[]|&^%$#@!"

function createDrops(width: number, height: number) {
  const cols = Math.floor(width / 18)
  return Array.from({ length: cols }, (_, i) => ({
    x: i * 18,
    y: Math.random() * height * -1,
    speed: 0.3 + Math.random() * 1.8,
    len: 8 + Math.floor(Math.random() * 22),
    chars: Array.from({ length: 30 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
  }))
}

export function BackgroundEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dropsRef = useRef<ReturnType<typeof createDrops>>([])
  const mouseRef = useRef(0)
  const scrollRef = useRef({ isScrolling: false, velocity: 0 })
  const visibleRef = useRef(true)

  const { isScrolling, velocity } = useScrollVelocity()
  scrollRef.current = { isScrolling, velocity }

  useEffect(() => {
    function onMouse(e: MouseEvent) {
      mouseRef.current = e.clientX
    }
    window.addEventListener("mousemove", onMouse, { passive: true })
    return () => window.removeEventListener("mousemove", onMouse)
  }, [])

  useEffect(() => {
    function onVisibility() {
      visibleRef.current = document.visibilityState === "visible"
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    dropsRef.current = createDrops(canvas.width, canvas.height)

    let animId: number
    let lastTime = 0
    let gridOffset = 0
    let interferePhase = 0

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      dropsRef.current = createDrops(canvas.width, canvas.height)
    }
    window.addEventListener("resize", resize)

    function tick(time: number) {
      const delta = time - lastTime
      if (delta < INTERVAL) {
        animId = requestAnimationFrame(tick)
        return
      }
      lastTime = time - (delta % INTERVAL)

      if (!canvas || !ctx) return
      if (!visibleRef.current) {
        animId = requestAnimationFrame(tick)
        return
      }

      const { isScrolling: scrollActive, velocity: vel } = scrollRef.current
      const speedMultiplier = scrollActive ? 1 + vel / 3000 : 1
      const fadeAlpha = scrollActive ? 0.08 : 0.06

      ctx.fillStyle = `rgba(10, 10, 10, ${fadeAlpha})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = "12px monospace"
      const drops = dropsRef.current
      for (const drop of drops) {
        const fadeIn = Math.min(1, (drop.y + 50) / 150)
        if (fadeIn <= 0) {
          drop.y += drop.speed * 1.2 * speedMultiplier
          continue
        }

        const headBright = Math.min(1, 0.2 + (drop.y / canvas.height) * 0.8)
        ctx.fillStyle = `rgba(0, 255, 65, ${headBright * 0.7})`
        const headChar = drop.chars[Math.floor(Math.random() * drop.chars.length)]
        ctx.fillText(headChar, drop.x, drop.y)

        for (let j = 1; j < drop.len; j++) {
          const trailY = drop.y - j * 14
          if (trailY < 0) break
          const trailAlpha = Math.max(0, 0.5 - j / drop.len) * fadeIn * 0.5
          ctx.fillStyle = `rgba(0, 255, 65, ${trailAlpha})`
          const trailChar = drop.chars[Math.floor(Math.random() * drop.chars.length)]
          ctx.fillText(trailChar, drop.x, trailY)
        }

        drop.y += drop.speed * 1.2 * speedMultiplier
        if (drop.y - drop.len * 14 > canvas.height + 20) {
          drop.y = -20 - Math.random() * 100
          drop.speed = 0.3 + Math.random() * 1.8
          drop.len = 8 + Math.floor(Math.random() * 22)
        }
      }

      const gx = window.innerWidth / 2
      const cursorOffset = ((mouseRef.current - gx) / gx) * 15

      gridOffset = (gridOffset + 0.15 * speedMultiplier) % 40
      ctx.strokeStyle = "rgba(0, 255, 65, 0.025)"
      ctx.lineWidth = 1
      const cx = canvas.width / 2 + cursorOffset

      for (let i = -25; i <= 25; i += 2) {
        ctx.beginPath()
        const x = cx + i * 14
        ctx.moveTo(cx, canvas.height * 0.35)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let i = 0; i < 24; i++) {
        ctx.beginPath()
        const t = i / 24
        const y = canvas.height * 0.35 + (canvas.height * 0.65) * t
        const spread = t * canvas.width * 0.6
        ctx.moveTo(cx - spread, y)
        ctx.lineTo(cx + spread, y)
        ctx.stroke()
      }

      interferePhase = (interferePhase + 0.3 * speedMultiplier) % 100
      const waveY = (interferePhase / 100) * canvas.height
      const waveGrad = ctx.createLinearGradient(0, waveY - 30, 0, waveY + 30)
      waveGrad.addColorStop(0, "rgba(0, 255, 65, 0)")
      waveGrad.addColorStop(0.5, `rgba(0, 255, 65, ${0.02 + (scrollActive ? 0.02 : 0)})`)
      waveGrad.addColorStop(1, "rgba(0, 255, 65, 0)")
      ctx.fillStyle = waveGrad
      ctx.fillRect(0, waveY - 30, canvas.width, 60)

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[1] pointer-events-none"
      aria-hidden="true"
    />
  )
}
