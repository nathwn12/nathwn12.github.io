import { motion } from "framer-motion";
import { cn } from "../lib/cn";
import type { Certification } from "../types/models";
import { TerminalWindow } from "./TerminalWindow";

interface TimelineItem {
  year: string;
  label: string;
  school: string;
  desc: string;
  dotClass: string;
  textClass: string;
}

const timeline: TimelineItem[] = [
  {
    year: "2017",
    label: "STEM STRAND",
    school: "La Consolacion University Philippines",
    desc: "Science, Technology, Engineering and Mathematics · 2017–2019",
    dotClass: "bg-accent-4",
    textClass: "text-accent-4",
  },
  {
    year: "2019",
    label: "BS INFORMATION TECHNOLOGY",
    school: "La Consolacion University Philippines",
    desc: "Bachelor of Science in Information Technology · 2019–2023",
    dotClass: "bg-accent-2",
    textClass: "text-accent-2",
  },
  {
    year: "2023",
    label: "CERTIFICATIONS WAVE",
    school: "Coursera · APIsec University",
    desc: "Google IT Automation with Python · Google IT Support · API Security Fundamentals · OWASP API Security Top 10",
    dotClass: "bg-accent",
    textClass: "text-accent",
  },
];

const certifications: Certification[] = [
  {
    title: "Google IT Automation with Python",
    issuer: "Coursera",
    id: "RFS2G5ZT9GPK",
    url: "https://www.coursera.org/share/3ca99757aef54a931fa0ffdafd7e6a04",
  },
  {
    title: "Google IT Support",
    issuer: "Coursera",
    id: "NEBB575RT5LU",
    url: "https://www.coursera.org/share/0ed5c57a2de3e858c4629cc9f209b99f",
  },
  {
    title: "API Security Fundamentals",
    issuer: "APIsec University",
    date: "Aug 2023",
    id: "FA69CEB39205E003",
    url: "https://www.credly.com/badges/66cf7672-0ef2-4f94-8e17-b3bc6263b364/public_url",
  },
  {
    title: "OWASP API Security Top 10",
    issuer: "APIsec University",
    date: "Aug 2023",
    id: "FC46A72A0806A19E",
    url: "https://www.credly.com/badges/8aeb5515-665f-4c0a-bfe6-640c314f1311/public_url",
  },
];

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
          className="flex items-center gap-4 mb-12"
        >
          <span className="text-accent-2 text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            cat education.md
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <TerminalWindow title="education.md">
          <div className="border border-border-accent bg-bg p-6 md:p-8 mb-12">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[10px] tracking-widest text-accent">
                [EDUCATION TIMELINE]
              </span>
              <div className="flex-1 h-[1px] bg-border" />
            </div>

            <div className="space-y-0">
              {timeline.map((item, i) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: i * 0.1,
                    duration: 0.35,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative flex gap-4 md:gap-6 pb-6 last:pb-0"
                >
                  <div className="flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.25 }}
                      className={cn("w-3 h-3 rounded-full z-10", item.dotClass)}
                    />
                    {i < timeline.length - 1 && (
                      <div className="flex-1 w-[1px] bg-border-accent mt-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 -mt-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className={cn(
                          "text-xs font-bold tracking-wider",
                          item.textClass,
                        )}
                      >
                        {item.year}
                      </span>
                      <span className="text-xs font-bold text-text">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-dim mb-1">
                      {item.school}
                    </p>
                    <p className="text-[10px] text-text-muted">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-4 mb-8"
          >
            <span className="text-accent-4 text-sm">$</span>
            <span className="text-xs tracking-[0.4em] text-text-dim">
              ls certs/
            </span>
            <div className="flex-1 h-[1px] bg-border" />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-px bg-border-accent border border-border-accent">
            {certifications.map((cert, i) => (
              <motion.a
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                href={cert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-bg p-6 md:p-8 group hover:bg-accent/5 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <motion.span
                    whileHover={{ scale: 1.2, rotate: 90 }}
                    className="text-accent-3 text-lg font-mono leading-none"
                  >
                    #
                  </motion.span>
                  <div>
                    <p className="text-sm font-bold text-text group-hover:text-accent transition-colors duration-300">
                      {cert.title}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {cert.issuer}
                      {cert.date ? ` · ${cert.date}` : ""}
                    </p>
                    <p className="text-[9px] font-mono text-text-muted/70 mt-1">
                      {cert.id}
                    </p>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </TerminalWindow>
      </div>
    </section>
  );
}
