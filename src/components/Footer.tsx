export function Footer() {
  return (
    <footer className="py-10 px-4 lg:px-8 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="overflow-hidden mb-8 opacity-20">
          <div className="marquee-track whitespace-nowrap text-[10px] tracking-[0.3em] text-text-dim uppercase">
            {Array(4)
              .fill(
                "NATHANIEL NIKOLAI LADERO — BACKEND DEVELOPER — C# ASP.NET CORE — FINTECH SYSTEMS — OPEN TO WORK — "
              )
              .join("")}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-dim">
          <div className="flex items-center gap-4">
            <span className="w-2 h-2 rounded-full bg-accent pulse-dot inline-block" />
            <span>CONNECTION STABLE</span>
          </div>
          <div>
            NNL · {new Date().getFullYear()} · HAGONOY, BULACAN, PH
          </div>
          <div className="font-mono text-text-dim/50">
            <a href="https://github.com/nathwn12" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              github/nathwn12
            </a>
            <span className="mx-2">·</span>
            <a href="https://www.linkedin.com/in/nathaniel-nikolai-l-184181261/" target="_blank" rel="noopener noreferrer" className="hover:text-accent-2 transition-colors">
              linkedin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
