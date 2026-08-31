import { motion } from "framer-motion";
import { cn } from "../lib/cn";
import { TerminalWindow } from "./TerminalWindow";
import { certifications, credentialCount, milestoneCount, timeline } from "../content/education";

export default function Education() {
  return (
    <section
      id="education"
      className="py-8 md:py-12 px-4 lg:px-8 relative overflow-hidden"
    >
      <div
        className="section-ambient"
        style={{
          background: `
            radial-gradient(ellipse at 60% 30%, color-mix(in srgb, var(--color-accent-2) 8%, transparent) 0%, color-mix(in srgb, var(--color-accent-2) 2%, transparent) 40%, transparent 65%),
            radial-gradient(ellipse at 20% 70%, color-mix(in srgb, var(--color-accent-4) 3%, transparent) 0%, transparent 50%)
          `,
        }}
      />
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-4 mb-8 md:mb-10"
        >
          <span className="text-accent-2 text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            cat education.md
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <TerminalWindow title="education.md">
          <div className="border border-border-accent bg-bg">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 md:px-6 py-3 border-b border-border-accent">
              <span className="text-[10px] tracking-widest text-accent">
                [EDUCATION.MD]
              </span>
              <span className="text-[10px] text-text-muted">
                chronological record / 2017 - 2023
              </span>
              <span className="text-[10px] text-text-muted md:ml-auto">
                {milestoneCount} milestones / {credentialCount} credentials
              </span>
            </div>

            <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="p-5 md:p-7 lg:border-r lg:border-border-accent">
                <div className="flex items-center gap-3 mb-7">
                  <span className="text-[10px] tracking-widest text-accent-2">
                    [TIMELINE]
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-text-muted">
                    {milestoneCount} EVENTS
                  </span>
                </div>

                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute left-[0.3rem] top-2 bottom-2 w-px bg-border-accent"
                  />
                  <div className="space-y-7">
                    {timeline.map((item, i) => (
                      <motion.article
                        key={item.year}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: i * 0.08,
                          duration: 0.35,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="relative grid grid-cols-[0.75rem_minmax(0,1fr)] gap-4"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-1.5 h-2.5 w-2.5 rounded-full z-10",
                            item.dotClass,
                          )}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                            <span
                              className={cn(
                                "text-xs font-bold tracking-wider",
                                item.textClass,
                              )}
                            >
                              {item.year}
                            </span>
                            <h3 className="text-xs font-bold text-text">
                              {item.label}
                            </h3>
                          </div>
                          <p className="text-[11px] text-text-dim mb-1">
                            {item.school}
                          </p>
                          <p className="text-[10px] leading-relaxed text-text-muted">
                            {item.desc}
                          </p>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-7 bg-surface/40">
                <div className="flex items-center gap-3 mb-7">
                  <span className="text-[10px] tracking-widest text-accent-4">
                    [CREDENTIALS]
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-text-muted">
                    {credentialCount} LINKS
                  </span>
                </div>

                <div className="border-y border-border-accent">
                  {certifications.map((cert, i) => (
                    <motion.a
                      key={cert.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Verify ${cert.title}`}
                      className="group flex items-start gap-3 border-b border-border last:border-0 px-3 py-4 md:px-4 md:py-5 hover:bg-accent-4/[0.03] transition-colors duration-300"
                    >
                      <span className="pt-0.5 text-[10px] font-bold tabular-nums text-accent-3">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold leading-snug text-text break-words group-hover:text-accent transition-colors duration-300">
                          {cert.title}
                        </h3>
                        <p className="mt-1 text-[10px] text-text-muted">
                          {cert.issuer}
                          {cert.date ? ` · ${cert.date}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[10px] font-mono text-text-muted/70 break-all">
                            {cert.id}
                          </span>
                          <span className="text-[10px] tracking-wider text-accent-2">
                            [VERIFY LINK]
                          </span>
                        </div>
                      </div>
                      <span
                        aria-hidden="true"
                        className="pt-0.5 text-xs text-text-muted transition-colors duration-300 group-hover:text-accent"
                      >
                        -&gt;
                      </span>
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TerminalWindow>
      </div>
    </section>
  );
}
