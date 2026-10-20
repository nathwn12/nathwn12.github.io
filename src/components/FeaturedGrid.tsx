import { FEATURED, type FeaturedProject } from "../content/portfolio";
import { CopyButton } from "./CopyButton";

/**
 * FeaturedGrid — the 7 spec-ordered cards (B §2).
 *
 * Card anatomy, exact field order: name + one-line what-it-is, for-line,
 * install code block (only if stranger-installable) else the honest
 * source-only label, built-with line, two links max (repo, docs/demo).
 * No shields on B. Each card carries a small terminal preview instead of a
 * screenshot (no new image weight; ≤150KB floor holds trivially).
 */
function FeaturedCard({ project }: { project: FeaturedProject }) {
  return (
    <article
      aria-labelledby={`featured-${project.id}`}
      tabIndex={0}
      data-nav-item
      className="rounded-sm border border-border bg-surface p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-text focus-visible:outline-offset-2"
    >
      <h3
        id={`featured-${project.id}`}
        className="text-title font-semibold text-text"
      >
        {project.name}
      </h3>
      <p className="mt-2 max-w-[65ch] text-body text-text">{project.tagline}</p>
      <p className="mt-2 text-detail text-text-muted">{project.forWho}</p>

      {project.install ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xs border border-border bg-bg p-3">
          <code className="min-w-0 flex-1 break-all text-detail text-text select-all">
            {project.install}
          </code>
          <CopyButton text={project.install} label={project.name} />
        </div>
      ) : (
        <p className="mt-4 rounded-xs border border-border bg-bg p-3 text-detail text-text-muted">
          {project.sourceLabel}
        </p>
      )}

      <p className="mt-3 text-detail text-text-muted">{project.builtWith}</p>

      <div
        aria-hidden="true"
        className="mt-4 rounded-xs border border-border bg-bg p-3 font-mono text-detail text-text-muted"
      >
        {project.preview.map((line) => (
          <p key={line} className="truncate">
            {line}
          </p>
        ))}
      </div>

      <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        <a
          href={project.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-nav-item
          className="flex min-h-11 items-center text-label font-semibold text-accent-text hover:underline"
        >
          Repo
        </a>
        <a
          href={project.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-nav-item
          className="flex min-h-11 items-center text-label font-semibold text-accent-text hover:underline"
        >
          {project.docsLabel}
        </a>
      </p>
    </article>
  );
}

export function FeaturedGrid() {
  return (
    <section aria-labelledby="featured-heading" className="mt-16">
      <h2
        id="featured-heading"
        className="text-headline font-semibold text-text"
      >
        Featured
      </h2>
      <p className="mt-2 max-w-[65ch] text-detail text-text-muted">
        Seven own products, most installable first. Newest agent tooling leads.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {FEATURED.map((project) => (
          <FeaturedCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
