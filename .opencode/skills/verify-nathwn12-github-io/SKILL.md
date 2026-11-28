---
name: verify-nathwn12-github-io
description: Use before claiming any build, behavior or rendered-page result for this portfolio. Wraps the surviving gates and the dist render instrument. Numbers are measured, never passed by a threshold.
---

# Verify nathwn12.GitHub.io

The proof for a rendered claim is the built `dist/` artefact. Nothing below substitutes for looking at the PNGs.

## 1. Build

From the repo root, on bun 1.4.4 and node >= 20.19:

```pwsh
bun install --frozen-lockfile
bun run build
```

`bun run build` is `vite build && node scripts/copy-404.mjs && node scripts/prerender-routes.mjs`.
The route stubs are redirects, not second copies of the record. Build duration is not measured here.

## 2. Gates

`bun run check` is the gate: `bun run typecheck && bun run test`, where `bun run test`
rebuilds and runs vitest. It exits 1 on a type, build or behavior failure.
`bun run probe:repos` exits 1 when `src/content/projects.ts` stops matching what GitHub publishes.

A green gate proves the type, build and behavior facts only. It says nothing about how the page reads.

## 3. Render

The dist screenshot instrument serves `dist/` through Playwright request interception and needs
no HTTP server. Never start one for this, and never point it at a dev server. Run it from the repo
root with a fresh output directory each run:

```pwsh
node <dist-shot-instrument> dist <fresh-output-dir>
```

A fresh directory matters: shots from an earlier build beside a new `facts.json` are evidence of a different page.

## 4. Evidence

The instrument writes three shots — `shot-1440x900.png`, `shot-768x1024.png`,
`shot-390x844.png` — and `facts.json`. Per shot the facts are the document title, the six section
ids, the five nav hrefs, the h1, the h2 count, `mainTextLength`, font status, `dataTheme`, the
non-200 request count, the computed body font and the computed body background.

A rendered claim is Unverified unless it cites a value from `facts.json` or a gate that exited 0;
to be accepted as design it needs the PNG looked at.

## 5. Cleanup

1. Delete the output directory this run created.
2. `git status --short` must be empty.

`dist/` and `*.tsbuildinfo` are ignored, so a line here is a file the run left behind that it should not have.

## What this cannot prove

- no threshold: the instrument records facts and compares none of them
- no baseline diff: nothing is compared against an earlier run
- no accessibility gate: focus order and semantics are not audited
- no motion proof: no animation is exercised
- a crash mid-run can leave shots and no `facts.json`, because the record is written once at the end
