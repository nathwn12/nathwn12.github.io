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
            SECTION 06 // EDUCATION
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-px bg-border-accent border border-border-accent mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-bg p-6 md:p-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-accent text-lg">◆</span>
              <div>
                <h3 className="text-base md:text-lg font-bold text-white">B.S. Information Technology</h3>
                <p className="text-xs text-accent-2">La Consolacion University Philippines</p>
                <p className="text-[10px] text-text-muted">2019 – 2023</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-bg p-6 md:p-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-accent-3 text-lg">◆</span>
              <div>
                <h3 className="text-base md:text-lg font-bold text-white">STEM Strand</h3>
                <p className="text-xs text-accent-2">La Consolacion University Philippines</p>
                <p className="text-[10px] text-text-muted">2017 – 2019</p>
              </div>
            </div>
          </motion.div>
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
            CERTIFICATIONS
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
