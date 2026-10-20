/**
 * HowIWork — 3 steps, one line each.
 */
export function HowIWork() {
  return (
    <section aria-labelledby="how-heading" className="px-4 py-16">
      <div className="mx-auto w-full max-w-[720px]">
        <p className="mono-accent">how i work</p>
        <h2 id="how-heading" className="mt-4 max-w-[66ch]">
          How I work stays small
        </h2>
        <ol className="mt-8 space-y-4">
          <li className="max-w-[66ch] text-[1rem] leading-[1.5]">
            1. Read production first, then decide what to change.
          </li>
          <li className="max-w-[66ch] text-[1rem] leading-[1.5]">
            2. Ship the smallest verifiable slice, then measure it.
          </li>
          <li className="max-w-[66ch] text-[1rem] leading-[1.5]">
            3. Leave the runbook behind so the team keeps it.
          </li>
        </ol>
      </div>
    </section>
  );
}
