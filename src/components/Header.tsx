/**
 * Header — static anchor nav for one page. No router, no animation.
 */
export function Header() {
  const link =
    "inline-flex min-h-[44px] min-w-[44px] items-center px-3 text-[0.875rem] font-medium text-[#111111] hover:text-[#0B57D0] hover:underline underline-offset-4";
  return (
    <header className="border-b border-[#767676] bg-[#FFFFFF]">
      <div className="mx-auto flex w-full max-w-[720px] flex-wrap items-center justify-between gap-x-6 px-4">
        <a
          href="#top"
          className="inline-flex min-h-[44px] items-center text-[1rem] font-semibold text-[#111111] hover:text-[#0B57D0]"
        >
          Nathaniel Nikolai Ladero
        </a>
        <nav aria-label="Sections" className="flex flex-wrap items-center">
          <a href="#work" className={link}>
            Work
          </a>
          <a href="#how" className={link}>
            Process
          </a>
          <a href="#about" className={link}>
            About
          </a>
          <a href="#contact" className={link}>
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
