import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="py-24 md:py-32 px-4 lg:px-8">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-12"
        >
          <span className="text-accent text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            cat about.md
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <div className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="border border-border-accent bg-surface p-4 md:p-6 font-mono"
          >
            <div className="text-accent text-xs mb-3">$ neofetch</div>
            <div className="border-t border-border-accent pt-3 space-y-1.5">
              <div className="flex gap-2 text-xs">
                <span className="text-text-muted shrink-0 w-16">OS</span>
                <span className="text-white">Windows 11 / Arch WSL</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-text-muted shrink-0 w-16">Kernel</span>
                <span className="text-white">.NET 8/9 · ASP.NET Core</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-text-muted shrink-0 w-16">Uptime</span>
                <span className="text-accent">3+ years active</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-text-muted shrink-0 w-16">Packages</span>
                <span className="text-white">17 repos · 1,182 commits</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-text-muted shrink-0 w-16">Shell</span>
                <span className="text-accent-2">C# / ASP.NET Core</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-text-muted shrink-0 w-16">Editor</span>
                <span className="text-accent-3">VS Code / Neovim</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-text-muted shrink-0 w-16">Domain</span>
                <span className="text-accent-4">Fintech Backend</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-accent text-xs">$ </span>
              <span className="cursor-blink text-accent text-xs">█</span>
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
                Crafting reliable systems{" "}
                <span className="text-accent glow-green">
                  that scale
                </span>{" "}
                under pressure.
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-4 text-text-dim text-sm leading-relaxed"
            >
              <p>
                Backend Developer with 3+ years building secure backend systems for fintech
                applications. Strong in C# and ASP.NET Core, with hands-on ownership of APIs,
                databases, microservices, AWS-hosted services, and production releases.
              </p>
              <p>
                Strongest when owning backend delivery end to end: technical design, data
                modeling, implementation, API documentation, deployment support, and production issue resolution.
              </p>
              <p>
                Based in Hagonoy, Bulacan, Philippines — open to remote opportunities
                globally. Thrive in cross-functional teams and fast-moving environments where
                quality and velocity both matter.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="grid grid-cols-2 gap-px bg-border-accent border border-border-accent mt-8"
            >
              {[
                ["DEGREE", "B.S. Information Technology"],
                ["LANGUAGES", "EN, FIL"],
                ["STACK", "C#, ASP.NET Core"],
                ["EDITOR", "VS CODE / NEOVIM"],
              ].map(([label, value]) => (
                <div key={label} className="bg-bg px-4 py-3">
                  <span className="text-[10px] tracking-widest text-text-muted block mb-0.5">
                    {label}
                  </span>
                  <span className="text-xs text-white">{value}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
