import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const roles = [
  "BACKEND DEVELOPER",
  "API ARCHITECT",
  "FINTECH ENGINEER",
  "SYSTEMS BUILDER",
];

export function Hero() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const current = roles[roleIndex];
    let innerTimer: ReturnType<typeof setTimeout> | undefined;
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(current.slice(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
        if (charIndex + 1 === current.length) {
          innerTimer = setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setDisplayText(current.slice(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);
        if (charIndex - 1 === 0) {
          setIsDeleting(false);
          setRoleIndex((prev) => (prev + 1) % roles.length);
        }
      }
    }, isDeleting ? 40 : 80);
    return () => {
      clearTimeout(timeout);
      clearTimeout(innerTimer);
    };
  }, [charIndex, isDeleting, roleIndex]);

  return (
    <section id="hero" className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-accent/30" />
      <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-accent/30" />
      <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-accent/30" />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-accent/30" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] md:text-[20rem] font-bold text-[#111] select-none pointer-events-none leading-none tracking-tighter"
      >
        NNL
      </motion.div>

      <div className="relative z-10 px-4 lg:px-8 flex justify-center">
        <div className="max-w-5xl w-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-6 flex items-center gap-2"
          >
            <span className="text-accent text-sm">$</span>
            <span className="text-text-muted text-sm">whoami</span>
            <span className="cursor-blink text-accent text-sm">█</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter leading-[0.85] mb-8"
          >
            <span className="block text-white">NATHANIEL</span>
            <span className="block glitch-text text-accent glow-green" data-text="NIKOLAI LADERO">
              NIKOLAI LADERO
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="flex items-center gap-3 mb-10"
          >
            <div className="w-8 h-[2px] bg-accent" />
            <p className="text-sm md:text-base tracking-[0.3em] text-accent font-light">
              {displayText}
              <span className="cursor-blink">_</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border-accent border border-border-accent"
          >
            {[
              { label: "LOCATION", value: "HAGONOY, BULACAN" },
              { label: "EXPERIENCE", value: "3+ YEARS" },
              { label: "ROLE", value: "BACKEND DEV" },
              { label: "STATUS", value: "OPEN TO WORK" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-bg p-4 md:p-6 group hover:bg-accent/5 transition-colors duration-500"
              >
                <p className="text-[10px] tracking-[0.2em] text-text-muted mb-1">
                  {stat.label}
                </p>
                <p className="text-sm md:text-base font-bold text-white group-hover:text-accent transition-colors duration-300">
                  {stat.value}
                </p>
              </div>
            ))}
          </motion.div>

          <motion.a
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.4 }}
            href="Nathaniel-Nikolai-Ladero-Resume.pdf"
            download="Nathaniel-Nikolai-Ladero-Resume.pdf"
            className="mt-12 flex items-center gap-3 text-xs tracking-widest group cursor-pointer"
          >
            <span className="text-accent text-sm">$</span>
            <span className="text-text-dim group-hover:text-accent transition-colors duration-300">
              wget ./resume.pdf
            </span>
            <span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300">↓</span>
            <span className="cursor-blink text-accent text-sm">█</span>
          </motion.a>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9, duration: 0.4 }}
            className="mt-12 flex items-center gap-3 text-text-muted text-xs tracking-widest"
          >
            <div className="flex flex-col items-center gap-1">
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-[1px] h-8 bg-accent/40"
              />
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.15 }}
                className="w-[1px] h-8 bg-accent/20"
              />
            </div>
            <span>SCROLL TO EXPLORE</span>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.5em] text-border-accent"
        style={{ writingMode: "vertical-rl" }}
      >
        BACKEND.DEVELOPER.RESUME — BUILD 2026 — C# .NET FINTECH
      </motion.div>
    </section>
  );
}
