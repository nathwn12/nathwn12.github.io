# nathwn12.github.io

Terminal-themed single-page portfolio and resume site for nathwn12, Backend Developer (C#, ASP.NET Core, fintech systems), where you explore experience, skills, projects, and contact through a command terminal with keyboard navigation, in light and dark themes.

## Install

Prerequisites: Node.js >= 20.11 and bun 1.4.4.

```powershell
git clone https://github.com/nathwn12/nathwn12.github.io.git
cd nathwn12.github.io
bun install --frozen-lockfile
bun run dev
bun run check
bun run build
```

`bun run build` runs `vite build`, copies `Nathaniel-Nikolai-Ladero-Resume.pdf`, `Nathaniel-Nikolai-Ladero-CV.pdf`, and `404.html` into `dist/`, and prerenders routes. Publishing runs through `.github/workflows/deploy.yml`: on push to `main` the build job installs, builds, and uploads `dist` as a Pages artifact, and the deploy job publishes it via `actions/deploy-pages` to the `github-pages` environment. No branch is published directly and no manual command deploys it.

## Development

```powershell
bun run typecheck
bun run test
```

`bun run check` runs the typecheck and the test (which builds first, then runs vitest).

## Updating from npm or pnpm

This repo uses [Bun](https://bun.sh) to install dependencies and run scripts; Node still runs the code.

```powershell
# once, if bun is missing
scoop install bun        # or: npm i -g bun / winget install Oven-sh.Bun

# in the repo
Remove-Item package-lock.json,pnpm-lock.yaml -ErrorAction SilentlyContinue
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
bun install
```

Use `bun run <script>` from then on. Commit `bun.lock` and never recreate the old lockfile; the repo pins `"packageManager": "bun@1.4.4"`.

## Status

Experimental and still moving. It works today, but it is not a finished
product: interfaces may change, features may be improved or removed, and a
release can break the one before it. This is maintained by one person, not a
team. If it breaks, open an issue with the command you ran and what you saw.

## Links

- [Live site](https://nathwn12.github.io)
- [MIT](LICENSE)
