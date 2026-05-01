import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingScreen } from "./components/LoadingScreen";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Experience } from "./components/Experience";
import { Footprint } from "./components/Footprint";
import { Skills } from "./components/Skills";
import { Projects } from "./components/Projects";
import { Education } from "./components/Education";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";

export default function App() {
  const [booted, setBooted] = useState(false);
  const onComplete = useCallback(() => setBooted(true), []);

  return (
    <div className="bg-bg min-h-screen font-mono relative screen-flicker">
      <div className="scanline-overlay" />
      <div className="noise-overlay" />

      <AnimatePresence>
        {!booted && <LoadingScreen onComplete={onComplete} />}
      </AnimatePresence>

      {booted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Header />
          <main className="relative z-10">
            <div id="hero"><Hero /></div>
            <div id="about"><About /></div>
            <div id="experience"><Experience /></div>
            <div id="footprint"><Footprint /></div>
            <div id="skills"><Skills /></div>
            <div id="projects"><Projects /></div>
            <div id="education"><Education /></div>
            <div id="contact"><Contact /></div>
          </main>
          <Footer />
        </motion.div>
      )}
    </div>
  );
}
