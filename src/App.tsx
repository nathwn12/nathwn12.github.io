import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LoadingScreen } from "./components/LoadingScreen"
import { BackgroundEffects } from "./components/BackgroundEffects"
import { SectionWrapper } from "./components/SectionWrapper"
import { Header } from "./components/Header"
import { Hero } from "./components/Hero"
import { About } from "./components/About"
import { Experience } from "./components/Experience"
import { Footprint } from "./components/Footprint"
import { Skills } from "./components/Skills"
import Projects from "./components/Projects"
import Education from "./components/Education"
import { Contact } from "./components/Contact"
import { Footer } from "./components/Footer"

function GroupDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2 select-none">
      <div className="flex-1 h-[1px] bg-gradient-to-r from-border via-border-accent to-border" />
      <span className="text-[8px] tracking-[0.5em] text-border-accent font-mono">{label}</span>
      <div className="flex-1 h-[1px] bg-gradient-to-r from-border via-border-accent to-border" />
    </div>
  )
}

export default function App() {
  const [booted, setBooted] = useState(false)
  const onComplete = useCallback(() => setBooted(true), [])

  return (
    <div className="bg-bg min-h-screen font-mono relative screen-flicker">
      <div className="scanline-overlay" />
      <div className="noise-overlay" />
      <div className="scanline-sweep" />
      <div className="crt-curvature" />
      <div className="interference-wave" />
      <div className="interference-wave" />

      <BackgroundEffects />

      <AnimatePresence>
        {!booted && <LoadingScreen onComplete={onComplete} />}
      </AnimatePresence>

      {booted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Header />
          <main className="relative z-10">
            {/* Group 1: System Splash — Hero */}
            <div className="relative">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-accent/5 to-transparent opacity-30" />
              <SectionWrapper direction="scale">
                <div id="hero"><Hero /></div>
              </SectionWrapper>
            </div>

            <GroupDivider label="╤╤╤ SYSTEM INFO ╤╤╤" />

            {/* Group 2: System Info — About + Experience */}
            <div className="relative">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-accent/5 via-transparent to-accent/5 opacity-20" />
              <SectionWrapper direction="phosphor-fade" delay={0.05} scrollThreshold={0.05}>
                <div id="about"><About /></div>
              </SectionWrapper>
              <SectionWrapper direction="phosphor-fade" delay={0.1} scrollThreshold={0.05}>
                <div id="experience"><Experience /></div>
              </SectionWrapper>
            </div>

            <GroupDivider label="╤╤╤ DIAGNOSTICS ╤╤╤" />

            {/* Group 3: Diagnostics — Footprint + Skills */}
            <div className="relative">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-accent-2/5 via-transparent to-accent-3/5 opacity-20" />
              <SectionWrapper direction="crt-wipe" delay={0.05}>
                <div id="footprint"><Footprint /></div>
              </SectionWrapper>
              <SectionWrapper direction="crt-wipe" delay={0.1}>
                <div id="skills"><Skills /></div>
              </SectionWrapper>
            </div>

            <GroupDivider label="╤╤╤ FILE EXPLORER ╤╤╤" />

            {/* Group 4: File Explorer — Projects */}
            <div className="relative">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-accent-4/5 via-transparent to-accent-4/5 opacity-20" />
              <SectionWrapper direction="buffer-flip" delay={0.05}>
                <div id="projects"><Projects /></div>
              </SectionWrapper>
            </div>

            <GroupDivider label="╤╤╤ HISTORY ╤╤╤" />

            {/* Group 5: History + Contact — Education + Contact */}
            <div className="relative">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-accent-2/5 via-transparent to-accent-2/5 opacity-20" />
              <SectionWrapper direction="resolution-bump" delay={0.05}>
                <div id="education"><Education /></div>
              </SectionWrapper>
              <SectionWrapper direction="buffer-flip" delay={0.1}>
                <div id="contact"><Contact /></div>
              </SectionWrapper>
            </div>
          </main>
          <Footer />
        </motion.div>
      )}
    </div>
  )
}
