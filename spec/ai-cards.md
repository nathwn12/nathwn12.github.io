# Per-repository AI cards (local adoption)

## Shape

`ai/` is the account's machine-reading shelf. One `ai/<repo>.json` and one
`ai/<repo>.md` exists per public, non-archived repository, plus
`ai/index.json`. `ai/llms.txt` keeps this site's own summary and carries one
generated, marked card index block, so every card is listed once with paths
that resolve under `/ai/`.

## Sources

Every field is copied from a committed snapshot; the generator never reaches
the network and invents no figure:

- `src/content/repos.probe.json` — name, visibility, fork parent, language,
  created and pushed dates, GitHub description.
- `src/content/ai-summaries.json` — each repository's own one-liner, stack,
  status, dates, capability and limit lists, plus stale/vanished markers.
- `src/content/projects.ts` — the declared topic tokens and the published npm
  package name, read as text so the script stays dependency-free.
- `src/content/open-source-stats.json` — the npm month and all-time counts.

## Contract

`node scripts/gen-ai-cards.mjs` writes only changed files; deterministic
bytes are two-space JSON with one trailing newline and names sorted by
repository. `node scripts/gen-ai-cards.mjs --check` fails on a missing,
drifted or stray card. The build copies the committed cards to `dist/ai/`
through `scripts/prerender-ai.mjs`. `.github/workflows/ai-cards.yml` runs on
a six-hour cron and on manual dispatch, and commits only `ai/*.json` and
`ai/*.md`.
