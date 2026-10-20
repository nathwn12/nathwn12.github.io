import { FEATURED } from "../content/portfolio";
import { CopyButton } from "./CopyButton";

/**
 * InstallStrip — copy-paste bar per installable (B §3).
 *
 * One row per stranger-installable featured project (5 of 7; slowburn and
 * Potflix are source-only and appear here as honest labels, never with a
 * fake install button). Each row is one click to copy or one drag-select.
 */
const INSTALLABLE = FEATURED.filter((p) => p.install !== null);
const SOURCE_ONLY = FEATURED.filter((p) => p.install === null);

export function InstallStrip() {
  return (
    <section aria-labelledby="install-heading" className="mt-16">
      <h2 id="install-heading" className="text-headline font-semibold text-text">
        Install
      </h2>
      <p className="mt-2 max-w-[65ch] text-detail text-text-muted">
        One copy-paste per installable. Verify with the linked docs.
      </p>
      <ul className="mt-6 space-y-3">
        {INSTALLABLE.map((project) => (
          <li
            key={project.id}
            className="flex flex-wrap items-center gap-3 rounded-sm border border-border bg-surface p-4"
          >
            <span className="min-w-28 text-label font-semibold text-text">
              {project.name}
            </span>
            <code className="min-w-0 flex-1 break-all text-detail text-text select-all">
              {project.install}
            </code>
            <CopyButton text={project.install!} label={project.name} />
          </li>
        ))}
      </ul>
      <ul className="mt-3 space-y-3">
        {SOURCE_ONLY.map((project) => (
          <li
            key={project.id}
            className="rounded-sm border border-border bg-surface p-4"
          >
            <p className="text-label font-semibold text-text">{project.name}</p>
            <p className="mt-1 text-detail text-text-muted">
              {project.sourceLabel}{" "}
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-nav-item
                className="font-medium text-accent-text hover:underline"
              >
                Repo
              </a>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
