import { motion } from "framer-motion";

export function Footprint() {
  return (
    <section id="footprint" className="py-24 md:py-32 px-4 lg:px-8 border-t border-border">
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
            du -sh footprint/
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="border border-border-accent bg-surface p-6 md:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] tracking-widest text-text-muted mb-1">2023 – 2026</p>
                <h3 className="text-lg font-bold text-white">Delivery by year</h3>
              </div>
              <span className="text-[10px] tracking-widest text-accent px-3 py-1 border border-accent/30">
                1,182 TOTAL COMMITS
              </span>
            </div>

            <div className="space-y-3">
              {[
                { year: "2023", count: "245", desc: "First tracked backend delivery year." },
                { year: "2024", count: "495", desc: "Highest output across core fintech services." },
                { year: "2025", count: "412", desc: "Strong sustained delivery across payments and controls." },
                { year: "2026", count: "30", desc: "Latest visible pushed work before portfolio handoff." },
              ].map((item) => (
                <div key={item.year} className="flex items-center gap-4 p-3 border border-border hover:border-accent/30 transition-colors duration-300">
                  <span className="text-2xl font-bold text-accent tabular-nums w-16 shrink-0">
                    {item.count}
                  </span>
                  <div>
                    <span className="text-[10px] tracking-widest text-text-muted">{item.year}</span>
                    <p className="text-xs text-text-dim">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08, duration: 0.4 }}
            className="border border-border-accent bg-surface p-6 md:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] tracking-widest text-text-muted mb-1">CORE SYSTEMS</p>
                <h3 className="text-lg font-bold text-white">Where most delivery landed</h3>
              </div>
              <span className="text-[10px] tracking-widest text-accent-2 px-3 py-1 border border-accent-2/30">
                17 REPOS
              </span>
            </div>

            <div className="space-y-2">
              {[
                { name: "Payment Processing API", count: "844", period: "Jul 2023 – Mar 2026" },
                { name: "Cash Management Service", count: "78", period: "Dec 2023 – Dec 2025" },
                { name: "Teller Integration Platform", count: "68", period: "Dec 2024 – Sep 2025" },
                { name: "Access Control Microservice", count: "48", period: "Mar 2024 – Dec 2025" },
                { name: "Supporting Systems", count: "144", period: "Merchant integrations, compliance, reporting" },
              ].map((repo) => (
                <div
                  key={repo.name}
                  className="flex items-center justify-between p-3 border-b border-border last:border-0 hover:bg-accent/5 transition-colors duration-300"
                >
                  <div>
                    <p className="text-sm text-white">{repo.name}</p>
                    <p className="text-[10px] text-text-muted">{repo.period}</p>
                  </div>
                  <span className="text-lg font-bold text-accent-2 tabular-nums">{repo.count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mt-6 border border-border-accent bg-surface p-6 md:p-8"
        >
          <div className="flex items-start gap-4">
            <span className="text-accent-3 text-lg shrink-0">◆</span>
            <div>
              <p className="text-sm font-bold text-white mb-2">Preserved evidence</p>
              <p className="text-xs text-text-dim mb-3">
                Recovered from 21 scanned internal repositories after Xentra closed in May 2026.
                The original company repositories and work GitHub account are no longer publicly accessible.
                This shows sustained backend delivery across multiple release cycles.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] px-2 py-1 border border-border-accent text-text-muted">
                  SOURCE: xentra-nathanladero
                </span>
                <span className="text-[10px] px-2 py-1 border border-border-accent text-text-muted">
                  1,182 COMMITS
                </span>
                <span className="text-[10px] px-2 py-1 border border-border-accent text-text-muted">
                  17 REPOS MATCHED
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
