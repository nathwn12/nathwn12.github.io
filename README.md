<p align="center">
  <img src="assets/icon.svg" width="120" height="120" alt="nathwn12.github.io icon" />
</p>
<h1 align="center">nathwn12.github.io</h1>
<p align="center"><strong>Personal portfolio and resume site — React + Vite.</strong></p>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/nathwn12/nathwn12.github.io" alt="License" /></a>
  <img src="https://img.shields.io/github/languages/top/nathwn12/nathwn12.github.io" alt="Language" />
</p>

## What it is

Portfolio and resume site for Nathaniel Nikolai Ladero, Backend Developer
(C#, ASP.NET Core, fintech systems). One page carries the cover, the record
summary, selected work, about, and contact; `/record` holds the full nine-entry
experience log and `/work` holds all eleven projects. The design is set as a
delivery statement in one Newsreader face, with a ledger-green cover, an ink
record field, and stone paper. Every route is prerendered to real HTML; retired
public paths redirect with a canonical stub. Live at
https://nathwn12.github.io.

## Build from source

Prerequisites: Node.js >= 20.11 and pnpm 10.33.2.

```powershell
git clone https://github.com/nathwn12/nathwn12.github.io.git
cd nathwn12.github.io
pnpm install --frozen-lockfile
pnpm run dev
pnpm run check
pnpm run build
```

`pnpm run build` runs `vite build`, copies the two PDFs and `404.html` into
`dist/`, then pre-renders a real `dist/<path>/index.html` for every live route
and a meta-refresh stub at every retired path. Publishing runs through
`.github/workflows/deploy.yml`: on push to `main` the build job installs,
builds, and uploads `dist` as a Pages artifact, and the deploy job publishes it
via `actions/deploy-pages` to the `github-pages` environment. No branch is
published directly and no manual command deploys it.

## Status

**Active** — maintained, issues welcome.

Live at https://nathwn12.github.io.

## License

MIT — see [LICENSE](LICENSE).

<!-- nathwn12 house footer: identical in every repo. Do not edit. -->
<p align="center">
  <a href="https://github.com/nathwn12"><img src="assets/signature.svg" width="96" alt="nathwn12" /></a>
</p>
<p align="center">
  <sub>Built by <a href="https://github.com/nathwn12">nathwn12</a> · <a href="https://github.com/nathwn12?tab=repositories">All projects</a></sub>
</p>
