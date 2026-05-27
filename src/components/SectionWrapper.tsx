import { motion, type Variants } from "framer-motion"
import { useRef } from "react"

type Direction = "left" | "right" | "up" | "down" | "scale" | "fade" | "perspective" | "crt-wipe" | "phosphor-fade" | "resolution-bump" | "buffer-flip"

interface SectionWrapperProps {
  children: React.ReactNode
  direction?: Direction
  delay?: number
  className?: string
  scrollThreshold?: number
}

const variants: Record<Direction, Variants> = {
  left: {
    hidden: { opacity: 0, x: -160, filter: "blur(6px)" },
    visible: { opacity: 1, x: 0, filter: "blur(0px)" },
  },
  right: {
    hidden: { opacity: 0, x: 160, filter: "blur(6px)" },
    visible: { opacity: 1, x: 0, filter: "blur(0px)" },
  },
  up: {
    hidden: { opacity: 0, y: 140, filter: "blur(6px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  down: {
    hidden: { opacity: 0, y: -140, filter: "blur(6px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8, filter: "blur(8px)" },
    visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  perspective: {
    hidden: { opacity: 0, rotateX: 20, y: 80, filter: "blur(4px)" },
    visible: { opacity: 1, rotateX: 0, y: 0, filter: "blur(0px)" },
  },
  "crt-wipe": {
    hidden: { clipPath: "inset(0 100% 0 0)" },
    visible: { clipPath: "inset(0 0 0 0)" },
  },
  "phosphor-fade": {
    hidden: { opacity: 0, filter: "brightness(2) saturate(0.3) sepia(1) hue-rotate(90deg)" },
    visible: { opacity: 1, filter: "brightness(1) saturate(1) sepia(0) hue-rotate(0deg)" },
  },
  "resolution-bump": {
    hidden: { opacity: 0, scale: 0.95, filter: "brightness(0.3) saturate(0.1)" },
    visible: { opacity: 1, scale: 1, filter: "brightness(1) saturate(1)" },
  },
  "buffer-flip": {
    hidden: { opacity: 0, scaleY: 0.01, filter: "blur(4px)" },
    visible: { opacity: 1, scaleY: 1, filter: "blur(0px)" },
  },
} as const

const durationMap: Record<Direction, number> = {
  left: 0.9,
  right: 0.9,
  up: 0.9,
  down: 0.9,
  scale: 1,
  fade: 0.6,
  perspective: 1,
  "crt-wipe": 1.2,
  "phosphor-fade": 1.5,
  "resolution-bump": 0.8,
  "buffer-flip": 1.1,
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
