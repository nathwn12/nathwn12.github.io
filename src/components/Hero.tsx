import { navigate } from "../lib/router";

/**
 * Hero — brutalist restyle (DESIGN.md wins over code).
 *
 * Home-screen accent budget (DESIGN.md §2.3): the only accent owned by this
 * file is the `wget ./resume.pdf` primary action. The `$ whoami` prompt and
 * the `OPEN TO WORK` status are ink/concrete — state is weight, not hue. No
 * ambient glow, no grid overlay, no blinking caret, no nested cards —
 * hierarchy is size + weight + space.
 */

const profileFacts: { label: string; value: string; emphasis?: boolean }[] = [
  { label: "LOCATION", value: "HAGONOY, BULACAN, PH" },
  { label: "EXPERIENCE", value: "3 YEARS" },
  { label: "ROLE", value: "BACKEND DEVELOPER" },
  { label: "STATUS", value: "OPEN TO WORK", emphasis: true },
];

const systemFacts = [
  ["OS", "Ubuntu/Linux Servers / Docker"],
  ["Kernel", ".NET 6/7/8/9 / C#"],
  ["Packages", "17 repos · 1,182 commits"],
  ["Shell", "Bash / PowerShell"],
  ["AI Tools", "LM Studio / OpenCode / Codex"],
  ["Certs", "Google IT Support · IT Automation with Python"],
] as const;

export function Hero() {
  return (
    <section
      id="hero"
      className="min-h-full flex flex-col justify-center px-gutter"
    >
      <div className="mx-auto w-full max-w-5xl">
        {/* $ whoami — the page's prompt (section-header convention, §9) */}
        <p className="flex items-baseline gap-half text-label text-text-muted">
          <span>$</span>
          <span>whoami</span>
        </p>

        {/* Name — display ceiling (40px); wraps, never clips */}
        <h1 className="mt-block text-display font-bold text-text">
          <span className="block">NATHANIEL</span>
          <span className="block">NIKOLAI LADERO</span>
        </h1>

        {/* Role */}
        <p className="mt-half text-label uppercase tracking-[0.2em] text-text-dim">
          BACKEND DEVELOPER — 3 YRS PRODUCTION FINTECH
        </p>

        {/* Lead */}
        <p className="mt-block max-w-prose text-body-lg text-text-dim">
          Backend Developer with 3 years of production fintech experience.
          Builds C# and ASP.NET Core APIs, manages Ubuntu/Linux servers and
          Docker containers, and automates CI/CD with GitHub Actions.
        </p>

        {/* profile — a plain key/value list, one hairline row each (no cards) */}
        <div className="mt-section">
          <p className="flex items-baseline gap-half text-label text-text-muted">
            <span>$</span>
            <span>cat profile</span>
          </p>
          <dl className="mt-half border-t border-border-accent">
            {profileFacts.map((fact) => (
              <div
                key={fact.label}
                className="grid grid-cols-1 gap-half border-b border-border py-half sm:grid-cols-[8rem_1fr] sm:gap-gutter"
              >
                <dt className="text-micro uppercase tracking-[0.15em] text-text-muted">
                  {fact.label}
                </dt>
                <dd
                  className={
                    fact.emphasis
                      ? "text-body-lg font-bold text-text"
                      : "text-body-lg text-text"
                  }
                >
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* system.md — one surface split by a rule; no window wrapping a panel */}
        <div className="mt-section">
          <p className="flex items-baseline gap-half text-label text-text-muted">
            <span>$</span>
            <span>cat system.md</span>
          </p>
          <div className="mt-block grid gap-block border-t border-border-accent pt-block md:grid-cols-[1fr_2fr] md:gap-section">
            {/* neofetch facts */}
            <div>
              <p className="text-body text-text-dim">$ neofetch</p>
              <dl className="mt-half space-y-half border-t border-border pt-half">
                {systemFacts.map(([label, value]) => (
                  <div key={label} className="flex gap-half text-body">
                    <dt className="w-16 shrink-0 text-text-muted">{label}</dt>
                    <dd className="text-text">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* copy */}
            <div>
              <h2 className="text-headline font-bold text-text">
                Crafting reliable systems that scale under pressure.
              </h2>
              <p className="mt-block max-w-prose text-body-lg text-text-dim">
                Treats infrastructure as part of the codebase: Nginx configs,
                Bash scripts, and CI/CD pipelines receive the same rigor as
                application code.
              </p>
              <p className="mt-block max-w-prose text-body-lg text-text-dim">
                Daily AI tooling: LM Studio, OpenCode, and Codex, with
                preferred local models Qwen 3.8, DeepSeek V4 Flash, and Qwen
                3.5 (9B, 27B). English (professional), Filipino (native).
              </p>
            </div>
          </div>
        </div>

        {/* Resume — the one primary action */}
        <div className="mt-section flex items-baseline gap-half">
          <span className="text-label text-text-muted">$</span>
          <a
            href="Nathaniel-Nikolai-Ladero-Resume.pdf"
            download="Nathaniel-Nikolai-Ladero-Resume.pdf"
            className="text-body-lg text-accent-text underline-offset-4 hover:underline active:opacity-70"
          >
            wget ./resume.pdf
          </a>
          <span className="text-body-lg text-text-muted">↓</span>
        </div>

        {/* Page navigation hints */}
        <div className="mt-block flex items-center gap-block">
          <button
            type="button"
            disabled
            className="flex items-center gap-half text-label text-text-muted opacity-40 cursor-not-allowed"
          >
            <span>←</span>
            <span>PREV</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/experience")}
            className="flex items-center gap-half border-b border-transparent text-label text-text transition-colors duration-150 hover:border-border-accent active:border-border-accent"
          >
            <span>NEXT</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
