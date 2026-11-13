# nathwn12.github.io

The portfolio and record of Nathaniel Nikolai Ladero — software developer, C# and .NET
backend, in production since 2023. A near-black instrument panel that states what was
shipped and what it measurably did, with the receipts in the DOM: payment latency
60 s → under one second, reads down 40 %+, zero high or critical findings, 1,182 commits
recovered from 21 scanned repositories.

Live at **https://nathwn12.github.io**.

## Run it

Prerequisites: Node 20.19+ and bun 1.4.4.

```powershell
git clone https://github.com/nathwn12/nathwn12.github.io.git
cd nathwn12.github.io
bun install --frozen-lockfile
bun run preview:live
```

`preview:live` is the one to use while editing: a long-lived Vite server on
`http://127.0.0.1:5277` with the HMR overlay off, so a half-written save shows the last
good render instead of a red screen. It logs every module it pushes and writes
`preview-status.json`.

## Check it

```powershell
bun run check
```

Typecheck, then the contrast audit (28 pairs across both themes, exit 1 on any failure),
then the build and 367 tests. `bun run build` runs `vite build`, copies the résumé and CV
PDFs plus `404.html` into `dist/`, and prerenders each route to its own HTML file with its
own canonical and Open Graph tags.

`bun run probe:repos` re-reads the GitHub account and fails when the project list in
`src/content/projects.ts` no longer matches what is actually published — private and
archived repositories are excluded by definition, so the page cannot advertise a dead link.

## Deploy it

Push to `main`. `.github/workflows/deploy.yml` installs with a frozen lockfile, builds, and
publishes `dist` through `actions/deploy-pages` to the `github-pages` environment. Nothing
is published from a branch, and no manual command deploys it.

## Stack

React 19 · TypeScript 7 · Vite 8 · Tailwind CSS 4 (CSS-first) · GSAP 3.15 + Lenis ·
self-hosted Instrument Serif, Archivo and JetBrains Mono · Vitest 4 · bun.

## Design

`DESIGN.md` is the spec as it ships — palette with measured contrast, type scale, motion
rules, and the eyeball mandate that governs every visual claim.
