import { CASES } from "../content/cases";

/**
 * SelectedWork — 4 outcome-first cases in the guideline's field order.
 * No stack badges, no install lines, no versions. One link per case.
 */
export function SelectedWork() {
  return (
    <section aria-labelledby="work-heading" className="px-4 py-16">
      <div className="mx-auto w-full max-w-[720px]">
        <p className="mono-accent">selected work</p>
        <h2 id="work-heading" className="mt-4 max-w-[66ch]">
          Selected work ships outcomes
        </h2>
        <ol className="mt-8 space-y-8">
          {CASES.map((c, index) => (
            <li
              key={c.id}
              className="border-t border-[#767676] pt-8"
              data-case={c.id}
            >
              <h3 className="max-w-[66ch]">
                {String(index + 1).padStart(2, "0")} — {c.title}
              </h3>
              <p className="mt-4 max-w-[66ch] text-[1rem] leading-[1.5]">
                {c.whatItIs}
              </p>
              <p className="mt-2 max-w-[66ch] text-[1rem] leading-[1.5] text-[#595959]">
                {c.whoFor}
              </p>
              <p className="mt-2 max-w-[66ch] text-[1rem] leading-[1.5]">
                Hard part: {c.hardPart}
              </p>
              <ol className="mt-4 max-w-[66ch] list-decimal space-y-2 pl-6 text-[1rem] leading-[1.5]">
                {c.shipped.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <p className="mt-4 max-w-[66ch] text-[0.875rem] leading-[1.45] text-[#595959]">
                {c.took}
              </p>
              <p className="mt-2">
                <a
                  href={c.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center text-[1rem] font-semibold text-[#0B57D0] underline underline-offset-4 hover:text-[#111111]"
                >
                  {c.linkLabel}
                </a>
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-[66ch] text-[0.875rem] leading-[1.45] text-[#595959]">
          Setup guides and source live on GitHub. This page shows the
          outcomes, not the setup.
        </p>
      </div>
    </section>
  );
}
