/**
 * Hero — name, role, one outcome sentence, contact CTA.
 * Legible in five seconds: static text only, no typing loop, no fake shell.
 * The terminal identity is one restrained monospace eyebrow, not a prompt.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="px-4 pt-16 pb-16">
      <div className="mx-auto w-full max-w-[720px]">
        <p className="mono-accent">nathwn12 — portfolio</p>
        <h1 id="hero-heading" className="mt-4 max-w-[66ch]">
          Nathaniel Nikolai Ladero
        </h1>
        <p className="mt-2 max-w-[66ch] text-[1rem] leading-[1.5] font-semibold">
          Backend developer, fintech systems and developer tools.
        </p>
        <p className="mt-4 max-w-[66ch] text-[1rem] leading-[1.5]">
          I ship backends and tools that hold up in production, measured by
          what changed for the people who run them.
        </p>
        <p className="mt-6">
          <a
            href="#contact"
            className="inline-flex min-h-[44px] min-w-[44px] items-center rounded-sm px-6 text-[1rem] font-semibold text-[#0B57D0] underline underline-offset-4 hover:text-[#111111]"
          >
            Contact me about a role
          </a>
        </p>
      </div>
    </section>
  );
}
