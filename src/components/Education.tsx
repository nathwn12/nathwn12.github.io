import { motion } from "framer-motion";

export function Education() {
  return (
    <section id="education" className="py-24 md:py-32 px-4 lg:px-8 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-12"
        >
          <span className="text-accent-2 text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            cat education.md
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <div className="border border-border-accent bg-surface p-6 md:p-8 mb-12">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-[10px] tracking-widest text-accent">[EDUCATION TIMELINE]</span>
            <div className="flex-1 h-[1px] bg-border" />
          </div>

          <div className="space-y-0">
            {[
              {
                year: "2017",
                label: "STEM STRAND",
                school: "La Consolacion University Philippines",
                desc: "Science, Technology, Engineering, and Mathematics",
                dotColor: "#7b61ff",
                textColor: "text-accent-4",
              },
              {
                year: "2019",
                label: "B.S. INFORMATION TECHNOLOGY",
                school: "La Consolacion University Philippines",
                desc: "Bachelor of Science in Information Technology",
                dotColor: "#00d4ff",
                textColor: "text-accent-2",
              },
              {
                year: "2023",
                label: "PROFESSIONAL DEPLOYMENT",
                school: "Xentra Infotech Solutions, Inc.",
                desc: "Backend Developer — Fintech Systems",
                dotColor: "#00ff41",
                textColor: "text-accent",
              },
            ].map((item, i) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.4 }}
                className="relative flex gap-4 md:gap-6 pb-6 last:pb-0"
              >
                <div className="flex flex-col items-center">
                  <div
                    className="w-3 h-3 rounded-full z-10"
                    style={{ backgroundColor: item.dotColor }}
                  />
                  {i < 2 && <div className="flex-1 w-[1px] bg-border-accent mt-1" />}
                </div>
                <div className="flex-1 min-w-0 -mt-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-xs font-bold tracking-wider ${item.textColor}`}>
                      {item.year}
                    </span>
                    <span className="text-xs font-bold text-white">{item.label}</span>
                  </div>
                  <p className="text-[11px] text-text-dim mb-1">{item.school}</p>
                  <p className="text-[10px] text-text-muted">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-8"
        >
          <span className="text-accent-4 text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            ls certs/
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-px bg-border-accent border border-border-accent">
          <motion.a
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            href="https://www.credly.com/badges/66cf7672-0ef2-4f94-8e17-b3bc6263b364/public_url"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-bg p-6 md:p-8 group hover:bg-accent/5 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <span className="text-accent-3 text-lg group-hover:scale-110 transition-transform duration-300">🏅</span>
              <div>
                <p className="text-sm font-bold text-white group-hover:text-accent transition-colors duration-300">
                  API Security Fundamentals
                </p>
                <p className="text-[10px] text-text-muted">APIsec University · Aug 2023 · FA69CEB39205E003</p>
              </div>
            </div>
          </motion.a>

          <motion.a
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            href="https://www.credly.com/badges/8aeb5515-665f-4c0a-bfe6-640c314f1311/public_url"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-bg p-6 md:p-8 group hover:bg-accent/5 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <span className="text-accent-3 text-lg group-hover:scale-110 transition-transform duration-300">🏅</span>
              <div>
                <p className="text-sm font-bold text-white group-hover:text-accent transition-colors duration-300">
                  OWASP API Security Top 10
                </p>
                <p className="text-[10px] text-text-muted">APIsec University · Aug 2023 · FC46A72A0806A19E</p>
              </div>
            </div>
          </motion.a>
        </div>
      </div>
    </section>
  );
}
