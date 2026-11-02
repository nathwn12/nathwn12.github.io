# nathwn12.github.io

Terminal-themed single-page portfolio and resume site for nathwn12, Backend Developer (C#, ASP.NET Core, fintech systems), where you explore experience, skills, projects, and contact through a command terminal with keyboard navigation, in light and dark themes.

## Install

Prerequisites: Node.js >= 20.11 and pnpm 10.33.2.

```powershell
git clone https://github.com/nathwn12/nathwn12.github.io.git
cd nathwn12.github.io
pnpm install --frozen-lockfile
pnpm run dev
pnpm run check
pnpm run build
```

`pnpm run build` runs `vite build`, copies `Nathaniel-Nikolai-Ladero-Resume.pdf`, `Nathaniel-Nikolai-Ladero-CV.pdf`, and `404.html` into `dist/`, and prerenders routes. Publishing runs through `.github/workflows/deploy.yml`: on push to `main` the build job installs, builds, and uploads `dist` as a Pages artifact, and the deploy job publishes it via `actions/deploy-pages` to the `github-pages` environment. No branch is published directly and no manual command deploys it.

## Development

```powershell
pnpm run typecheck
pnpm run test
```

`pnpm run check` runs the typecheck and the test (which builds first, then runs vitest).

## Status

Experimental and still moving. It works today, but it is not a finished
product: interfaces may change, features may be improved or removed, and a
release can break the one before it. This is maintained by one person, not a
team. If it breaks, open an issue with the command you ran and what you saw.

## Links

- [Live site](https://nathwn12.github.io)
- [MIT](LICENSE)
