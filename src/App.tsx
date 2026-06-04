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
import { CommandTerminal } from "./components/CommandTerminal"

export default function App() {
  const [booted, setBooted] = useState(false)
  const onComplete = useCallback(() => setBooted(true), [])

  return (
    <div className="bg-bg min-h-screen font-mono relative bg-grid">
      <a href="#hero" className="skip-to-content">Skip to content</a>

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
            <SectionWrapper direction="scale">
              <div id="hero"><Hero /></div>
            </SectionWrapper>

            <SectionWrapper direction="fade" delay={0.05} scrollThreshold={0.05}>
              <div id="about"><About /></div>
            </SectionWrapper>

            <SectionWrapper direction="fade" delay={0.1} scrollThreshold={0.05}>
              <div id="experience"><Experience /></div>
            </SectionWrapper>

            <SectionWrapper direction="up" delay={0.05}>
              <div id="footprint"><Footprint /></div>
            </SectionWrapper>

            <SectionWrapper direction="up" delay={0.1}>
              <div id="skills"><Skills /></div>
            </SectionWrapper>

            <SectionWrapper direction="up" delay={0.05}>
              <div id="projects"><Projects /></div>
            </SectionWrapper>

            <SectionWrapper direction="fade" delay={0.05}>
              <div id="education"><Education /></div>
            </SectionWrapper>

            <SectionWrapper direction="up" delay={0.1}>
              <div id="contact"><Contact /></div>
            </SectionWrapper>
          </main>
          <Footer />
          <CommandTerminal />
        </motion.div>
      )}
    </div>
  )
}
