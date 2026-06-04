import { motion, type Variants } from "framer-motion"
import { useRef } from "react"

type Direction = "left" | "right" | "up" | "down" | "scale" | "fade"

interface SectionWrapperProps {
  children: React.ReactNode
  direction?: Direction
  delay?: number
  className?: string
  scrollThreshold?: number
}

const variants: Record<Direction, Variants> = {
  left: {
    hidden: { opacity: 0, x: -60, filter: "blur(4px)" },
    visible: { opacity: 1, x: 0, filter: "blur(0px)" },
  },
  right: {
    hidden: { opacity: 0, x: 60, filter: "blur(4px)" },
    visible: { opacity: 1, x: 0, filter: "blur(0px)" },
  },
  up: {
    hidden: { opacity: 0, y: 60, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  down: {
    hidden: { opacity: 0, y: -60, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95, filter: "blur(4px)" },
    visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
} as const

const durationMap: Record<Direction, number> = {
  left: 0.7,
  right: 0.7,
  up: 0.7,
  down: 0.7,
  scale: 0.8,
  fade: 0.5,
}

export function SectionWrapper({ children, direction = "up", delay = 0, className = "", scrollThreshold = 0.1 }: SectionWrapperProps) {
  const ref = useRef(null)

  return (
    <motion.div
      ref={ref}
      variants={variants[direction]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: scrollThreshold }}
      transition={{
        duration: durationMap[direction],
        delay,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
