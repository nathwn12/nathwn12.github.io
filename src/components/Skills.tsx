import { motion } from "framer-motion";

const skillCategories = [
  {
    category: "BACKEND CORE",
    skills: [
      { name: "C#", level: 95 },
      { name: "ASP.NET CORE", level: 93 },
      { name: ".NET 6/7/8/9", level: 92 },
      { name: "REST APIs", level: 94 },
      { name: "MICROSERVICES", level: 88 },
    ],
  },
  {
    category: "DATABASES & STORAGE",
    skills: [
      { name: "MYSQL", level: 90 },
      { name: "POSTGRESQL", level: 85 },
      { name: "SQL SERVER", level: 82 },
      { name: "MONGODB", level: 75 },
      { name: "REDIS", level: 78 },
    ],
  },
  {
    category: "PRODUCTION & SECURITY",
    skills: [
      { name: "AWS", level: 85 },
      { name: "DOCKER", level: 80 },
      { name: "JWT/OAUTH", level: 90 },
      { name: "SNYK", level: 85 },
      { name: "CI/CD", level: 82 },
    ],
  },
  {
    category: "TOOLS & RUNTIME",
    skills: [
      { name: "GIT", level: 95 },
      { name: "VS CODE", level: 93 },
      { name: "NEOVIM", level: 80 },
      { name: "LINUX", level: 82 },
      { name: "OPENAPI", level: 88 },
    ],
  },
];

function SkillBar({ name, level, index }: { name: string; level: number; index: number }) {
  const getBarColor = (lvl: number) => {
    if (lvl >= 90) return "bg-accent";
    if (lvl >= 80) return "bg-accent-2";
    if (lvl >= 70) return "bg-accent-3";
    return "bg-accent-4";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs tracking-wider text-text-dim group-hover:text-white transition-colors duration-300">
          {name}
        </span>
        <span className="text-[10px] text-text-muted tabular-nums">
          {level}%
        </span>
      </div>
      <div className="h-[2px] bg-border relative overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 + 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={`h-full ${getBarColor(level)} transition-all duration-500 relative`}
        >
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 + 1, duration: 0.3 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-accent"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

export function Skills() {
  return (
    <section id="skills" className="py-24 md:py-32 px-4 lg:px-8 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-12"
        >
          <span className="text-accent-3 text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            which skills
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-px bg-border-accent border border-border-accent">
          {skillCategories.map((cat, catIdx) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIdx * 0.1, duration: 0.5 }}
              className="bg-bg p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[10px] tracking-[0.3em] text-accent-3 font-bold">
                  [{cat.category}]
                </span>
                <div className="flex-1 h-[1px] bg-border" />
              </div>
              <div className="space-y-4">
                {cat.skills.map((skill, idx) => (
                  <SkillBar
                    key={skill.name}
                    name={skill.name}
                    level={skill.level}
                    index={catIdx * 5 + idx}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-16 overflow-hidden border-y border-border py-4 marquee-wrap"
        >
          <div className="flex whitespace-nowrap marquee-track">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-8 px-4">
                {[
                  "C#", "ASP.NET CORE", "MYSQL", "AWS", "DOCKER",
                  "JWT", "EF CORE", "POSTGRES", "REDIS", "GIT",
                  "LINUX", "OAUTH", "SNYK", "REST", "SWAGGER",
                ].map((tech) => (
                  <a
                    key={`${i}-${tech}`}
                    href="#skills"
                    className="text-xs tracking-[0.3em] text-border-accent hover:text-accent transition-colors duration-300 no-underline"
                  >
                    {tech}
                    <span className="text-border mx-4 pointer-events-none">◆</span>
                  </a>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
