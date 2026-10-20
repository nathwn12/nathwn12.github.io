import { FORKS, SECOND_TIER, VENUE_NOTE } from "../content/portfolio";

/**
 * SecondTier — collapsed own-work list + badged forks (B §4).
 *
 * Second tier: one-line list, linked, no cards. Forks sit below own work
 * because they borrow trust; each fork carries its badge wording verbatim
 * plus repo and upstream links, never implying ownership.
 */
export function SecondTier() {
  return (
    <section aria-labelledby="more-heading" className="mt-16">
      <h2 id="more-heading" className="text-headline font-semibold text-text">
        More
      </h2>

      <details className="mt-6 rounded-sm border border-border bg-surface">
        <summary
          data-nav-item
          className="flex min-h-11 cursor-pointer items-center px-4 text-label font-semibold text-text"
        >
          Second tier — eight smaller tools (one line each)
        </summary>
        <ul className="border-t border-border px-4 py-2">
          {SECOND_TIER.map((entry) => (
            <li
              key={entry.name}
              className="flex min-h-11 flex-wrap items-baseline gap-x-3 border-b border-border py-2 last:border-b-0"
            >
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                data-nav-item
                className="font-semibold text-accent-text hover:underline"
              >
                {entry.name}
              </a>
              <span className="text-detail text-text-muted">{entry.line}</span>
            </li>
          ))}
        </ul>
      </details>

      <details className="mt-4 rounded-sm border border-border bg-surface">
        <summary
          data-nav-item
          className="flex min-h-11 cursor-pointer items-center px-4 text-label font-semibold text-text"
        >
          Forks — kept below own work, badged honestly
        </summary>
        <ul className="border-t border-border px-4 py-2">
          {FORKS.map((fork) => (
            <li
              key={fork.name}
              className="border-b border-border py-3 last:border-b-0"
            >
              <p className="text-body font-semibold text-text">
                <span className="mr-2 rounded-xs border border-border px-2 py-0.5 text-detail text-text-muted">
                  {fork.badge}
                </span>
                {fork.name}
              </p>
              <p className="mt-1 text-detail text-text-muted">{fork.line}</p>
              <p className="mt-1 flex flex-wrap gap-x-6">
                <a
                  href={fork.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-nav-item
                  className="flex min-h-11 items-center text-label font-medium text-accent-text hover:underline"
                >
                  Fork repo
                </a>
                <a
                  href={fork.upstreamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-nav-item
                  className="flex min-h-11 items-center text-label font-medium text-accent-text hover:underline"
                >
                  Upstream
                </a>
              </p>
            </li>
          ))}
        </ul>
      </details>

      <p className="mt-6 max-w-[65ch] text-detail text-text-muted">
        {VENUE_NOTE}{" "}
        <a
          href="https://github.com/nathwn12/nathwn12.github.io"
          target="_blank"
          rel="noopener noreferrer"
          data-nav-item
          className="font-medium text-accent-text hover:underline"
        >
          Site repo
        </a>
      </p>
    </section>
  );
}
